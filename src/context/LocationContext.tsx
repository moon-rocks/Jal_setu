import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { locationService, RealLocationData } from '../services/locationService';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { MapPin, Shield, Compass, Navigation, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export interface LocationContextType {
  location: RealLocationData | null;
  isLocating: boolean;
  hasPermission: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';
  error: string | null;
  isPermissionModalOpen: boolean;
  isDeniedModalOpen: boolean;
  openPermissionModal: () => void;
  closePermissionModal: () => void;
  openDeniedModal: () => void;
  closeDeniedModal: () => void;
  /**
   * Requests user permission and acquires real device GPS.
   * If directPrompt is false and status is prompt, opens explanatory modal first.
   * If directPrompt is true, directly invokes browser geolocation.
   */
  requestLocation: (forceFresh?: boolean, directPrompt?: boolean) => Promise<RealLocationData | null>;
  /**
   * Directly triggers a fresh GPS fix from hardware without showing explanatory modal.
   * Used when user explicitly clicks "Recalibrate GPS" or "Refresh Location" or during report creation.
   */
  getFreshLocation: () => Promise<RealLocationData | null>;
  /**
   * Allows manual municipal ward selection when device GPS permission is blocked or unavailable.
   */
  selectManualWard: (wardNumber: string) => RealLocationData | null;
  /**
   * Allows external map components (like MapContainer) to synchronize live verified GPS coordinates.
   */
  updateVerifiedLocation: (loc: RealLocationData) => void;
  clearLocation: () => void;
  clearError: () => void;
}

export const LocationContext = createContext<LocationContextType>({
  location: null,
  isLocating: false,
  hasPermission: false,
  permissionStatus: 'unknown',
  error: null,
  isPermissionModalOpen: false,
  isDeniedModalOpen: false,
  openPermissionModal: () => {},
  closePermissionModal: () => {},
  openDeniedModal: () => {},
  closeDeniedModal: () => {},
  requestLocation: async () => null,
  getFreshLocation: async () => null,
  selectManualWard: () => null,
  updateVerifiedLocation: () => {},
  clearLocation: () => {},
  clearError: () => {},
});

const STORAGE_KEY = 'jalsetu_verified_location';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<RealLocationData | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Safety check: ensure no legacy hardcoded coordinates are retained
          if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
            console.log('[JalSetu GPS] Restored previously verified session location:', parsed.ward, `${parsed.latitude}, ${parsed.longitude}`);
            return parsed;
          }
        }
      } catch {
        // ignore cache parse error
      }
    }
    return null;
  });

  const [isLocating, setIsLocating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown'>('unknown');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isDeniedModalOpen, setIsDeniedModalOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<'chrome' | 'safari' | 'os'>('chrome');
  const [municipalWards, setMunicipalWards] = useState<Awaited<ReturnType<typeof locationService.getWards>>>([]);

  useEffect(() => {
    let isMounted = true;
    locationService.getWards().then((wards) => {
      if (isMounted) setMunicipalWards(wards);
    }).catch(() => {
      if (isMounted) setMunicipalWards([]);
    });
    return () => { isMounted = false; };
  }, []);

  // Check initial permission status on mount WITHOUT triggering silent geolocation
  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      const status = await locationService.checkPermissionStatus();
      if (isMounted) {
        setPermissionStatus(status);
        if (status === 'granted') {
          setHasPermission(true);
          // If permission is already granted and no location cached, automatically acquire location
          acquireLocationWorker();
        } else if (status === 'denied') {
          setHasPermission(false);
        }
      }
    }

    checkStatus();

    // Listen to permission changes if supported
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatusObj) => {
        permissionStatusObj.onchange = () => {
          if (isMounted) {
            console.log(`%c[JalSetu GPS] Browser permission state dynamically changed to: "${permissionStatusObj.state}"`, 'color: #0284c7; font-weight: bold;');
            setPermissionStatus(permissionStatusObj.state);
            setHasPermission(permissionStatusObj.state === 'granted');
            if (permissionStatusObj.state === 'granted') {
              setError(null);
              setIsDeniedModalOpen(false);
              acquireLocationWorker();
            }
          }
        };
      }).catch((err) => {
        console.log('[JalSetu GPS] permissions query error (safe to ignore):', err);
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const openPermissionModal = useCallback(() => {
    setIsPermissionModalOpen(true);
  }, []);

  const closePermissionModal = useCallback(() => {
    setIsPermissionModalOpen(false);
  }, []);

  const openDeniedModal = useCallback(() => {
    setIsDeniedModalOpen(true);
  }, []);

  const closeDeniedModal = useCallback(() => {
    setIsDeniedModalOpen(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Internal worker to obtain real hardware GPS, reverse geocode, and detect PostGIS ward.
   */
  const acquireLocationWorker = useCallback(async (): Promise<RealLocationData | null> => {
    console.log('%c[JalSetu GPS] acquireLocationWorker starting...', 'color: #0284c7; font-weight: bold;');
    setIsLocating(true);
    setError(null);

    try {
      const completeLoc = await locationService.getCompleteLocation({
        enableHighAccuracy: true,
        timeout: 12000,
      });

      setLocation(completeLoc);
      setHasPermission(true);
      setPermissionStatus('granted');
      setError(null);
      setIsDeniedModalOpen(false);

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(completeLoc));
      } catch {
        // storage quota fallback
      }

      setIsLocating(false);
      return completeLoc;
    } catch (err: any) {
      setIsLocating(false);
      const errMsg = err?.message || 'Unable to retrieve device GPS.';
      const isDenied = err?.code === 1 || errMsg.toLowerCase().includes('denied');

      console.warn('%c[JalSetu GPS] acquireLocationWorker notice:', 'color: #f59e0b; font-weight: bold;', {
        code: err?.code,
        message: errMsg,
        isDenied,
      });

      setError(errMsg);

      if (isDenied) {
        setPermissionStatus('denied');
        setHasPermission(false);
      }
      return null;
    }
  }, []);

  /**
   * Prompts user for location permission.
   * If permission is already granted or directPrompt is true, directly executes.
   * Otherwise opens the transparent civic explanation dialog so the user explicitly opts in.
   */
  const requestLocation = useCallback(
    async (forceFresh = false, directPrompt = false): Promise<RealLocationData | null> => {
      console.log('[JalSetu GPS] requestLocation invoked:', { forceFresh, directPrompt, hasLocation: !!location });

      if (!forceFresh && location) {
        console.log('[JalSetu GPS] Reusing verified location from context.');
        return location;
      }

      // Check current browser permission state
      const currentStatus = await locationService.checkPermissionStatus();

      if (currentStatus === 'granted' || directPrompt) {
        console.log('[JalSetu GPS] Directly triggering acquireLocationWorker...');
        return await acquireLocationWorker();
      }

      if (currentStatus === 'denied') {
        const msg = 'Location permission is blocked in your browser settings. Click "How to Enable Location" to view instructions.';
        setError(msg);
        return null;
      }

      // If prompt or unknown and directPrompt is false, show explicit explanatory dialog before native prompt
      return new Promise((resolve) => {
        setIsPermissionModalOpen(true);
        resolve(null);
      });
    },
    [location, acquireLocationWorker]
  );

  /**
   * Obtains a fresh GPS fix from device hardware (required when creating a Water Issue Report).
   */
  const getFreshLocation = useCallback(async (): Promise<RealLocationData | null> => {
    console.log('[JalSetu GPS] getFreshLocation invoked.');
    return await acquireLocationWorker();
  }, [acquireLocationWorker]);

  /**
   * Allows the citizen to select their municipal ward manually if GPS permission is denied or unavailable.
   */
  const selectManualWard = useCallback((wardIdentifier: string): RealLocationData | null => {
    const wardDef = municipalWards.find((ward) =>
      ward.wardNumber.toLowerCase() === wardIdentifier.toLowerCase() || ward.name.toLowerCase() === wardIdentifier.toLowerCase()
    );
    if (!wardDef) return null;

    const manualLoc: RealLocationData = {
      latitude: wardDef.lat,
      longitude: wardDef.lon,
      accuracy: 0,
      timestamp: new Date().toISOString(),
      ward: wardDef.name,
      wardNumber: wardDef.wardNumber,
      city: wardDef.city,
      address: wardDef.name,
      suburb: wardDef.name.split(' - ')[1] || wardDef.name,
      gpsVerified: false,
    };

    console.log('[JalSetu GPS] Citizen manually selected municipal ward:', manualLoc);
    setLocation(manualLoc);
    setError(null);
    setIsDeniedModalOpen(false);

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(manualLoc));
    } catch {
      // storage quota fallback
    }

    return manualLoc;
  }, [municipalWards]);

  const updateVerifiedLocation = useCallback((newLoc: RealLocationData) => {
    setLocation(newLoc);
    setHasPermission(true);
    setPermissionStatus('granted');
    setError(null);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
    } catch {
      // ignore
    }
  }, []);

  const clearLocation = useCallback(() => {
    console.log('[JalSetu GPS] Location cleared by user.');
    setLocation(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleModalConfirm = async () => {
    setIsPermissionModalOpen(false);
    await acquireLocationWorker();
  };

  const handleRetryAfterUnblock = async () => {
    setError(null);
    setIsDeniedModalOpen(false);
    await acquireLocationWorker();
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        isLocating,
        hasPermission,
        permissionStatus,
        error,
        isPermissionModalOpen,
        isDeniedModalOpen,
        openPermissionModal,
        closePermissionModal,
        openDeniedModal,
        closeDeniedModal,
        requestLocation,
        getFreshLocation,
        selectManualWard,
        updateVerifiedLocation,
        clearLocation,
        clearError,
      }}
    >
      {children}

      {/* Transparent Civic Location Permission Modal */}
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={closePermissionModal}
        title="Enable Device GPS Location"
        maxWidth="md"
      >
        <div className="space-y-4 py-1 text-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-inner border border-sky-100">
            <Navigation className="w-7 h-7 text-sky-600" />
          </div>

          <div className="text-center space-y-1.5">
            <h4 className="text-base font-bold text-slate-900">
              Verify Water Infrastructure Wards
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              JalSetu uses your device&apos;s real-time GPS coordinates to automatically determine your municipal ward, display local pipe pressure telemetry, and accurately dispatch on-duty field teams.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Shield className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Strict Civic Privacy Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Coordinates are requested only with your permission and are strictly used for municipal water services. Your exact location is never publicly disclosed to other citizens.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={closePermissionModal}
              disabled={isLocating}
            >
              Maybe Later
            </Button>
            <Button
              type="button"
              variant="civic"
              size="md"
              onClick={handleModalConfirm}
              isLoading={isLocating}
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Allow GPS Location
            </Button>
          </div>
        </div>
      </Modal>

      {/* User-Friendly Location Permission Denied / Blocked Troubleshooting Modal */}
      <Modal
        isOpen={isDeniedModalOpen}
        onClose={closeDeniedModal}
        title="Location Access Blocked"
        maxWidth="lg"
      >
        <div className="space-y-4 py-1 text-slate-700">
          <div className="flex items-start gap-3.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <h5 className="font-bold text-amber-900 text-sm">
                Why was my location not detected?
              </h5>
              <p className="text-amber-800 leading-relaxed">
                {error || 'Your web browser or operating system has blocked location access for this site.'}
              </p>
              <p className="text-[11px] text-amber-700 pt-1">
                JalSetu requires coordinates to match your municipal ward and water pipe network. You can allow location in your browser, or pick your ward manually below.
              </p>
            </div>
          </div>

          {/* Quick Alternative: Select Ward Manually */}
          <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                Select Municipal Ward Directly
              </span>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                Instant Access
              </span>
            </div>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              If your device does not allow GPS access, select your municipal ward to view local water pressure and submit reports:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <select
                id="manual-ward-dropdown"
                className="flex-1 bg-white border border-sky-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                defaultValue={location?.wardNumber || ''}
              >
                <option value="">Select a ward</option>
                {municipalWards.map((ward) => (
                  <option key={ward.id} value={ward.wardNumber}>
                    {ward.name}
                  </option>
                ))}
              </select>
              {municipalWards.length === 0 && <p className="text-[11px] text-slate-500">No ward centroids are configured.</p>}
              <Button
                type="button"
                variant="civic"
                size="sm"
                onClick={() => {
                  const el = document.getElementById('manual-ward-dropdown') as HTMLSelectElement;
                  if (el) selectManualWard(el.value);
                }}
                className="text-xs shrink-0"
              >
                Set Ward
              </Button>
            </div>
          </div>

          {/* Browser Selection Tabs */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveHelpTab('chrome')}
                className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer ${
                  activeHelpTab === 'chrome'
                    ? 'bg-white text-sky-700 font-bold border-b-2 border-sky-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Chrome / Edge / Brave
              </button>
              <button
                type="button"
                onClick={() => setActiveHelpTab('safari')}
                className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer ${
                  activeHelpTab === 'safari'
                    ? 'bg-white text-sky-700 font-bold border-b-2 border-sky-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Safari (Mac / iOS)
              </button>
              <button
                type="button"
                onClick={() => setActiveHelpTab('os')}
                className={`flex-1 py-2.5 px-3 text-center transition-colors cursor-pointer ${
                  activeHelpTab === 'os'
                    ? 'bg-white text-sky-700 font-bold border-b-2 border-sky-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Device / OS Settings
              </button>
            </div>

            <div className="p-4 text-xs space-y-2.5 bg-white">
              {activeHelpTab === 'chrome' && (
                <ol className="list-decimal list-inside space-y-2 text-slate-700">
                  <li className="leading-relaxed">
                    Look at the <strong>address bar</strong> at the top of your browser (next to the website URL).
                  </li>
                  <li className="leading-relaxed">
                    Click the <strong>Padlock (🔒)</strong>, <strong>Tune</strong>, or <strong>Location Blocked</strong> icon.
                  </li>
                  <li className="leading-relaxed">
                    Under <strong>Location</strong>, change the permission from <span className="text-rose-600 font-semibold">Block</span> to <span className="text-emerald-600 font-semibold">Allow</span>.
                  </li>
                  <li className="leading-relaxed">
                    Click the <strong>&ldquo;Try Again&rdquo;</strong> button below to acquire your coordinates.
                  </li>
                </ol>
              )}

              {activeHelpTab === 'safari' && (
                <ol className="list-decimal list-inside space-y-2 text-slate-700">
                  <li className="leading-relaxed">
                    <strong>Mac:</strong> In the top menu bar, click <strong>Safari &gt; Settings (Preferences) &gt; Websites &gt; Location</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Find this website in the list and set the dropdown to <strong>Allow</strong>.
                  </li>
                  <li className="leading-relaxed">
                    <strong>iPhone / iPad:</strong> Go to <strong>Settings &gt; Privacy &amp; Security &gt; Location Services</strong>, ensure it is On, and check Safari Websites.
                  </li>
                </ol>
              )}

              {activeHelpTab === 'os' && (
                <div className="space-y-2 text-slate-700">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-900">Windows:</span> Go to <strong>Start &gt; Settings &gt; Privacy &amp; Security &gt; Location</strong>. Turn ON &ldquo;Location services&rdquo; and &ldquo;Let apps access location&rdquo;.
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-900">Mac:</span> Go to <strong>System Settings &gt; Privacy &amp; Security &gt; Location Services</strong>. Ensure Location Services and your browser are enabled.
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-900">Mobile (Android / iPhone):</span> Swipe down from the top of your screen and verify the <strong>Location / GPS</strong> toggle is turned ON.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={closeDeniedModal}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="civic"
              size="md"
              onClick={handleRetryAfterUnblock}
              isLoading={isLocating}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
          </div>
        </div>
      </Modal>
    </LocationContext.Provider>
  );
};

export function useLocationContext() {
  return useContext(LocationContext);
}
