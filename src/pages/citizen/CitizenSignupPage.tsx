import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowRight, Shield, Droplets, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export const CitizenSignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as {
    flow?: 'report';
    returnTo?: string;
    returnState?: unknown;
  } | null;
  const isReportFlow = returnState?.flow === 'report';

  const handleSkipForNow = async () => {
    setIsSkipping(true);
    setError(null);
    try {
      await signOut();
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Unable to continue as a guest. Please try again.');
      setIsSkipping(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await authService.signInWithOtp(email.trim());
    setIsLoading(false);

    if (result.success) {
      navigate('/verify-otp', {
        state: {
          email: email.trim(),
          flow: returnState?.flow === 'report' ? 'report' : 'signup',
          returnTo: returnState?.returnTo,
          returnState: returnState?.returnState,
        },
      });
    } else {
      setError(result.error || 'Failed to send verification code. Please check your email and try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* Left Civic Hero Section */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#0B1527] via-[#0F224A] to-[#0369A1] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden select-none">
        <div className="relative z-10">
          <JalSetuLogo size="lg" variant="light" showTagline={true} />
        </div>

        <div className="my-12 relative z-10 max-w-lg space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>Join Bihar Water Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Register as a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-200 to-white">
              Civic Guardian
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {isReportFlow
              ? 'Verify your email with a 6-digit OTP to continue to the citizen issue reporting form.'
              : 'Create your citizen account in two simple steps: verify your email via a 6-digit OTP, then set your personal password for fast future logins.'}
          </p>

          {!isReportFlow && <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-sky-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Step 1: Email OTP Verification</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-semibold">
              <span className="w-4 h-4 rounded-full border border-slate-500 text-[10px] flex items-center justify-center">2</span>
              <span>Step 2: Set Your Password & Profile</span>
            </div>
          </div>}
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Muzaffarpur Municipal Corporation</span>
          <span className="font-mono">Citizen Sign Up</span>
        </div>
      </div>

      {/* Right Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-6 text-left">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 block mb-1">
              {isReportFlow ? 'Citizen Verification' : 'New Registration'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isReportFlow ? 'Verify to Report an Issue' : 'Create Citizen Account'}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              {isReportFlow
                ? 'Enter your citizen email to receive a 6-digit OTP and continue to your report.'
                : 'Enter your email address to receive an instant 6-digit verification code.'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  autoComplete="email"
                  autoFocus
                  className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
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
              Send Verification Code (OTP)
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-slate-500 hover:text-sky-700 hover:underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
            >
              I already have an account
            </button>
            <button
              type="button"
              onClick={handleSkipForNow}
              disabled={isLoading || isSkipping}
              className="text-xs font-semibold text-slate-500 hover:text-sky-700 hover:underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
