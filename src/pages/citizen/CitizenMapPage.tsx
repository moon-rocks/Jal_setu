import React from 'react';
import { MapContainer } from '../../components/common/MapContainer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Compass, ShieldCheck, Lock, Plus, RotateCw, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';

export const CitizenMapPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    location,
    isLocating,
    hasPermission,
    permissionStatus,
    error,
    openDeniedModal,
    requestLocation,
    getFreshLocation,
    selectManualWard,
    updateVerifiedLocation,
    clearLocation,
  } = useLocationContext();

  const handleLocationAction = () => {
    if (location) {
      getFreshLocation();
    } else {
      requestLocation(true, true);
    }
  };

  const detectedLocation = location
    ? {
        ward: location.ward,
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address,
      }
    : undefined;

  return (
    <div className="space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              My Location &amp; GIS Map
            </h2>
            <button
              type="button"
              onClick={openDeniedModal}
              title="How to Enable Location"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-2.5 py-1 rounded-lg border border-slate-200/90 transition-colors cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="hidden sm:inline">How to Enable Location</span>
              <span className="sm:hidden">Location Guide</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time municipal GIS mapping centered on your current verified position.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {location ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => getFreshLocation()}
                isLoading={isLocating}
                leftIcon={<RotateCw className="w-3.5 h-3.5" />}
              >
                Recalibrate GPS
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLocation}
                className="text-slate-500 hover:text-slate-800"
              >
                Reset
              </Button>
            </>
          ) : (
            <Button
              variant="civic"
              size="sm"
              onClick={() => requestLocation(true)}
              isLoading={isLocating}
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Enable GPS Location
            </Button>
          )}

          <Button
            variant="civic"
            size="sm"
            onClick={() => navigate('/report')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Report Issue Here
          </Button>
        </div>
      </div>

      {/* Strict Privacy Notice Banner */}
      <div className="flex items-start gap-3 p-3.5 bg-sky-50/80 rounded-2xl border border-sky-100 text-xs text-sky-900">
        <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Strict Citizen Privacy Guarantee: </span>
          <span>
            This map displays ONLY your personal verified device coordinates. Exact locations of other citizens are never exposed publicly on the citizen portal.
          </span>
        </div>
      </div>

      {/* Interactive Map View */}
      <MapContainer
        mode="citizen"
        title="Personal Location Beacon"
        subtitle={location ? `${location.ward} · ${location.city}` : 'Live Browser GPS & GIS Jurisdiction'}
        detectedLocation={detectedLocation}
        onDetectLocation={handleLocationAction}
        onLocationChange={updateVerifiedLocation}
        isDetectingLocation={isLocating}
        locationError={error}
        permissionStatus={permissionStatus}
        onOpenTroubleshooting={openDeniedModal}
        onSelectManualWard={selectManualWard}
        heightClass="h-[460px] sm:h-[520px]"
      />

      {/* Location Metadata Cards */}
      {location ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="default" padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">PostGIS Detected Ward</p>
              <p className="text-sm font-bold text-slate-900 truncate" title={location.ward}>
                {location.ward}
              </p>
              <p className="text-[11px] text-slate-500 truncate" title={location.address}>
                {location.address}
              </p>
            </div>
          </Card>

          <Card variant="default" padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Real Device GPS</p>
              <p className="text-sm font-bold text-slate-900">
                Live Sensor Verified
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">Coordinates Protected</p>
            </div>
          </Card>

          <Card variant="default" padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Accuracy Margin</p>
              <p className="text-sm font-bold font-mono text-slate-900">
                ±{location.accuracy} meters ({location.accuracy <= 15 ? 'High Precision' : 'Civic Standard'})
              </p>
              <p className="text-[11px] text-slate-400">Cryptographically stamped</p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            Real device coordinates are not currently acquired.
          </p>
          <p className="text-[11px] text-slate-400">
            Click &quot;Enable GPS Location&quot; to permit browser geolocation and center the map on your exact coordinates.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestLocation(true)}
            isLoading={isLocating}
            leftIcon={<Compass className="w-3.5 h-3.5" />}
          >
            Request Location Permission
          </Button>
        </div>
      )}
    </div>
  );
};
