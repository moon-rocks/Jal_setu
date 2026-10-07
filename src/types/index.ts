export type IssueType =
  | 'pipeline_leakage'
  | 'low_pressure'
  | 'dirty_water'
  | 'no_water'
  | 'broken_tap'
  | 'other';

export type ReportStatus =
  | 'submitted'
  | 'location_verified'
  | 'under_review'
  | 'team_assigned'
  | 'repair_in_progress'
  | 'resolved'
  | 'rejected'
  | 'duplicate';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface LocationData {
  ward: string;
  city: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number; // meters
  timestamp?: string;
  address?: string;
}

export interface WaterIssueCategory {
  id: IssueType;
  title: string;
  description: string;
  iconName: string;
  colorClass: string;
  badgeBg: string;
}

export interface ReportItem {
  id: string;
  issueType: IssueType;
  issueTitle: string;
  location: LocationData;
  submittedAt: string;
  status: ReportStatus;
  priority: PriorityLevel;
  description?: string;
  completedAt?: string;
  photoUrl?: string;
  aiStatus?: 'verified_by_ai' | 'human_review_required' | 'not_run';
  aiConfidence?: number;
  aiSummary?: string;
  aiRecommendation?: string;
  aiEvidence?: string[];
  assignedTeamId?: string;
  assignedTeamName?: string;
  estimatedResolution?: string;
}

export interface ReportMapPoint {
  id: string;
  issueType: string;
  issueTitle: string;
  status: string;
  priority: string;
  location: Pick<LocationData, 'ward' | 'city' | 'latitude' | 'longitude' | 'address'>;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatarUrl?: string;
}

export interface FieldTeam {
  id: string;
  name: string;
  status: 'active' | 'available' | 'on_duty' | 'busy' | 'offline';
  assignedWards: string[];
  vehicleNumber?: string;
  membersCount: number;
  activeTasksCount: number;
  currentTask?: string;
  distanceKm?: number;
  etaMinutes?: number;
  members?: TeamMember[];
}

export interface CivicNotice {
  id: string;
  title: string;
  timeWindow: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  description: string;
  ward?: string;
  wardId?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  ward?: string;
  city: string;
  avatar?: string;
  preferredLanguage?: 'en' | 'hi' | 'bho';
}

export * from './teamMember';
