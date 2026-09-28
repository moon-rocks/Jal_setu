import {
  Activity,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck2,
  HardHat,
  LayoutDashboard,
  MapPin,
  User,
} from 'lucide-react';

export const TEAM_NAV_ITEMS = [
  { path: '/team/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/team/reports', label: 'Assigned Reports', icon: FileCheck2 },
  { path: '/team/map', label: 'Field Map', icon: MapPin },
  { path: '/team/in-progress', label: 'Work in Progress', icon: Clock },
  { path: '/team/completed', label: 'Completed Work', icon: CheckCircle2 },
  { path: '/team/evidence', label: 'Upload Evidence', icon: Camera },
  { path: '/team/updates', label: 'Work Updates', icon: Activity },
  { path: '/team/notifications', label: 'Notifications', icon: Bell },
  { path: '/team/profile', label: 'My Profile', icon: User },
];
