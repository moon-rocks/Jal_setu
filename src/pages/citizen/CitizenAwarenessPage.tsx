import React from 'react';
import { Card } from '../../components/ui/Card';
import { Droplets, Sparkles, BookOpen, CheckCircle, ShieldCheck } from 'lucide-react';

export const CitizenAwarenessPage: React.FC = () => {
  const tips = [
    {
      title: 'Fix Dripping Taps Immediately',
      stat: 'Saves 30 to 50 Liters / day',
      desc: 'A tap that drips once per second can waste more than 3,000 gallons of water per year. Report broken public standposts immediately on JalSetu.',
    },
    {
      title: 'Adopt Rainwater Harvesting in Bihar',
      stat: 'Recharges ground aquifer',
      desc: 'Directing monsoon runoff from rooftops into soak pits replenishes groundwater levels across north Bihar plain districts.',
    },
    {
      title: 'Avoid Direct Hose Pipe Washing',
      stat: 'Saves 200 Liters / wash',
      desc: 'Use a bucket and sponge instead of a continuous running hose when washing vehicles or courtyards.',
    },
    {
      title: 'Inspect Underground Sump Floats',
      stat: 'Prevents massive overflow',
      desc: 'Faulty float valves in residential storage tanks cause thousands of liters of clean municipal water to spill onto streets daily.',
    },
  ];

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-sky-600 to-blue-800 rounded-3xl p-6 sm:p-8 text-white">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
          Civic Education
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
          Water Conservation & Safe Drinking Habits
        </h2>
        <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
          Clean drinking water is Bihar&apos;s most vital public asset. Discover actionable steps to eliminate waste and safeguard public water lines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, idx) => (
          <Card key={idx} variant="default" padding="md" className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-700">
              {tip.stat}
            </span>
            <h3 className="text-base font-bold text-slate-900">{tip.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{tip.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
