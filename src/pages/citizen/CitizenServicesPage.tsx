import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Droplet, Truck, TestTube, PlusCircle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const services = [
  {
    id: 'tanker',
    title: 'Emergency Water Tanker Request',
    description: 'Request a municipal drinking water tanker for community events or localized supply cuts.',
    icon: Truck,
    color: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    id: 'testing',
    title: 'Water Quality & Potability Lab Test',
    description: 'Request on-site chemical, chlorine, and turbidity analysis from the municipal lab.',
    icon: TestTube,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    id: 'connection',
    title: 'New Municipal Water Pipeline Connection',
    description: 'Apply for residential or commercial water tap connection under Har Ghar Nal Ka Jal.',
    icon: PlusCircle,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
] as const;

export const CitizenServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<(typeof services)[number] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [details, setDetails] = useState('');

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Municipal Water Services
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden="true" />
            Ongoing
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Access civic water infrastructure utilities provided by Muzaffarpur Municipal Corporation.
        </p>
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800">
          <span className="font-semibold">Services are ongoing:</span> applications are currently in prototype review
          and will be connected to municipal processing in the next stage.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((srv) => {
          const Icon = srv.icon;
          return (
            <Card key={srv.id} variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 rounded-2xl ${srv.color} border flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{srv.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">{srv.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedService(srv);
                  setSubmitted(false);
                  setDetails('');
                }}
              >
                Apply for Service
              </Button>
            </Card>
          );
        })}
      </div>

      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedService(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-application-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Service application</p>
                <h3 id="service-application-title" className="mt-1 text-lg font-bold text-slate-900">
                  {selectedService.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close service application"
              >
                ×
              </button>
            </div>

            {submitted ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Application details captured for review.</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Database submission is not enabled yet, so no request has been created. This prototype form is ready
                  for the next backend integration step.
                </p>
                <Button type="button" size="sm" className="mt-4" onClick={() => setSelectedService(null)}>
                  Close
                </Button>
              </div>
            ) : (
              <form
                className="mt-5 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubmitted(true);
                }}
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Applicant name</span>
                  <input
                    required
                    name="applicantName"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter your name"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Contact number</span>
                  <input
                    required
                    name="contactNumber"
                    type="tel"
                    pattern="[0-9]{10}"
                    title="Enter a 10-digit mobile number"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="10-digit mobile number"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Location / address</span>
                  <textarea
                    required
                    name="address"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter service location"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Additional details</span>
                  <textarea
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    name="details"
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Add any relevant details (optional)"
                  />
                </label>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedService(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Continue
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
