import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { AdminProtectedRoute } from './components/common/AdminProtectedRoute';
import { TeamProtectedRoute } from './components/common/TeamProtectedRoute';
import { CitizenReportProtectedRoute } from './components/common/CitizenReportProtectedRoute';

// Layouts
import { CitizenLayout } from './components/citizen/CitizenLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { TeamLayout } from './components/team/TeamLayout';

// Citizen Pages (Hybrid OTP + Password Auth)
import { CitizenLoginPage } from './pages/citizen/CitizenLoginPage';
import { CitizenSignupPage } from './pages/citizen/CitizenSignupPage';
import { CitizenOtpPage } from './pages/citizen/CitizenOtpPage';
import { CitizenSetPasswordPage } from './pages/citizen/CitizenSetPasswordPage';
import { CitizenForgotPasswordPage } from './pages/citizen/CitizenForgotPasswordPage';
import { CitizenProfileSetupPage } from './pages/citizen/CitizenProfileSetupPage';
import { CitizenHomePage } from './pages/citizen/CitizenHomePage';
import { CitizenReportPage } from './pages/citizen/CitizenReportPage';
import { CitizenMyReportsPage } from './pages/citizen/CitizenMyReportsPage';
import { CitizenReportDetailPage } from './pages/citizen/CitizenReportDetailPage';
import { CitizenMapPage } from './pages/citizen/CitizenMapPage';
import { CitizenProfilePage } from './pages/citizen/CitizenProfilePage';
import { CitizenSettingsPage } from './pages/citizen/CitizenSettingsPage';
import { CitizenServicesPage } from './pages/citizen/CitizenServicesPage';
import { CitizenNoticesPage } from './pages/citizen/CitizenNoticesPage';
import { CitizenAwarenessPage } from './pages/citizen/CitizenAwarenessPage';
import { CitizenHelpPage } from './pages/citizen/CitizenHelpPage';

// Team Member Pages
import { TeamLoginPage } from './pages/team/TeamLoginPage';
import { TeamDashboardPage } from './pages/team/TeamDashboardPage';
import { TeamReportsPage } from './pages/team/TeamReportsPage';
import { TeamReportDetailPage } from './pages/team/TeamReportDetailPage';
import { TeamFieldMapPage } from './pages/team/TeamFieldMapPage';
import { TeamInProgressPage, TeamCompletedPage } from './pages/team/TeamStatusFilteredPages';
import { TeamEvidencePage } from './pages/team/TeamEvidencePage';
import { TeamWorkUpdatesPage } from './pages/team/TeamWorkUpdatesPage';
import { TeamNotificationsPage } from './pages/team/TeamNotificationsPage';
import { TeamProfilePage } from './pages/team/TeamProfilePage';
import { TeamHelpPage } from './pages/team/TeamHelpPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminReportDetailPage } from './pages/admin/AdminReportDetailPage';
import { AdminLiveMapPage } from './pages/admin/AdminLiveMapPage';
import { AdminTeamMembersPage } from './pages/admin/AdminTeamMembersPage';
import { AdminTeamMemberDetailPage } from './pages/admin/AdminTeamMemberDetailPage';
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage';
import { AdminAlertsPage } from './pages/admin/AdminAlertsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <Routes>
              {/* ------------------------------------------------------------- */}
              {/* 1. CITIZEN HYBRID AUTH FLOW (Email OTP -> Set Password -> Email+Password Login) */}
              {/* ------------------------------------------------------------- */}
              <Route path="/" element={<CitizenLoginPage />} />
              <Route path="/login" element={<CitizenLoginPage />} />
              <Route path="/signup" element={<CitizenSignupPage />} />
              <Route path="/verify-otp" element={<CitizenOtpPage />} />
              <Route path="/set-password" element={<CitizenSetPasswordPage />} />
              <Route path="/forgot-password" element={<CitizenForgotPasswordPage />} />
              <Route path="/profile-setup" element={<CitizenProfileSetupPage />} />

              {/* Citizen App with Persistent Layout */}
              <Route element={<CitizenLayout />}>
                <Route path="/home" element={<CitizenHomePage />} />
                <Route element={<CitizenReportProtectedRoute />}>
                  <Route path="/report" element={<CitizenReportPage />} />
                </Route>
                <Route path="/my-reports" element={<CitizenMyReportsPage />} />
                <Route path="/reports/:id" element={<CitizenReportDetailPage />} />
                <Route path="/map" element={<CitizenMapPage />} />
                <Route path="/profile" element={<CitizenProfilePage />} />
                <Route path="/settings" element={<CitizenSettingsPage />} />
                <Route path="/services" element={<CitizenServicesPage />} />
                <Route path="/notices" element={<CitizenNoticesPage />} />
                <Route path="/awareness" element={<CitizenAwarenessPage />} />
                <Route path="/help" element={<CitizenHelpPage />} />
              </Route>

              {/* ------------------------------------------------------------- */}
              {/* 2. TEAM MEMBER AUTH & FIELD OPERATIONS (Email + Password only) */}
              {/* ------------------------------------------------------------- */}
              <Route path="/team/login" element={<TeamLoginPage />} />
              <Route path="/team-login" element={<Navigate to="/team/login" replace />} />

              <Route element={<TeamProtectedRoute />}>
                <Route path="/team" element={<TeamLayout />}>
                  <Route index element={<Navigate to="/team/dashboard" replace />} />
                  <Route path="dashboard" element={<TeamDashboardPage />} />
                  <Route path="reports" element={<TeamReportsPage />} />
                  <Route path="reports/:id" element={<TeamReportDetailPage />} />
                  <Route path="map" element={<TeamFieldMapPage />} />
                  <Route path="in-progress" element={<TeamInProgressPage />} />
                  <Route path="completed" element={<TeamCompletedPage />} />
                  <Route path="evidence" element={<TeamEvidencePage />} />
                  <Route path="updates" element={<TeamWorkUpdatesPage />} />
                  <Route path="notifications" element={<TeamNotificationsPage />} />
                  <Route path="profile" element={<TeamProfilePage />} />
                  <Route path="help" element={<TeamHelpPage />} />
                </Route>
              </Route>

              {/* ------------------------------------------------------------- */}
              {/* 3. ADMIN AUTHENTICATION & MANAGEMENT PANEL */}
              {/* ------------------------------------------------------------- */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="reports/:id" element={<AdminReportDetailPage />} />
                  <Route path="map" element={<AdminLiveMapPage />} />
                  <Route path="team-members" element={<AdminTeamMembersPage />} />
                  <Route path="team-members/:id" element={<AdminTeamMemberDetailPage />} />
                  <Route path="teams" element={<AdminTeamsPage />} />
                  <Route path="alerts" element={<AdminAlertsPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
