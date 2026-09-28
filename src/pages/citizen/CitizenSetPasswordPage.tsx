import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { Button } from '../../components/ui/Button';
import {
  Lock,
  Eye,
  EyeOff,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export const CitizenSetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('mode') === 'reset';

  const { refreshProfile } = useAuth();
  const locationState = location.state as { email?: string; verified?: boolean } | undefined;
  const email = locationState?.email || '';

  const [fullName, setFullName] = useState('');
  const [wardName, setWardName] = useState('Ward 12 - Pokhraira Central');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!isResetMode && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Set password in Supabase Auth
      const passRes = await authService.setPassword(password);
      if (!passRes.success) {
        setIsLoading(false);
        setError(passRes.error || 'Failed to update password.');
        return;
      }

      // 2. Update profile if in new account creation mode
      const user = await authService.getCurrentUser();
      if (user && !isResetMode) {
        await authService.updateProfile(user.id, {
          fullName: fullName.trim(),
          wardName,
        });
      }

      await refreshProfile();
      setIsLoading(false);

      // Successfully authenticated & created!
      navigate('/home', { replace: true });
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Error configuring account credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 font-sans text-left">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <JalSetuLogo size="sm" showTagline={false} />
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Email Verified</span>
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
            {isResetMode ? 'Step 2: Password Reset' : 'Step 2: Account Password Setup'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {isResetMode ? 'Set New Password' : 'Create Your Password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            {isResetMode
              ? 'Enter your new secure password for future logins.'
              : 'Set your password to easily sign in with your email and password in the future.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResetMode && (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Ward */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Residential Ward *
                </label>
                <div className="relative">
                  <select
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Ward 12 - Pokhraira Central">Ward 12 - Pokhraira Central</option>
                    <option value="Ward 8 - Saraiyaganj North">Ward 8 - Saraiyaganj North</option>
                    <option value="Ward 4 - Brahampura Market">Ward 4 - Brahampura Market</option>
                    <option value="Ward 9 - Sutapatti Commerce">Ward 9 - Sutapatti Commerce</option>
                    <option value="Ward 11 - Mithanpura Sector">Ward 11 - Mithanpura Sector</option>
                    <option value="Ward 14 - Kazi Mohammadpur">Ward 14 - Kazi Mohammadpur</option>
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              New Password (Min 6 characters) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 py-2.5 pl-10 pr-10 focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <Button
            type="submit"
            variant="civic"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isResetMode ? 'Save New Password & Continue' : 'Complete Registration & Enter App'}
          </Button>
        </form>
      </div>
    </div>
  );
};
