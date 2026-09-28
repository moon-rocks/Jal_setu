import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Phone, MapPin, ArrowRight, ShieldCheck, Compass, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useLocationContext } from '../../context/LocationContext';
import { locationService } from '../../services/locationService';

export const CitizenProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { location, isLocating, getFreshLocation } = useLocationContext();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState(location?.wardNumber || '');
  const [address, setAddress] = useState(location?.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(Boolean(location));
  const [wards, setWards] = useState<{ id: string; wardNumber: string; name: string; city: string }[]>([]);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    locationService.getWards().then(setWards).catch((error) => {
      setDataError(error instanceof Error ? error.message : 'Unable to load municipal wards.');
    });
  }, []);

  const handleDetectGPS = async () => {
    const loc = await getFreshLocation();
    if (loc) {
      setGpsDetected(true);
      if (loc.wardNumber) {
        setWard(loc.wardNumber);
      }
      if (loc.address) {
        setAddress(loc.address);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const user = await authService.getCurrentUser();
    if (user) {
      await authService.updateProfile(user.id, {
        fullName,
        phone,
        wardName: ward,
        address,
      });
    }

    setIsLoading(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <JalSetuLogo size="sm" showTagline={false} />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
            Step 3 of 3: Profile
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Complete your profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Setting your municipal ward enables faster response times and local water disruption notices.
          </p>
        </div>

        {/* GPS Quick Detect Action */}
        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                {gpsDetected && location
                  ? `GPS Detected: ${location.ward}`
                  : 'Detect Location via GPS'}
              </p>
              <p className="text-[11px] text-slate-500">
                {gpsDetected && location
                  ? `${location.address || `${location.ward}, ${location.city}`} (GPS Accuracy ±${location.accuracy}m)`
                  : 'Auto-fill your official municipal ward and street address'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant={gpsDetected ? 'secondary' : 'civic'}
            size="sm"
            onClick={handleDetectGPS}
            isLoading={isLocating}
            leftIcon={gpsDetected ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Compass className="w-3.5 h-3.5" />}
            className="shrink-0"
          >
            {gpsDetected ? 'Re-detect GPS' : 'Detect via GPS'}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Chandresh Kumar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          {dataError && <p className="text-xs text-rose-600">{dataError}</p>}

          <Input
            label="Mobile Number (for SMS dispatch updates)"
            type="tel"
            placeholder="e.g. 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700 select-none">
              Municipal Ward
            </label>
            <div className="relative">
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-200 py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
              >
                <option value="">Select a ward</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.wardNumber}>
                    {w.name} — {w.city}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              {wards.length ? 'Ward boundaries are auto-verified with GIS during problem submission.' : 'No municipal ward records are available.'}
            </p>
          </div>

          <Input
            label="Street / Landmark Address"
            type="text"
            placeholder="e.g. Near Kali Mandir, Main Road"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="civic"
              size="lg"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Setup & Enter JalSetu
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-2 p-3 bg-sky-50/60 rounded-xl border border-sky-100 text-xs text-sky-800">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            Your data is strictly encrypted and shared only with on-duty municipal repair engineers.
          </span>
        </div>
      </div>
    </div>
  );
};
