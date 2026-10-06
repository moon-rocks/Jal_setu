import React, { FormEvent, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { IssueType, PriorityLevel, ReportItem } from '../../types';
import { reportService } from '../../services/reportService';

interface ReportAdminControlsProps {
  report: ReportItem;
  onUpdated?: () => void;
  onDeleted?: () => void;
  className?: string;
}

const issueTypes: Array<{ value: IssueType; label: string }> = [
  { value: 'pipeline_leakage', label: 'Pipeline Leakage' },
  { value: 'low_pressure', label: 'Low Water Pressure' },
  { value: 'dirty_water', label: 'Dirty / Contaminated Water' },
  { value: 'no_water', label: 'No Water Supply' },
  { value: 'broken_tap', label: 'Broken Public Tap' },
  { value: 'other', label: 'Other' },
];

const priorities: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];

const inputClassName = 'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'The report operation failed.';

export const ReportAdminControls: React.FC<ReportAdminControlsProps> = ({
  report,
  onUpdated,
  onDeleted,
  className = '',
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    issueType: report.issueType,
    title: report.issueTitle,
    description: report.description || '',
    priority: report.priority,
    ward: report.location.ward || '',
    city: report.location.city || '',
    address: report.location.address || '',
    latitude: report.location.latitude == null ? '' : String(report.location.latitude),
    longitude: report.location.longitude == null ? '' : String(report.location.longitude),
    accuracy: report.location.accuracy == null ? '' : String(report.location.accuracy),
  });

  const openEditor = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setErrorMessage('');
    setForm({
      issueType: report.issueType,
      title: report.issueTitle,
      description: report.description || '',
      priority: report.priority,
      ward: report.location.ward || '',
      city: report.location.city || '',
      address: report.location.address || '',
      latitude: report.location.latitude == null ? '' : String(report.location.latitude),
      longitude: report.location.longitude == null ? '' : String(report.location.longitude),
      accuracy: report.location.accuracy == null ? '' : String(report.location.accuracy),
    });
    setIsEditorOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const accuracy = form.accuracy.trim() ? Number(form.accuracy) : undefined;
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setErrorMessage('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    if (accuracy !== undefined && (!Number.isFinite(accuracy) || accuracy < 0)) {
      setErrorMessage('GPS accuracy must be a non-negative number.');
      return;
    }

    setIsSaving(true);
    try {
      await reportService.updateReportDetails(report.id, {
        issueType: form.issueType,
        title: form.title,
        description: form.description,
        priority: form.priority,
        ward: form.ward,
        city: form.city,
        address: form.address,
        latitude,
        longitude,
        accuracy,
      });
      setIsEditorOpen(false);
      onUpdated?.();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!window.confirm(`Permanently delete report ${report.id}, its GPS location, photos, map marker, and related records? This cannot be undone.`)) {
      return;
    }

    setErrorMessage('');
    setIsDeleting(true);
    try {
      await reportService.deleteReportPermanently(report.id);
      onDeleted?.();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openEditor}
          leftIcon={<Pencil className="h-3.5 w-3.5" />}
          aria-label={`Edit report ${report.id}`}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          isLoading={isDeleting}
          onClick={(event) => void handleDelete(event)}
          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          aria-label={`Permanently delete report ${report.id}`}
        >
          Delete
        </Button>
      </div>

      {errorMessage && !isEditorOpen && (
        <p role="alert" className="mt-2 max-w-xs break-words text-left text-xs text-rose-700">
          {errorMessage}
        </p>
      )}

      <Modal
        isOpen={isEditorOpen}
        onClose={() => {
          if (!isSaving) setIsEditorOpen(false);
        }}
        title={`Edit report ${report.id}`}
        description="Changes to GPS coordinates also update the report map location."
        maxWidth="xl"
      >
        <form onSubmit={(event) => void handleSave(event)} className="max-h-[70dvh] space-y-4 overflow-y-auto">
          {errorMessage && (
            <p role="alert" className="break-words rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {errorMessage}
            </p>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Issue type</span>
              <select
                value={form.issueType}
                onChange={(event) => setForm({ ...form, issueType: event.target.value as IssueType })}
                className={inputClassName}
              >
                {issueTypes.map((issue) => <option key={issue.value} value={issue.value}>{issue.label}</option>)}
              </select>
            </label>
            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Priority</span>
              <select
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value as PriorityLevel })}
                className={inputClassName}
              >
                {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Title</span>
            <input
              required
              maxLength={255}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className={inputClassName}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea
              rows={3}
              maxLength={10000}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className={`${inputClassName} resize-y`}
            />
          </label>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Ward</span>
              <input maxLength={100} value={form.ward} onChange={(event) => setForm({ ...form, ward: event.target.value })} className={inputClassName} />
            </label>
            <label className="block min-w-0 space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">City</span>
              <input maxLength={100} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={inputClassName} />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Address</span>
            <input maxLength={2000} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClassName} />
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">GPS location</p>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block min-w-0 space-y-1.5">
                <span className="text-xs font-medium text-slate-600">Latitude</span>
                <input type="number" required step="any" min="-90" max="90" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} className={inputClassName} />
              </label>
              <label className="block min-w-0 space-y-1.5">
                <span className="text-xs font-medium text-slate-600">Longitude</span>
                <input type="number" required step="any" min="-180" max="180" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} className={inputClassName} />
              </label>
              <label className="block min-w-0 space-y-1.5">
                <span className="text-xs font-medium text-slate-600">Accuracy (m)</span>
                <input type="number" step="any" min="0" value={form.accuracy} onChange={(event) => setForm({ ...form, accuracy: event.target.value })} className={inputClassName} />
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row">
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
