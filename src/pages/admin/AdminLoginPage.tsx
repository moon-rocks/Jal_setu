import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Lock, UserCheck, ArrowRight, Building2, Droplets, AlertCircle, HardHat } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuth();
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Water Supply & Drainage Division');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerId.trim() || !password) {
      setError('Please enter your municipal officer email and password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await signInWithPassword(officerId.trim(), password, 'admin');
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Authentication failed. Please verify your municipal officer credentials.');
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#080E1A] font-sans">
      {/* Left Municipal Authority Branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#0B1527] via-[#091730] to-[#04284D] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden select-none border-r border-slate-800">
        <div className="relative z-10">
          <JalSetuLogo size="lg" variant="light" adminBadge={true} showTagline={false} />
        </div>

        <div className="my-12 relative z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/20 text-xs font-semibold text-sky-300">
            <Building2 className="w-3.5 h-3.5" />
            <span>Muzaffarpur Municipal Corporation Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Municipal Water Infrastructure Operations Control
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Administrative command center for reviewing citizen leak reports, verifying GIS ward boundaries, managing field dispatch teams, and supervising telemetry alerts.
          </p>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Restricted Municipal Access</span>
            </div>
            <p className="text-[11px] text-slate-400">
              This terminal is monitored for official municipal administration. Unauthorized access attempts are logged with biometric and IP telemetry.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Har Boond, Behtar Bihar.</span>
          <span className="font-mono">Security Level: Tier 1</span>
        </div>
      </div>

      {/* Right Login Box */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block mb-1">
              Authorized Personnel
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Admin Console
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your municipal credential identifiers to access the command panel.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Municipal Officer Email"
              type="email"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              leftIcon={<UserCheck className="w-4 h-4" />}
              required
            />

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">
                Department Division
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-200 py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
              >
                <option value="Water Supply & Drainage Division">Water Supply & Drainage Division</option>
                <option value="Rapid Leakage Response Unit">Rapid Leakage Response Unit</option>
                <option value="Municipal GIS & Telemetry Center">Municipal GIS & Telemetry Center</option>
                <option value="Executive Officer Operations">Executive Officer Operations</option>
              </select>
            </div>

            <Input
              label="Security Key / Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="civic"
              size="lg"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Admin Panel
            </Button>
          </form>

          {/* Switch to Citizen or Team Member Login */}
          <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-center text-xs">
            <NavLink
              to="/team/login"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-amber-700 font-semibold transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <HardHat className="w-3.5 h-3.5 text-amber-600" />
              <span>Team Login</span>
            </NavLink>

            <NavLink
              to="/home"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-sky-700 font-semibold transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Citizen Portal</span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
