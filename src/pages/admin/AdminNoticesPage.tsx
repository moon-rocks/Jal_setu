import React, { FormEvent, useEffect, useState } from 'react';
import { BellRing, Megaphone, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { auditService } from '../../services/auditService';
import { MunicipalWard, NoticeInput, NoticeSeverity, noticeService } from '../../services/noticeService';
import { CivicNotice } from '../../types';

const EMPTY_FORM: NoticeInput = {
  title: '',
  description: '',
  timeWindow: 'Until further notice',
  severity: 'info',
  wardId: '',
  isActive: false,
};

const severityStyles: Record<NoticeSeverity, string> = {
  info: 'bg-sky-50 text-sky-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-rose-50 text-rose-700',
  success: 'bg-emerald-50 text-emerald-700',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
};

export const AdminNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<CivicNotice[]>([]);
  const [wards, setWards] = useState<MunicipalWard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<CivicNotice | null>(null);
  const [form, setForm] = useState<NoticeInput>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [busyNoticeId, setBusyNoticeId] = useState<string | null>(null);

  const fetchNotices = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [loadedNotices, loadedWards] = await Promise.all([
        noticeService.getAdminNotices(),
        noticeService.getWards(),
      ]);
      setNotices(loadedNotices);
      setWards(loadedWards);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to load municipal notices.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotices();
  }, []);

  const openCreateForm = () => {
    setEditingNotice(null);
    setForm(EMPTY_FORM);
    setErrorMessage('');
    setIsEditorOpen(true);
  };

  const openEditForm = (notice: CivicNotice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      description: notice.description,
      timeWindow: notice.timeWindow,
      severity: notice.severity,
      wardId: notice.wardId || '',
      isActive: notice.isActive ?? false,
    });
    setErrorMessage('');
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setIsEditorOpen(false);
    setEditingNotice(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (editingNotice) {
        await noticeService.updateNotice(editingNotice.id, form);
        await auditService.logAction('UPDATE_NOTICE', 'WATER_NOTICE', editingNotice.id);
        setSuccessMessage('Notice updated.');
      } else {
        const notice = await noticeService.createNotice(form);
        await auditService.logAction('CREATE_NOTICE', 'WATER_NOTICE', notice.id);
        setSuccessMessage(form.isActive ? 'Notice published to the Citizen Portal.' : 'Notice saved as a draft.');
      }
      setIsEditorOpen(false);
      setEditingNotice(null);
      await fetchNotices();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to save this notice.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishChange = async (notice: CivicNotice) => {
    const nextState = !notice.isActive;
    setBusyNoticeId(notice.id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await noticeService.setNoticePublished(notice.id, nextState);
      await auditService.logAction(nextState ? 'PUBLISH_NOTICE' : 'UNPUBLISH_NOTICE', 'WATER_NOTICE', notice.id);
      setSuccessMessage(nextState ? 'Notice published to the Citizen Portal.' : 'Notice unpublished.');
      await fetchNotices();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to update the notice publication status.'));
    } finally {
      setBusyNoticeId(null);
    }
  };

  const handleDelete = async (notice: CivicNotice) => {
    if (!window.confirm(`Delete "${notice.title}"? This cannot be undone.`)) return;

    setBusyNoticeId(notice.id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await noticeService.deleteNotice(notice.id);
      await auditService.logAction('DELETE_NOTICE', 'WATER_NOTICE', notice.id);
      setNotices((currentNotices) => currentNotices.filter((item) => item.id !== notice.id));
      setSuccessMessage('Notice deleted.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to delete this notice.'));
    } finally {
      setBusyNoticeId(null);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            <Megaphone className="h-6 w-6 shrink-0 text-sky-600" />
            <span>Municipal Notices</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage notices shown to citizens in the Citizen Portal.
          </p>
        </div>
        <Button onClick={openCreateForm} className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create notice
        </Button>
      </div>

      {errorMessage && (
        <div role="alert" className="flex min-w-0 flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 break-words">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void fetchNotices()}
            className="shrink-0 self-start font-semibold underline underline-offset-2 sm:self-auto"
          >
            Refresh notices
          </button>
        </div>
      )}
      {successMessage && (
        <div role="status" className="break-words rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading municipal notices..." />
      ) : errorMessage ? null : notices.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-8 w-8 text-sky-600" />}
          title="No notices yet"
          description="Create a notice to share water service updates and advisories with citizens."
        />
      ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
            {notices.map((notice) => (
              <Card key={notice.id} variant="default" padding="md" className="min-w-0 space-y-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <h2 className="break-words text-base font-bold text-slate-900">{notice.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2.5 py-1 font-semibold capitalize ${severityStyles[notice.severity]}`}>
                        {notice.severity}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 font-semibold ${notice.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {notice.isActive ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {notice.ward || 'All wards'}
                  </span>
                </div>

                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{notice.description}</p>

                <div className="flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-xs text-slate-500">
                    <p className="break-words">Schedule: {notice.timeWindow}</p>
                    {notice.createdAt && <p className="mt-1">Created {new Date(notice.createdAt).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyNoticeId === notice.id}
                      onClick={() => void handlePublishChange(notice)}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      {notice.isActive ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyNoticeId === notice.id}
                      onClick={() => openEditForm(notice)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busyNoticeId === notice.id}
                      onClick={() => void handleDelete(notice)}
                      aria-label={`Delete ${notice.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
      )}

      <Modal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={editingNotice ? 'Edit notice' : 'Create notice'}
        description="Published notices are visible to citizens in the Citizen Portal."
        maxWidth="xl"
      >
        <form onSubmit={(event) => void handleSave(event)} className="max-h-[70dvh] space-y-4 overflow-y-auto">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Title</span>
            <input
              required
              maxLength={255}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g. Scheduled water supply interruption"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full min-w-0 resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Share the details citizens need to know."
            />
          </label>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Schedule / time window</span>
              <input
                required
                maxLength={100}
                value={form.timeWindow}
                onChange={(event) => setForm({ ...form, timeWindow: event.target.value })}
                className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="Until further notice"
              />
            </label>
            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Ward</span>
              <select
                value={form.wardId || ''}
                onChange={(event) => setForm({ ...form, wardId: event.target.value })}
                className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">All wards</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    Ward {ward.ward_number} - {ward.ward_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Severity</span>
              <select
                value={form.severity}
                onChange={(event) => setForm({ ...form, severity: event.target.value as NoticeSeverity })}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="success">Service restored</option>
              </select>
            </label>
            <label className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                className="h-4 w-4 shrink-0 accent-sky-600"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">Publish immediately</span>
                <span className="block text-xs text-slate-500">Show this notice on the Citizen Portal.</span>
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row">
            <Button type="button" variant="outline" onClick={closeEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : form.isActive ? 'Save and publish' : 'Save draft'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
