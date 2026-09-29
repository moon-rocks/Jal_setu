import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Bell,
  Shield,
  Globe2,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Droplets,
  Pencil,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { authService } from '../../services/authService';

export const CitizenProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { location, isLocating, error: locationError, getFreshLocation } = useLocationContext();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [wardName, setWardName] = useState(profile?.wardName || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleEditProfile = () => {
    setFullName(profile?.fullName || '');
    setPhone(profile?.phone || '');
    setWardName(profile?.wardName || '');
    setAddress(profile?.address || '');
    setProfileError('');
    setProfileSaved(false);
    setIsEditing(true);
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setProfileError('');
    const saved = await authService.updateProfile(user.id, { fullName, phone, wardName, address });
    if (saved) {
      await refreshProfile();
      setIsEditing(false);
      setProfileSaved(true);
    } else {
      setProfileError('Your changes could not be saved. Please try again.');
    }
    setIsSaving(false);
  };

  const handleTurnOnLocation = async () => {
    await getFreshLocation();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Name not provided';
  const displayEmail = profile?.email || user?.email || 'Email not provided';
  const displayPhone = profile?.phone || 'Phone not provided';
  const displayWard = profile?.wardName || 'Ward not assigned';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-2xl font-extrabold shadow-inner shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {displayName}
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900">
                Verified Citizen
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-sky-100">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {displayEmail}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {displayPhone}
              </span>
              <span className="flex items-center gap-1 font-semibold text-white">
                <MapPin className="w-3.5 h-3.5 text-sky-300" />
                {displayWard}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card variant="default" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Device Location</h3>
            <p className="text-xs text-slate-500 mt-1">
              {location
                ? location.address || `${location.ward}, ${location.city}`
                : 'Location access is off'}
            </p>
          </div>
          <Button
            type="button"
            variant="civic"
            size="sm"
            onClick={handleTurnOnLocation}
            isLoading={isLocating}
            leftIcon={<Compass className="w-4 h-4" />}
          >
            Turn on location
          </Button>
        </div>
        {locationError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3" role="status" aria-live="polite">
            <p className="text-xs text-amber-900">
              {locationError} Please check your browser&apos;s location permission and try again.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={handleTurnOnLocation} isLoading={isLocating}>
              Try again
            </Button>
          </div>
        )}
      </Card>

      <Card variant="default" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Personal Details</h3>
            <p className="text-xs text-slate-500 mt-1">Update your contact and address information.</p>
          </div>
          {!isEditing && (
            <Button type="button" variant="outline" size="sm" onClick={handleEditProfile} leftIcon={<Pencil className="w-3.5 h-3.5" />}>
              Edit Profile
            </Button>
          )}
        </div>

        {profileSaved && <p className="text-xs text-emerald-700" role="status">Profile updated successfully.</p>}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <Input label="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            <Input label="Mobile Number" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <Input label="Municipal Ward" value={wardName} onChange={(event) => setWardName(event.target.value)} />
            <Input label="Street / Landmark Address" value={address} onChange={(event) => setAddress(event.target.value)} />
            {profileError && <p className="text-xs text-rose-600" role="alert">{profileError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" variant="civic" size="sm" isLoading={isSaving}>
                Save Profile
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Navigation Sections */}
      <div className="space-y-4">
        {/* Core Activities */}
        <Card variant="default" padding="none" className="overflow-hidden divide-y divide-slate-100">
          <button
            type="button"
            onClick={() => navigate('/my-reports')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">My Reports</p>
                <p className="text-xs text-slate-500">Track and monitor your submitted water issues</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <p className="text-xs text-slate-500">SMS alerts, water outage reminders, supply timings</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/map')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Privacy & Location</p>
                <p className="text-xs text-slate-500">Manage device GPS permissions and data storage</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Language / भाषा</p>
                <p className="text-xs text-slate-500">Hindi (हिंदी), English, or Bhojpuri (भोजपुरी)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </Card>

        {/* Support & About */}
        <Card variant="default" padding="none" className="overflow-hidden divide-y divide-slate-100">
          <button
            type="button"
            onClick={() => navigate('/help')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Help & Support</p>
                <p className="text-xs text-slate-500">Emergency leak helpline & FAQs</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">About JalSetu</p>
                <p className="text-xs text-slate-500">Har Boond, Behtar Bihar · Version 1.0 (Stage 0 UI)</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">Muzaffarpur</span>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="md"
          onClick={handleSignOut}
          leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
          className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
        >
          Sign Out of Account
        </Button>
      </div>
    </div>
  );
};
