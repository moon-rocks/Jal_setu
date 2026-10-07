import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { TeamCard } from '../../components/common/TeamCard';
import { MapContainer } from '../../components/common/MapContainer';
import { FieldTeam } from '../../types';
import { ReportItem } from '../../types';
import {
  Users,
  CheckCircle2,
  Clock,
  Wrench,
  BarChart3,
  Plus,
  Search,
  MapPin,
  ChevronRight,
  Phone,
  Radio,
} from 'lucide-react';
import { teamService } from '../../services/teamService';
import { reportService } from '../../services/reportService';
import { auditService } from '../../services/auditService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { ErrorState, LoadingState } from '../../components/ui/LoadingState';

export const AdminTeamsPage: React.FC = () => {
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'on_duty' | 'offline'>('all');
  const [teamsList, setTeamsList] = useState<FieldTeam[]>([]);
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add team form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newWards, setNewWards] = useState('');
  const [newMembersCount, setNewMembersCount] = useState(0);

  const fetchTeams = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [teams, reports] = await Promise.all([
        teamService.getTeams(),
        reportService.getReports(),
      ]);
      setTeamsList(teams);
      setReportsList(reports);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load field teams.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useRealtimeSubscription('field_teams', () => {
    fetchTeams();
  });
  useRealtimeSubscription('team_members', () => {
    fetchTeams();
  });
  useRealtimeSubscription('reports', () => {
    fetchTeams();
  });

  const handleCreateTeamSubmit = async () => {
    if (!newTeamName.trim() || newMembersCount < 0) return;
    setIsLoading(true);
    const wardsArr = newWards.split(',').map((w) => w.trim());
    const result = await teamService.createTeam({
      name: newTeamName.trim(),
      assignedWards: wardsArr,
      membersCount: newMembersCount,
    });
    if (!result.success) {
      setErrorMessage(result.error || 'Unable to create the field team. Check your connection and permissions.');
      setIsLoading(false);
      return;
    }
    await auditService.logAction('CREATE_TEAM', 'FIELD_TEAM', result.team?.id, { name: newTeamName });
    setIsLoading(false);
    setIsAddTeamModalOpen(false);
    setNewTeamName('');
    setNewWards('');
    setNewMembersCount(0);
    void fetchTeams();
  };

  const filteredTeams = teamsList.filter((team) => {
    if (activeTab === 'active' && team.status !== 'active') return false;
    if (activeTab === 'on_duty' && team.status !== 'on_duty') return false;
    if (activeTab === 'offline' && team.status !== 'offline') return false;
    return `${team.name} ${team.assignedWards.join(' ')}`.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const activeCount = teamsList.filter((team) => team.status === 'active').length;
  const onDutyCount = teamsList.filter((team) => team.status === 'on_duty').length;
  const totalTaskCount = teamsList.reduce((sum, team) => sum + team.activeTasksCount, 0);
  const selectedTeam = filteredTeams[0] || teamsList[0] || null;
  const selectedTeamReports = selectedTeam
    ? reportsList.filter((report) => report.assignedTeamId === selectedTeam.id)
    : [];

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* Page Title & Slogan matching Reference 2 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Field Teams
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deploy, track and manage field teams for faster issue resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="civic"
            size="sm"
            onClick={() => setIsAddTeamModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Team
          </Button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards matching Reference 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Teams</p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 mt-0.5">
            {isLoading ? '--' : teamsList.length}
          </p>
          <p className="text-[10px] text-slate-400">Configured units</p>
        </Card>

        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Active Teams</p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 mt-0.5">
            {isLoading ? '--' : activeCount}
          </p>
          <p className="text-[10px] text-slate-400">On patrol</p>
        </Card>

        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">On Duty</p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600 mt-0.5">
            {isLoading ? '--' : onDutyCount}
          </p>
          <p className="text-[10px] text-slate-400">Handling repairs</p>
        </Card>

        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Tasks</p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-sky-600 mt-0.5">
            {isLoading ? '--' : totalTaskCount}
          </p>
          <p className="text-[10px] text-slate-400">In queue</p>
        </Card>

        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-indigo-600 mt-0.5">
            --
          </p>
          <p className="text-[10px] text-slate-400">Not available</p>
        </Card>

        <Card variant="default" padding="sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">Avg. Resolution</p>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-purple-600 mt-0.5">
            --
          </p>
          <p className="text-[10px] text-slate-400">Not available</p>
        </Card>
      </div>

      {/* Main Grid: Teams Overview & Live Tracking */}
      {isLoading ? (
        <LoadingState message="Loading field teams..." />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => void fetchTeams()} />
      ) : teamsList.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-sky-600" />}
          title="No teams configured yet."
          description="Field teams will appear here once they are added."
          actionLabel="+ Add First Field Team"
          onAction={() => setIsAddTeamModalOpen(true)}
          className="my-10"
        />
      ) : (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { id: 'all', label: `All (${teamsList.length})` },
                  { id: 'active', label: `Active (${activeCount})` },
                  { id: 'on_duty', label: `On Duty (${onDutyCount})` },
                  { id: 'offline', label: `Offline (${teamsList.filter((team) => team.status === 'offline').length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team or member..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs rounded-xl pl-8.5 pr-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Teams Cards Grid (2 rows of 3) matching Reference 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>

          {/* Team Alpha Detail & Live Team Locations Grid matching Reference 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Team Details & Assignments (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedTeam?.name || 'Team details'}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {selectedTeam?.status || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedTeam?.vehicleNumber || 'Vehicle not recorded'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team Members */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Team Members ({selectedTeam?.members?.length || 0})
                    </span>
                    {(selectedTeam?.members || []).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.role}</p>
                        </div>
                        {member.phone && <span className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />{member.phone}
                        </span>}
                      </div>
                    ))}
                    {!selectedTeam?.members?.length && <p className="text-xs text-slate-400">No team members recorded.</p>}
                  </div>

                  {/* Current Assignments */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Current Assignments ({selectedTeamReports.length})
                    </span>
                    <div className="space-y-2 text-xs">
                      {selectedTeamReports.map((report) => <div key={report.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono font-bold text-slate-800">{report.id}</span>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">{report.status.replaceAll('_', ' ')}</span>
                        </div>
                        <p className="font-bold text-slate-900">{report.issueTitle}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{report.location.ward}</p>
                      </div>)}
                      {!selectedTeamReports.length && <p className="text-xs text-slate-400">No assigned reports recorded.</p>}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Team Locations Live Map (5 cols) */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Assigned Complaint Locations</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">{teamsList.length} teams</span>
              </div>

              <MapContainer
                mode="admin"
                title="Assigned Complaint Locations"
                subtitle={`${selectedTeamReports.length} reports assigned to this team`}
                complaints={selectedTeamReports}
                emptyMessage="No assigned complaints with locations."
                heightClass="h-[360px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      <Modal
        isOpen={isAddTeamModalOpen}
        onClose={() => setIsAddTeamModalOpen(false)}
        title="Create New Municipal Field Team"
        description="Provision a rapid-response repair crew and assign primary municipal ward jurisdictions."
      >
        <div className="space-y-4">
          <Input
            label="Team Designation / Name"
            type="text"
            placeholder="e.g. Team Eta (Rapid Leakage)"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />

          <Input
            label="Assigned Wards"
            type="text"
            placeholder="e.g. Ward 3, Ward 4"
            value={newWards}
            onChange={(e) => setNewWards(e.target.value)}
          />

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-slate-700">
              Assigned Technicians Count
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={newMembersCount}
              onChange={(e) => setNewMembersCount(Number(e.target.value))}
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-200 py-2.5 px-3.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddTeamModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="civic"
              size="sm"
              isLoading={isLoading}
              onClick={handleCreateTeamSubmit}
            >
              Provision Team
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
