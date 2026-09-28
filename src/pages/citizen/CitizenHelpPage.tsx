import React from 'react';
import { Card } from '../../components/ui/Card';
import { Phone, Mail, MapPin, HelpCircle, AlertTriangle } from 'lucide-react';

export const CitizenHelpPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Help & Support Center
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Emergency response contacts and guidance for Muzaffarpur water consumers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="default" padding="md" className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">24x7 Emergency Pipeline Helpline</h3>
          <p className="text-xs text-slate-500">For major water main bursts and sewage contamination</p>
          <p className="text-sm font-bold text-rose-600 font-mono pt-1">1800-345-6789</p>
        </Card>

        <Card variant="default" padding="md" className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Municipal Water Desk Email</h3>
          <p className="text-xs text-slate-500">For non-urgent queries and billing questions</p>
          <p className="text-xs font-bold text-sky-700 font-mono pt-1">water.desk@muzaffarpur.gov.in</p>
        </Card>

        <Card variant="default" padding="md" className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Municipal Headquarters</h3>
          <p className="text-xs text-slate-500">Muzaffarpur Municipal Corporation, Station Road</p>
          <p className="text-xs font-semibold text-slate-700 pt-1">Office Hours: 9:30 AM – 5:30 PM</p>
        </Card>
      </div>

      <Card variant="default" padding="md" className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
        <div className="space-y-3 divide-y divide-slate-100 text-xs">
          <div className="pt-2">
            <h4 className="font-bold text-slate-900">How long does an emergency pipe repair take?</h4>
            <p className="text-slate-600 mt-0.5">High-priority burst mains are isolated within 45 minutes; replacement sleeves are installed on average within 4.2 hours.</p>
          </div>
          <div className="pt-3">
            <h4 className="font-bold text-slate-900">Why does JalSetu require photo evidence?</h4>
            <p className="text-slate-600 mt-0.5">Photographs enable automated verification and ensure field repair teams arrive with the correct diameter pipes, valves, and clamping tools.</p>
          </div>
          <div className="pt-3">
            <h4 className="font-bold text-slate-900">Is my location shared publicly?</h4>
            <p className="text-slate-600 mt-0.5">No. Exact GPS coordinates are securely watermarked and only visible to authorized municipal control engineers and assigned field crew.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
