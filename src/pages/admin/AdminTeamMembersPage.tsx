import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Key,
  Trash2,
  Eye,
  Edit,
  Shield,
  Phone,
  Mail,
  MapPin,
  HardHat,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building,
  Lock,
} from 'lucide-react';
import { teamMemberService } from '../../services/teamMemberService';
import { TeamMemberProfile, CreateTeamMemberDTO } from '../../types/teamMember';
import { useAuth } from '../../context/AuthContext';

export const AdminTeamMembersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [members, setMembers] = useState<TeamMemberProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'reports'>('date');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newMemberForm, setNewMemberForm] = useState<CreateTeamMemberDTO>({
    fullName: '',
    email: '',
    phone: '',
    designation: 'Field Hydraulics Technician',
    department: 'Water Supply & Distribution',
    assignedArea: 'Ward 12 - Pokhraira Central',
    ward: 'Ward 12',
    teamName: 'Team Alpha (Rapid Repair)',
    responsibilities: 'Emergency leak sealing, mechanical pipe clamping, pressure testing',
    password: '',
    status: 'active',
  });

  // Action states
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    const list = await teamMemberService.getTeamMembers({
      search: searchQuery,
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });
    setMembers(list);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [departmentFilter, statusFilter, searchQuery]);

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await teamMemberService.toggleStatus(id, nextStatus);
    setActionSuccess(`Team member successfully ${nextStatus === 'active' ? 'enabled' : 'disabled'}.`);
    setTimeout(() => setActionSuccess(null), 3000);
    fetchMembers();
  };

  const handleResetPassword = async (email: string, id: string) => {
    const confirmed = window.confirm(`Reset temporary password for ${email}? A secure temporary password will be provisioned.`);
    if (!confirmed) return;

    await teamMemberService.resetPassword(email, id);
    setActionSuccess(`Password reset email requested for ${email}.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newMemberForm.fullName || !newMemberForm.email || !newMemberForm.password) {
      setCreateError('Full name, official email, and temporary password are required.');
      return;
    }

    if (newMemberForm.password.length < 6) {
      setCreateError('Temporary password must be at least 6 characters long.');
      return;
    }

    setCreateLoading(true);
    const res = await teamMemberService.createTeamMember(newMemberForm);
    setCreateLoading(false);

    if (res.success) {
      setShowCreateModal(false);
      setActionSuccess(`Team member "${newMemberForm.fullName}" successfully registered.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setNewMemberForm({
        fullName: '',
        email: '',
        phone: '',
        designation: 'Field Hydraulics Technician',
        department: 'Water Supply & Distribution',
        assignedArea: 'Ward 12 - Pokhraira Central',
        ward: 'Ward 12',
        teamName: 'Team Alpha (Rapid Repair)',
        responsibilities: 'Emergency leak sealing, mechanical pipe clamping, pressure testing',
        password: '',
        status: 'active',
      });
      fetchMembers();
    } else {
      setCreateError(res.error || 'Failed to create team member.');
    }
  };

  // Sorting
  const sortedMembers = [...members].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'reports') return b.assignedReportsCount - a.assignedReportsCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalPages = Math.ceil(sortedMembers.length / pageSize) || 1;
  const paginatedMembers = sortedMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 select-none font-sans text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-sky-600" />
            <span>Team Members</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision field credentials, manage personnel assignments, and track repair crew capacity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-sky-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Team Member</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* FILTER & SEARCH CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, email, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Water Supply & Distribution">Water Supply & Distribution</option>
            <option value="Rapid Leakage Response Division">Rapid Leakage Response Division</option>
            <option value="Quality & Chlorination Audit">Quality & Chlorination Audit</option>
            <option value="Civil Works & Plumbing">Civil Works & Plumbing</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="date">Sort: Newly Created</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="reports">Sort: Most Reports Handled</option>
          </select>
        </div>
      </div>

      {/* TEAM MEMBERS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Designation & Department</th>
                <th className="py-3.5 px-4">Assigned Area</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Assigned / Done</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-600 mb-1" />
                    <span>Loading team members...</span>
                  </td>
                </tr>
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 font-bold flex items-center justify-center border border-sky-100 text-xs shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <NavLink
                            to={`/admin/team-members/${member.id}`}
                            className="font-bold text-slate-900 hover:text-sky-600 transition-colors"
                          >
                            {member.name}
                          </NavLink>
                          <p className="text-[11px] text-slate-400 font-mono">{member.email}</p>
                          <p className="text-[10px] text-slate-400">{member.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Designation & Dept */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{member.designation}</p>
                      <p className="text-[11px] text-slate-400">{member.department}</p>
                      <span className="inline-block mt-0.5 text-[10px] px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 font-mono">
                        {member.teamName}
                      </span>
                    </td>

                    {/* Assigned Area */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{member.assignedArea}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {member.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Workload */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-slate-900">
                        {member.assignedReportsCount}
                      </span>
                      <span className="text-slate-400"> / </span>
                      <span className="font-mono font-bold text-emerald-600">
                        {member.completedReportsCount}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {member.lastActivityAt || 'Today'}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <NavLink
                          to={`/admin/team-members/${member.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </NavLink>

                        <button
                          type="button"
                          onClick={() => handleResetPassword(member.email, member.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(member.id, member.status)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            member.status === 'active'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={member.status === 'active' ? 'Disable Account' : 'Enable Account'}
                        >
                          {member.status === 'active' ? (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {Math.min(sortedMembers.length, (currentPage - 1) * pageSize + 1)} to{' '}
            {Math.min(sortedMembers.length, currentPage * pageSize)} of {sortedMembers.length} team members
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE TEAM MEMBER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 space-y-5 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-sky-600" />
                  <span>Create Team Member Account</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provision an official field worker login with locked <span className="font-bold text-sky-700">team_member</span> permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-800 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Basic Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Er. Rajiv Ranjan"
                      value={newMemberForm.fullName}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Contact Mobile *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 94318 •••••"
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Designation *</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.designation}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, designation: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Department *</label>
                    <select
                      value={newMemberForm.department}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, department: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="Water Supply & Distribution">Water Supply & Distribution</option>
                      <option value="Rapid Leakage Response Division">Rapid Leakage Response Division</option>
                      <option value="Quality & Chlorination Audit">Quality & Chlorination Audit</option>
                      <option value="Civil Works & Plumbing">Civil Works & Plumbing</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Work & Sector Allocation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Assigned Area / Sector *</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.assignedArea}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, assignedArea: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Field Unit / Van *</label>
                    <input
                      type="text"
                      required
                      value={newMemberForm.teamName}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, teamName: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Key Responsibilities</label>
                    <input
                      type="text"
                      value={newMemberForm.responsibilities}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, responsibilities: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Account Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Login Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rajiv.ranjan@muzaffarpur.gov.in"
                      value={newMemberForm.email}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Temporary Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Min 6 characters (e.g. JalSetu#2026)"
                      value={newMemberForm.password}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                {/* Role Lock Notice */}
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-sky-800 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    Role is permanently locked to <span className="font-bold">team_member</span>. Admins cannot accidentally create administrative or citizen accounts via this form.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {createLoading ? 'Provisioning Account...' : 'Create Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
