import React, { useRef, useState, useEffect } from 'react';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  state?: 'normal' | 'loading' | 'invalid' | 'expired' | 'success';
  errorMessage?: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  state = 'normal',
  errorMessage,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));

  useEffect(() => {
    const arr = value.split('').slice(0, length);
    while (arr.length < length) arr.push('');
    setDigits(arr);
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    // Extract only digits
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      onChange(newDigits.join(''));
      return;
    }

    const char = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    onChange(newDigits.join(''));

    // Move to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      const newDigits = pasted.split('');
      while (newDigits.length < length) newDigits.push('');
      setDigits(newDigits);
      onChange(pasted);
      const nextIdx = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIdx]?.focus();
    }
  };

  const getStateClasses = () => {
    switch (state) {
      case 'invalid':
        return 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-600 focus:ring-rose-500/20';
      case 'expired':
        return 'border-amber-400 bg-amber-50/40 text-amber-900 focus:border-amber-600 focus:ring-amber-500/20';
      case 'success':
        return 'border-emerald-500 bg-emerald-50/40 text-emerald-900 focus:border-emerald-600 focus:ring-emerald-500/20';
      case 'loading':
        return 'border-sky-300 bg-sky-50/30 text-sky-800 animate-pulse';
      default:
        return 'border-slate-200 bg-white text-slate-900 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-300';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled || state === 'loading'}
            value={digits[index] || ''}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 shadow-xs tabular-nums select-none ${getStateClasses()} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        ))}
      </div>

      {state === 'invalid' && (
        <p className="text-xs font-semibold text-rose-600 mt-1">
          {errorMessage || 'Invalid 6-digit OTP code. Please verify and try again.'}
        </p>
      )}
      {state === 'expired' && (
        <p className="text-xs font-semibold text-amber-600 mt-1">
          {errorMessage || 'This OTP code has expired. Please request a new code.'}
        </p>
      )}
      {state === 'success' && (
        <p className="text-xs font-semibold text-emerald-600 mt-1">
          OTP verified successfully!
        </p>
      )}
    </div>
  );
};
