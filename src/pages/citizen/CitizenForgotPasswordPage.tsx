import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, HelpCircle, Shield } from 'lucide-react';
import { authService } from '../../services/authService';

export const CitizenForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const res = await authService.signInWithOtp(email.trim());
    setIsLoading(false);

    if (res.success) {
      navigate('/verify-otp', { state: { email: email.trim(), flow: 'reset' } });
    } else {
      setError(res.error || 'Failed to send password reset code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 font-sans text-left">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <NavLink
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </NavLink>
          <JalSetuLogo size="sm" showTagline={false} />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
            Citizen Account Recovery
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Forgot Password?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Enter your registered email address. We will send you an OTP verification code to reset your account password.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Registered Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                required
                autoComplete="email"
                autoFocus
                className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 py-3 pl-10 pr-4 focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <Button
            type="submit"
            variant="civic"
            size="lg"
            isLoading={isLoading}
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Send Reset OTP Code
          </Button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <NavLink
            to="/login"
            className="text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors"
          >
            Remembered your password? Sign in →
          </NavLink>
        </div>
      </div>
    </div>
  );
};
