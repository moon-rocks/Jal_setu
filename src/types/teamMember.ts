export type TeamMemberStatus = 'active' | 'inactive';

export type WorkStatus =
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'admin_verified';

export type WorkUpdateType =
  | 'work_started'
  | 'inspection_completed'
  | 'repair_started'
  | 'materials_required'
  | 'repair_completed'
  | 'access_issue'
  | 'escalated'
  | 'general_note';

export interface TeamMemberProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  assignedArea: string;
  ward: string;
  teamName: string;
  teamId?: string;
  status: TeamMemberStatus;
  responsibilities: string;
  avatarUrl?: string;
  assignedReportsCount: number;
  completedReportsCount: number;
  inProgressCount?: number;
  pendingCount?: number;
  verifiedCount?: number;
  rejectedCount?: number;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTeamMemberDTO {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  assignedArea: string;
  ward: string;
  teamName: string;
  responsibilities?: string;
  password?: string;
  status?: TeamMemberStatus;
  avatarUrl?: string;
}

export interface UpdateTeamMemberDTO {
  fullName?: string;
  phone?: string;
  designation?: string;
  department?: string;
  assignedArea?: string;
  ward?: string;
  teamName?: string;
  responsibilities?: string;
  status?: TeamMemberStatus;
  avatarUrl?: string;
}

export interface AssignedReportItem {
  id: string; // Report UUID or report_number
  reportNumber: string;
  title: string;
  issueType: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: WorkStatus;
  location: {
    ward: string;
    city: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  citizenReportDate: string;
  assignedDate: string;
  startedAt?: string;
  assignedBy?: string;
  deadline?: string;
  instructions?: string;
  assignedMemberId?: string;
  assignedMemberName?: string;
  // Citizen contact info (only necessary info shown, privacy safe)
  citizenInfo?: {
    name?: string;
    phone?: string;
    locality?: string;
  };
  // Evidence photos
  beforePhotoUrl?: string;
  duringPhotoUrl?: string;
  afterPhotoUrl?: string;
  completionNotes?: string;
  completedAt?: string;
  adminVerifiedBy?: string;
  adminVerificationNotes?: string;
  adminVerifiedAt?: string;
}

export interface WorkUpdateItem {
  id: string;
  reportId: string;
  teamMemberId?: string;
  teamMemberName: string;
  updateType: WorkUpdateType;
  message: string;
  photoUrl?: string;
  createdAt: string;
}

export interface TeamAuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TeamNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'assignment_changed' | 'priority_changed' | 'admin_message' | 'deadline' | 'approved' | 'rejected';
  reportId?: string;
  isRead: boolean;
  createdAt: string;
}
