import {
  BadgeCheck,
  CircleCheck,
  ClipboardPlus,
  MapPinned,
  Wrench,
} from 'lucide-react';

const jalSetuSteps = [
  {
    title: 'Report',
    description: 'Share the issue and add a photo.',
    detail: 'Report received',
    icon: <ClipboardPlus className="w-6 h-6" />,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    number: 'text-emerald-200',
  },
  {
    title: 'Locate',
    description: 'Pinpoint the affected water point.',
    detail: 'Location confirmed',
    icon: <MapPinned className="w-6 h-6" />,
    accent: 'bg-lime-50 text-lime-700 border-lime-100',
    number: 'text-lime-200',
  },
  {
    title: 'Verify',
    description: 'Municipal staff confirm the report.',
    detail: 'Verified by staff',
    icon: <BadgeCheck className="w-6 h-6" />,
    accent: 'bg-teal-50 text-teal-700 border-teal-100',
    number: 'text-teal-200',
  },
  {
    title: 'Assign & Repair',
    description: 'The right field team is dispatched.',
    detail: 'Repair underway',
    icon: <Wrench className="w-6 h-6" />,
    accent: 'bg-green-50 text-green-700 border-green-100',
    number: 'text-green-200',
  },
  {
    title: 'Resolved',
    description: 'Track the fix and final update.',
    detail: 'Status updated',
    icon: <CircleCheck className="w-6 h-6" />,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    number: 'text-emerald-200',
  },
];

export function JalSetuProcessSection() {
  return (
    <section aria-labelledby="jalsetu-steps-title" className="block overflow-hidden rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/60 px-4 py-4 shadow-sm sm:rounded-3xl sm:px-7 sm:py-8 sm:shadow-[0_22px_55px_rgba(15,23,42,0.06)] lg:px-9 lg:py-9">
      <div className="mb-5 text-center sm:mb-8 lg:mb-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">
          A clear path to cleaner water
        </p>
        <h2 id="jalsetu-steps-title" className="mt-2 text-xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
          How JalSetu Works
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
          From your first report to a verified repair.
        </p>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-3 max-sm:mx-0 max-sm:overflow-visible max-sm:px-0 max-sm:pb-0 sm:-mx-7 sm:px-7 lg:-mx-9 lg:px-9 [scrollbar-width:thin]">
        <ol className="relative flex min-w-max gap-4 before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-12 before:h-0.5 before:bg-gradient-to-r before:from-emerald-300 before:via-teal-300 before:to-green-300 before:content-[''] max-sm:grid max-sm:min-w-0 max-sm:grid-cols-1 max-sm:gap-3 max-sm:before:hidden xl:grid xl:min-w-0 xl:grid-cols-5">
          {jalSetuSteps.map((step, index) => (
            <li key={step.title} className="relative z-10 w-[224px] max-sm:w-full xl:w-auto">
              <article className="group relative isolate flex h-full min-h-[276px] flex-col overflow-hidden rounded-2xl border border-white/90 bg-white/80 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.09)] ring-1 ring-emerald-100/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-[0_24px_48px_rgba(5,150,105,0.17)] max-sm:min-h-0 max-sm:rounded-xl max-sm:p-4">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/95 via-white/70 to-emerald-50/90 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10 flex h-14 items-center justify-between max-sm:h-10">
                  <span className={`font-serif text-6xl font-black leading-none opacity-80 max-sm:text-5xl ${step.number}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm ring-4 ring-white/70 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md max-sm:h-10 max-sm:w-10 max-sm:rounded-xl ${step.accent}`}>
                    {step.icon}
                  </span>
                </div>
                <h3 className="relative z-10 mt-5 min-h-7 text-base font-extrabold text-slate-900 max-sm:mt-2 max-sm:min-h-0 max-sm:text-sm">
                  {step.title}
                </h3>
                <p className="relative z-10 mt-1 flex-1 text-sm leading-relaxed text-slate-600 max-sm:text-xs">
                  {step.description}
                </p>
                <div className="relative z-10 mt-5 border-t border-emerald-100/90 pt-4 max-sm:mt-3 max-sm:pt-2.5">
                  <span className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-700 max-sm:text-[10px]">
                    <CircleCheck className="h-3.5 w-3.5 shrink-0" />
                    {step.detail}
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}