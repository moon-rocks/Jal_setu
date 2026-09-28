import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Minus, Compass, MapPin, Layers, RefreshCw, CheckCircle2, Shield, Radio } from 'lucide-react';
import { locationService, RealLocationData } from '../../services/locationService';

export interface MapContainerProps {
  mode?: 'citizen' | 'admin' | 'detail';
  title?: string;
  subtitle?: string;
  detectedLocation?: {
    ward: string;
    city: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    address?: string;
  };
  onDetectLocation?: () => void;
  onLocationChange?: (location: RealLocationData) => void;
  isDetectingLocation?: boolean;
  locationError?: string | null;
  permissionStatus?: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';
  onOpenTroubleshooting?: () => void;
  onSelectManualWard?: (ward: string) => void;
  className?: string;
  heightClass?: string;
  emptyMessage?: string;
}

// 100% Free OpenStreetMap and Open Geospatial Tiles (Zero API Key Required)
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  osm_hot: {
    name: 'OpenStreetMap Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, Tiles courtesy of <a href="https://www.hotosm.org/" target="_blank" rel="noopener noreferrer">Humanitarian OSM</a>',
    subdomains: 'abc',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satellite Aerial (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    subdomains: '',
    maxZoom: 18,
  },
};

export const MapContainer: React.FC<MapContainerProps> = ({
  mode = 'citizen',
  title,
  subtitle,
  detectedLocation,
  onDetectLocation,
  onLocationChange,
  isDetectingLocation = false,
  locationError,
  permissionStatus,
  onOpenTroubleshooting,
  onSelectManualWard,
  className = '',
  heightClass = 'h-[360px] sm:h-[420px]',
  emptyMessage,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasAutoCenteredRef = useRef<boolean>(false);
  const lastMarkerPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const pendingLocationRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const locationDetailsRef = useRef({
    ward: detectedLocation?.ward,
    address: detectedLocation?.address,
  });

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const [activeLayerKey, setActiveLayerKey] = useState<'osm' | 'osm_hot' | 'satellite'>('osm');
  const [liveLocation, setLiveLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp?: string;
  } | null>(null);
  const [isLocatingInternal, setIsLocatingInternal] = useState(false);

  // Derived ward and address from actual coordinates
  const [derivedWard, setDerivedWard] = useState<string | null>(detectedLocation?.ward || null);
  const [derivedCity, setDerivedCity] = useState<string | null>(detectedLocation?.city || null);
  const [derivedAddress, setDerivedAddress] = useState<string | null>(detectedLocation?.address || null);

  useEffect(() => {
    locationDetailsRef.current = {
      ward: derivedWard || detectedLocation?.ward,
      address: derivedAddress || detectedLocation?.address,
    };
  }, [derivedWard, derivedAddress, detectedLocation?.ward, detectedLocation?.address]);

  // Active coordinates
  const activeLat = liveLocation?.lat ?? detectedLocation?.latitude;
  const activeLng = liveLocation?.lng ?? detectedLocation?.longitude;
  const activeAccuracy = liveLocation?.accuracy ?? detectedLocation?.accuracy ?? 12;

  // Reverse geocode and derive ward from real GPS coordinates
  const resolveLocationDetails = useCallback(
    async (lat: number, lng: number, acc: number) => {
      try {
        const geo = await locationService.reverseGeocode(lat, lng);
        const wardInfo = await locationService.detectWard(
          lat,
          lng,
          geo.suburb || geo.street || geo.displayName.split(',')[0],
          geo.city
        );

        setDerivedAddress(geo.formattedShort);
        setDerivedCity(geo.city);
        setDerivedWard(wardInfo.wardName);

        if (onLocationChangeRef.current) {
          onLocationChangeRef.current({
            latitude: lat,
            longitude: lng,
            accuracy: Math.round(acc),
            timestamp: new Date().toISOString(),
            ward: wardInfo.wardName,
            wardNumber: wardInfo.wardNumber,
            wardId: wardInfo.wardId,
            city: geo.city,
            address: geo.formattedShort,
            street: geo.street,
            suburb: geo.suburb,
            postcode: geo.postcode,
          });
        }
      } catch (err) {
        console.warn('[JalSetu Map] Could not reverse geocode coordinates:', err);
      }
    },
    []
  );

  // Build the custom "You are here" marker HTML
  const createBlueMarkerIcon = () => {
    return L.divIcon({
      className: 'custom-you-are-here-marker',
      html: `
        <div class="relative flex h-16 w-32 flex-col items-center justify-end select-none cursor-pointer">
          <!-- "You are here" floating blue badge -->
          <div class="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-[10px] sm:text-[11px] font-extrabold shadow-md border border-white whitespace-nowrap mb-1">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>You are here</span>
          </div>
          <!-- Pulsing Blue Beacon Dot -->
          <div class="relative flex items-center justify-center w-7 h-7">
            <span class="absolute w-7 h-7 rounded-full bg-sky-500/30 animate-ping"></span>
            <span class="absolute w-5 h-5 rounded-full bg-sky-400/40"></span>
            <span class="relative w-3.5 h-3.5 rounded-full bg-sky-600 border-2 border-white shadow-md"></span>
          </div>
        </div>
      `,
      iconSize: [128, 64],
      iconAnchor: [64, 64],
      popupAnchor: [0, -32],
    });
  };

  // Update the marker silently; map movement is reserved for first fix and manual recenter.
  const updateMarkerAndCenter = useCallback(
    (lat: number, lng: number, accuracyMeters: number, shouldCenter: boolean = false) => {
      const map = mapInstanceRef.current;
      if (!map) {
        pendingLocationRef.current = { lat, lng, accuracy: accuracyMeters };
        return;
      }

      const previousPosition = lastMarkerPositionRef.current;
      if (previousPosition) {
        const distanceMeters = map.distance(
          [previousPosition.lat, previousPosition.lng],
          [lat, lng]
        );
        if (distanceMeters < 5 && !shouldCenter) return;
      }
      lastMarkerPositionRef.current = { lat, lng };

      const locationDetails = locationDetailsRef.current;
      const popupContent = `
        <div class="p-1 font-sans text-xs min-w-[210px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
            <div class="font-extrabold text-sky-700 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              You are here
            </div>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live GPS
            </span>
          </div>
          <div class="space-y-1">
            <div class="font-bold text-slate-800 text-[11px]">
              ${locationDetails.ward || 'GPS Verified Sector'}
            </div>
            <div class="text-[10px] text-slate-500 leading-tight">
              ${locationDetails.address || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`}
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
              <span>Accuracy: <strong class="text-slate-800 font-mono">±${Math.round(accuracyMeters)}m</strong></span>
              <span class="text-sky-600 font-semibold">Active Sensor</span>
            </div>
          </div>
        </div>
      `;

      // Update or create blue "You are here" marker
      if (!userMarkerRef.current || !map.hasLayer(userMarkerRef.current)) {
        userMarkerRef.current?.remove();
        const marker = L.marker([lat, lng], {
          icon: createBlueMarkerIcon(),
          zIndexOffset: 1000,
        });
        userMarkerRef.current = marker.addTo(map);

        userMarkerRef.current.bindPopup(popupContent);
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }

      // Update or create accuracy circle
      const radius = Math.max(accuracyMeters, 8);
      if (!accuracyCircleRef.current || !map.hasLayer(accuracyCircleRef.current)) {
        accuracyCircleRef.current?.remove();
        accuracyCircleRef.current = L.circle([lat, lng], {
          radius,
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);
      }

      if (shouldCenter) {
        map.flyTo([lat, lng], 16, { duration: 1.0 });
      }
    },
    []
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center map on real coordinates if already known; else neutral start
    const startLat = activeLat ?? 20.0;
    const startLng = activeLng ?? 0.0;
    const startZoom = activeLat && activeLng ? 16 : 3;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: startZoom,
      zoomControl: false,
      attributionControl: true,
    });

    const activeTileDef = TILE_LAYERS[activeLayerKey];
    const tileLayer = L.tileLayer(activeTileDef.url, {
      attribution: activeTileDef.attribution,
      maxZoom: activeTileDef.maxZoom,
      subdomains: activeTileDef.subdomains,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    const initialLocation = pendingLocationRef.current || (
      typeof activeLat === 'number' && typeof activeLng === 'number'
        ? { lat: activeLat, lng: activeLng, accuracy: activeAccuracy }
        : null
    );
    if (initialLocation) {
      const shouldCenter = !hasAutoCenteredRef.current;
      updateMarkerAndCenter(initialLocation.lat, initialLocation.lng, initialLocation.accuracy, shouldCenter);
      hasAutoCenteredRef.current = true;
      pendingLocationRef.current = null;
    }

    // Invalidate size once rendered in DOM
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      lastMarkerPositionRef.current = null;
    };
  }, []);

  // Update Tile Layer when layer switcher is triggered
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const nextTileDef = TILE_LAYERS[activeLayerKey];
    const newTile = L.tileLayer(nextTileDef.url, {
      attribution: nextTileDef.attribution,
      maxZoom: nextTileDef.maxZoom,
      subdomains: nextTileDef.subdomains,
    }).addTo(map);

    tileLayerRef.current = newTile;
  }, [activeLayerKey]);

  // Request real device GPS coordinates immediately on mount and start watching live updates
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setIsLocatingInternal(true);

    const handleGpsSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setIsLocatingInternal(false);
      setLiveLocation({
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: new Date(pos.timestamp).toISOString(),
      });

      const shouldCenter = !hasAutoCenteredRef.current;
      updateMarkerAndCenter(latitude, longitude, accuracy, shouldCenter);
      if (shouldCenter) hasAutoCenteredRef.current = true;

      // Reverse geocode actual GPS coordinates
      resolveLocationDetails(latitude, longitude, accuracy);
    };

    // 1. Immediate position lock via getCurrentPosition
    navigator.geolocation.getCurrentPosition(
      handleGpsSuccess,
      (err) => {
        console.log('[JalSetu Map] High accuracy GPS lock timeout, falling back to standard accuracy:', err.message);
        // Fallback to standard network/Wi-Fi positioning (reliable on desktop/laptops)
        navigator.geolocation.getCurrentPosition(
          handleGpsSuccess,
          (fallbackErr) => {
            console.log('[JalSetu Map] Geolocation fallback unavailable:', fallbackErr.message);
            setIsLocatingInternal(false);
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );

    // 2. Continuous live GPS tracking via watchPosition
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const shouldCenter = !hasAutoCenteredRef.current;
        if (shouldCenter || !lastMarkerPositionRef.current) {
          setLiveLocation({
            lat: latitude,
            lng: longitude,
            accuracy,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
        }
        updateMarkerAndCenter(latitude, longitude, accuracy, shouldCenter);
        if (shouldCenter) hasAutoCenteredRef.current = true;
      },
      (err) => {
        console.log('[JalSetu Map] Geolocation watch error:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [updateMarkerAndCenter, resolveLocationDetails]);

  // Sync if detectedLocation prop provides or updates coordinates
  useEffect(() => {
    if (
      detectedLocation &&
      typeof detectedLocation.latitude === 'number' &&
      typeof detectedLocation.longitude === 'number'
    ) {
      const lat = detectedLocation.latitude;
      const lng = detectedLocation.longitude;
      const acc = detectedLocation.accuracy || 10;

      if (detectedLocation.ward) setDerivedWard(detectedLocation.ward);
      if (detectedLocation.city) setDerivedCity(detectedLocation.city);
      if (detectedLocation.address) setDerivedAddress(detectedLocation.address);

      const shouldCenter = !hasAutoCenteredRef.current;
      if (shouldCenter || !lastMarkerPositionRef.current) {
        setLiveLocation({ lat, lng, accuracy: acc });
      }
      updateMarkerAndCenter(lat, lng, acc, shouldCenter);
      if (shouldCenter) hasAutoCenteredRef.current = true;
    }
  }, [
    detectedLocation?.latitude,
    detectedLocation?.longitude,
    detectedLocation?.accuracy,
    detectedLocation?.ward,
    detectedLocation?.city,
    detectedLocation?.address,
    updateMarkerAndCenter,
  ]);

  // Recenter Map Handler: centers map directly on user's actual GPS coordinates
  const handleRecenter = () => {
    const latestPosition = lastMarkerPositionRef.current;
    if (latestPosition && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([latestPosition.lat, latestPosition.lng], 16, { duration: 1.0 });
    }

    // Refresh position from device sensor
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsLocatingInternal(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocatingInternal(false);
          const { latitude, longitude, accuracy } = pos.coords;
          setLiveLocation({ lat: latitude, lng: longitude, accuracy });
          updateMarkerAndCenter(latitude, longitude, accuracy, true);
          hasAutoCenteredRef.current = true;
          resolveLocationDetails(latitude, longitude, accuracy);
        },
        () => {
          setIsLocatingInternal(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    if (onDetectLocation) {
      onDetectLocation();
    }
  };

  // Switch Map Layer (OSM Standard -> OSM Humanitarian -> Esri Satellite)
  const handleCycleLayer = () => {
    setActiveLayerKey((prev) => (prev === 'osm' ? 'osm_hot' : prev === 'osm_hot' ? 'satellite' : 'osm'));
  };

  const isLocating = isDetectingLocation || isLocatingInternal;
  const currentWardDisplay = derivedWard || detectedLocation?.ward;
  const currentCityDisplay = derivedCity || detectedLocation?.city;
  const currentAddressDisplay = derivedAddress || detectedLocation?.address;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-xs flex flex-col ${heightClass} ${className}`}
    >
      {/* Top Header Overlay */}
      {(title || subtitle) && (
        <div className="absolute top-3 left-3 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm max-w-[80%] pointer-events-auto">
          {title && (
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              {title}
            </h4>
          )}
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Map Control Buttons (Zoom, Recenter, Layers) */}
      <div className="absolute top-3 right-3 z-40 flex flex-col gap-1.5 pointer-events-auto">
        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            aria-label="Zoom in"
            title="Zoom in"
            className="p-2 text-slate-700 hover:bg-sky-50 hover:text-sky-600 active:scale-95 transition-all cursor-pointer border-b border-slate-100 focus-visible:outline-none"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            aria-label="Zoom out"
            title="Zoom out"
            className="p-2 text-slate-700 hover:bg-sky-50 hover:text-sky-600 active:scale-95 transition-all cursor-pointer focus-visible:outline-none"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Recenter / GPS Fix Button */}
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter on current GPS location"
          title={activeLat ? 'Recenter on My Coordinates' : 'Detect GPS Location'}
          className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm transition-all cursor-pointer focus-visible:outline-none text-slate-700 hover:text-sky-600 hover:bg-sky-50"
        >
          <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-600' : ''}`} />
        </button>

        {/* Layer Switcher Button */}
        <button
          type="button"
          onClick={handleCycleLayer}
          aria-label="Switch map layer style"
          title={`Layer: ${TILE_LAYERS[activeLayerKey].name} (Click to switch)`}
          className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-slate-700 hover:text-sky-600 hover:bg-sky-50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Real Interactive Leaflet Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-full z-0 outline-none"
        style={{ minHeight: '100%' }}
      />

      {/* Blue "You are here" Location Badge (Bottom Left) */}
      {activeLat && activeLng && (
        <div className="absolute bottom-3 left-3 z-40 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/90 shadow-sm max-w-[280px] sm:max-w-xs text-left pointer-events-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse shrink-0" />
            <span className="text-sky-700 font-extrabold">You are here</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 truncate">
              {currentWardDisplay ? `${currentWardDisplay}` : 'Verified GPS Position'}
            </span>
          </div>

          {currentAddressDisplay && (
            <p className="text-[11px] text-slate-600 truncate mt-0.5" title={currentAddressDisplay}>
              {currentAddressDisplay}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Accuracy: <strong className="text-slate-700 font-mono">±{Math.round(activeAccuracy)}m</strong></span>
            </span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
              Live GPS
            </span>
          </div>
        </div>
      )}

      {/* GPS Acquiring Indicator Pill */}
      {!activeLat && isLocating && (
        <div className="absolute bottom-3 left-3 z-40 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/90 shadow-sm flex items-center gap-2 pointer-events-auto">
          <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
          <span className="text-[11px] font-semibold text-slate-700">Acquiring browser GPS coordinates...</span>
        </div>
      )}

      {/* GPS Manual Calibration Pill if not yet acquired and not locating */}
      {!activeLat && !isLocating && onDetectLocation && (
        <div className="absolute bottom-3 left-3 z-40 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-sm flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-700">GPS not calibrated</span>
          <button
            type="button"
            onClick={handleRecenter}
            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
          >
            Detect GPS
          </button>
        </div>
      )}
    </div>
  );
};
