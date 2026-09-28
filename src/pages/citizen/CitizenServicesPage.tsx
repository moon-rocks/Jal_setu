import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Droplet, Truck, TestTube, PlusCircle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CitizenServicesPage: React.FC = () => {
  const navigate = useNavigate();

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
  ];

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Municipal Water Services
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Access civic water infrastructure utilities provided by Muzaffarpur Municipal Corporation.
        </p>
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
                onClick={() => alert(`Service application (${srv.title}) ready for Stage 1 backend integration.`)}
              >
                Apply for Service
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
