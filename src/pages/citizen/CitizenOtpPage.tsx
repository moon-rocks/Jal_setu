import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { JalSetuLogo } from '../../components/ui/JalSetuLogo';
import { OTPInput } from '../../components/ui/OTPInput';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ArrowRight, RotateCw, CheckCircle2, AlertCircle, Home } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export const CitizenOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    email?: string;
    flow?: 'signup' | 'reset' | 'login' | 'report';
    returnTo?: string;
    returnState?: unknown;
  } | undefined;

  const email = locationState?.email || '';
  const flow = locationState?.flow || 'signup';
  const { signOut } = useAuth();

  const [otpValue, setOtpValue] = useState('');
  const [visualState, setVisualState] = useState<'normal' | 'loading' | 'invalid' | 'expired' | 'success'>('normal');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  // If user opens page without email, redirect to signup
  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otpValue.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP verification code.');
      setVisualState('invalid');
      return;
    }

    setVisualState('loading');
    setErrorMsg('');

    const result = await authService.verifyOtp(email, otpValue);

    if (result.success) {
      setVisualState('success');
      setTimeout(() => {
        if (flow === 'reset') {
          navigate('/set-password?mode=reset', { state: { email, verified: true } });
        } else if (flow === 'report') {
          navigate(locationState?.returnTo || '/report', {
            replace: true,
            state: locationState?.returnState,
          });
        } else {
          navigate('/set-password', { state: { email, verified: true } });
        }
      }, 600);
    } else {
      setErrorMsg(result.error || 'Incorrect or expired verification code. Please check your email.');
      setVisualState('invalid');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setVisualState('normal');
    setOtpValue('');
    setResendNotice(null);

    const res = await authService.signInWithOtp(email);
    if (res.success) {
      setResendTimer(30);
      setCanResend(false);
      setResendNotice('New 6-digit verification code dispatched to your email.');
      setTimeout(() => setResendNotice(null), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to resend code. Please try again.');
    }
  };

  const handleSkipForNow = async () => {
    setIsSkipping(true);
    setErrorMsg('');
    try {
      await signOut();
      navigate('/home', { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to continue as a guest. Please try again.');
      setVisualState('invalid');
      setIsSkipping(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 text-left">
        {/* Back Link & Brand */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => navigate(flow === 'reset' ? '/forgot-password' : '/signup')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Email</span>
          </button>
          <JalSetuLogo size="sm" showTagline={false} />
        </div>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
            {flow === 'reset' ? 'Password Reset Verification' : 'Citizen Verification'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Verify your email
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Enter the 6-digit OTP code sent to{' '}
            <span className="font-semibold text-slate-800 font-mono">{email}</span>
          </p>
        </div>

        {resendNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center">
            {resendNotice}
          </div>
        )}

        {/* 6-Digit OTP Input */}
        <div className="py-2">
          <OTPInput
            length={6}
            value={otpValue}
            onChange={(val) => {
              setOtpValue(val);
              if (visualState !== 'normal') setVisualState('normal');
            }}
            state={visualState}
            errorMessage={visualState === 'invalid' ? errorMsg : undefined}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="civic"
            size="lg"
            onClick={handleVerify}
            isLoading={visualState === 'loading'}
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {flow === 'reset'
              ? 'Verify & Reset Password'
              : flow === 'report'
                ? 'Verify & Continue to Report'
                : 'Verify & Set Password'}
          </Button>

          {/* Resend OTP button with 30s countdown */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={!canResend || visualState === 'loading' || isSkipping}
            leftIcon={<RotateCw className={`w-3.5 h-3.5 ${!canResend ? 'opacity-50' : ''}`} />}
            className="w-full text-slate-600 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
          >
            {canResend ? 'Resend OTP Code' : `Resend OTP in ${resendTimer}s`}
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={handleSkipForNow}
            disabled={visualState === 'loading' || isSkipping}
            isLoading={isSkipping}
            leftIcon={!isSkipping ? <Home className="w-4 h-4" /> : undefined}
            className="w-full"
          >
            Skip for now
          </Button>
        </div>

        {/* Security Help Footer */}
        <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>
            Didn't receive the email? Check your Spam folder or contact municipal help.
          </p>
        </div>
      </div>
    </div>
  );
};
