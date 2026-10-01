import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouteBackButtonProps {
  fallbackPath: string;
  homePaths: string[];
}

export function RouteBackButton({ fallbackPath, homePaths }: RouteBackButtonProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (homePaths.includes(pathname)) return null;

  const handleBack = () => {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-white/90 px-3.5 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Back</span>
    </button>
  );
}