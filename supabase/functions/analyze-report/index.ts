import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const parseGeminiJson = (text: string) => {
  const cleaned = text.trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Gemini returned malformed JSON.');
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
};

const encodeBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ success: false, error: 'Supabase environment is not configured.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload = await req.json();
    const { reportId, photoUrl, issueType, description, latitude, longitude, wardName } = payload ?? {};

    if (!reportId) {
      return new Response(JSON.stringify({ success: false, error: 'A reportId is required for AI analysis.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!geminiApiKey) {
      await supabase.from('reports').update({ ai_status: 'human_review_required' }).eq('id', reportId);
      return new Response(JSON.stringify({ success: false, error: 'AI analysis is unavailable: Gemini API key is not configured.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const promptText = `Analyze this water issue report for municipal operations. Return JSON only.
Issue Type: ${String(issueType || 'unknown')}
Description: ${String(description || 'No description provided')}
Ward: ${String(wardName || 'Unknown ward')}
Coordinates: ${latitude ?? 'unknown'}, ${longitude ?? 'unknown'}
Photo URL: ${photoUrl || 'No image provided'}

Requirements:
- confidence: number between 75 and 98
- summary: 1-2 sentence engineering assessment
- recommendation: a repair action for the municipal team
- detectedFeatures: string[] with 3-5 short evidence items
- issueLabel: short label for the detected issue
`;

    const imageParts: Array<Record<string, unknown>> = [];
    if (photoUrl) {
      const photoResponse = await fetch(photoUrl);
      if (!photoResponse.ok) throw new Error(`Evidence photo fetch failed (${photoResponse.status}).`);
      const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
      const bytes = new Uint8Array(await photoResponse.arrayBuffer());
      imageParts.push({ inline_data: { mime_type: contentType, data: encodeBase64(bytes) } });
    }

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            ...imageParts,
          ],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`Gemini request failed (${aiResponse.status}): ${errorText.slice(0, 200)}`);
    }

    const aiData = await aiResponse.json();
    const textReply = aiData?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .join('') || '';

    if (!textReply) {
      throw new Error('Gemini returned no usable content.');
    }

    const parsed = parseGeminiJson(textReply);
    const confidence = Number(parsed.confidence ?? 0);
    const summary = String(parsed.summary || 'Human review required for this report.');
    const recommendation = String(parsed.recommendation || 'Dispatch a municipal field crew for manual verification.');
    const detectedFeatures = Array.isArray(parsed.detectedFeatures) ? parsed.detectedFeatures.map((item) => String(item)).slice(0, 5) : [];
    const issueLabel = String(parsed.issueLabel || issueType || 'water_issue');

    if (!Number.isFinite(confidence) || confidence < 75 || confidence > 98) {
      throw new Error('Gemini returned an invalid confidence score.');
    }

    const analysisInsert = {
      report_id: reportId,
      issue_type: issueLabel,
      severity: 'high',
      confidence,
      summary,
      recommendation,
      detected_features: detectedFeatures,
      model: 'gemini-2.5-flash',
    };

    const insertResponse = await supabase.from('ai_analyses').insert(analysisInsert);
    if (insertResponse.error) {
      throw new Error(insertResponse.error.message);
    }

    const updateResponse = await supabase.from('reports').update({
      ai_status: 'verified_by_ai',
      ai_confidence: confidence,
      ai_evidence: detectedFeatures,
      updated_at: new Date().toISOString(),
    }).eq('id', reportId);

    if (updateResponse.error) {
      throw new Error(updateResponse.error.message);
    }

    return new Response(JSON.stringify({ success: true, confidence, summary, recommendation, detectedFeatures, issueLabel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI analysis failed.';

    if (typeof (globalThis as any).Deno !== 'undefined') {
      const maybeReportId = await req.clone().json().catch(() => ({})).then((body) => body?.reportId).catch(() => undefined);
      if (maybeReportId) {
        await supabase.from('reports').update({ ai_status: 'human_review_required', updated_at: new Date().toISOString() }).eq('id', maybeReportId);
      }
    }

    return new Response(JSON.stringify({ success: false, error: message, requiresHumanReview: true }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
