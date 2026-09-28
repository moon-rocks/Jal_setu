import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NoticeCard } from '../../components/common/NoticeCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../../components/ui/LoadingState';
import { CivicNotice } from '../../types';
import { Megaphone, AlertCircle, Search, X } from 'lucide-react';
import { noticeService } from '../../services/noticeService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export const CitizenNoticesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [noticesList, setNoticesList] = useState<CivicNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchNotices = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setNoticesList(await noticeService.getNotices());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load notices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  useRealtimeSubscription('water_notices', () => {
    fetchNotices();
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const filteredNotices = noticesList.filter((notice) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      notice.title.toLowerCase().includes(q) ||
      notice.description.toLowerCase().includes(q) ||
      notice.ward?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-sky-600" />
            <span>Municipal Water Notices</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official supply schedules, planned maintenance, and advisory broadcasts for Muzaffarpur.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notices or ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white select-text text-slate-800 placeholder:text-slate-400 text-xs rounded-xl pl-8.5 pr-8 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {searchQuery && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
          <span>Filtering notices for: <strong>&ldquo;{searchQuery}&rdquo;</strong> ({filteredNotices.length} found)</span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading municipal notices..." />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => void fetchNotices()} />
      ) : noticesList.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-8 h-8 text-sky-600" />}
          title="No active notices"
          description="Municipal notices will appear here when published."
        />
      ) : filteredNotices.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <p className="text-sm font-bold text-slate-800">No notices found matching &ldquo;{searchQuery}&rdquo;</p>
          <p className="text-xs text-slate-400">Try searching with a different ward name or keyword.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            className="mt-2 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
          >
            Show All Notices
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}
    </div>
  );
};
