import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type WardLookupStatus = 'matched' | 'geocoder-matched' | 'manual-selected' | 'boundary-not-found' | 'lookup-unavailable';

export interface RealLocationData {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  timestamp: string; // ISO string
  ward: string;
  wardNumber?: string;
  wardId?: string;
  gpsVerified?: boolean;
  city: string;
  address: string; // Human-readable address
  wardLookupStatus?: WardLookupStatus;
  wardLookupError?: string;
  wardLookupSource?: 'postgis-boundary' | 'nominatim' | 'unavailable';
  street?: string;
  suburb?: string;
  postcode?: string;
}

export const formatVerifiedLocationLabel = (
  location: Pick<RealLocationData, 'ward' | 'wardNumber' | 'city' | 'wardLookupStatus'>
): string => {
  const verificationLabel = location.wardLookupStatus === 'manual-selected'
    ? ' (manual)'
    : location.wardLookupStatus === 'geocoder-matched'
      ? ' (geocoder)'
      : '';
  const wardLabel = location.wardNumber
    ? `Ward ${location.wardNumber}${location.ward ? ` · ${location.ward}` : ''}`
    : location.ward || 'Ward unavailable';
  return `${wardLabel}${verificationLabel}, ${location.city || 'City unavailable'}`;
};

interface ReverseGeocodeResult {
  displayName: string;
  street?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  wardNumber?: string;
  wardName?: string;
  formattedShort: string;
}

const reverseGeocodeCache = new Map<string, Promise<ReverseGeocodeResult>>();
let lastNominatimRequestAt = 0;

const coordinateLabel = (latitude: number, longitude: number) =>
  `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

const parseGeocoderWard = (value: unknown): { wardNumber?: string; wardName: string } | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const wardName = value.trim();
  const wardNumberMatch = wardName.match(/\bward\s*(?:no\.?|number)?\s*[-:#]?\s*(\d+)\b/i);
  return {
    wardNumber: wardNumberMatch?.[1],
    wardName,
  };
};

const prototypeWardOptions = () => Array.from({ length: 49 }, (_, index) => {
  const wardNumber = String(index + 1);
  return {
    id: `sec-muzaffarpur-ward-${wardNumber}`,
    wardNumber,
    name: '',
    city: 'Muzaffarpur',
    lat: 0,
    lon: 0,
  };
});

export const locationService = {
  async getWards(): Promise<{ id: string; wardNumber: string; name: string; city: string; lat: number; lon: number }[]> {
    if (!isSupabaseConfigured) return prototypeWardOptions();
    const { data, error } = await supabase.rpc('get_ward_centers');
    if (error) {
      console.warn('[JalSetu GPS] Ward centers unavailable; using official-numbered manual prototype options.', error);
      return prototypeWardOptions();
    }
    const wards = ((data || []) as {
      id: string;
      ward_number: string;
      ward_name: string;
      city: string;
      latitude: number;
      longitude: number;
    }[]).map((ward) => ({
      id: ward.id,
      wardNumber: ward.ward_number,
      name: ward.ward_name,
      city: ward.city,
      lat: ward.latitude,
      lon: ward.longitude,
    }));
    if (wards.length > 0) return wards;

    return prototypeWardOptions();
  },
  /**
   * Checks the current browser geolocation permission status safely with verbose diagnostics.
   */
  async checkPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    console.groupCollapsed('%c[JalSetu GPS] Checking Geolocation & Permission Support', 'color: #0284c7; font-weight: bold;');
    const isBrowser = typeof window !== 'undefined';
    const hasNavigator = isBrowser && !!navigator.geolocation;
    const isSecure = isBrowser && (window.isSecureContext ?? window.location.protocol === 'https:');
    const isIframe = isBrowser && window.self !== window.top;

    console.log('[JalSetu GPS] Environment diagnostics:', {
      isSecureContext: isSecure,
      protocol: isBrowser ? window.location.protocol : 'N/A',
      host: isBrowser ? window.location.host : 'N/A',
      isIframe,
      hasNavigatorGeolocation: hasNavigator,
      userAgent: isBrowser ? navigator.userAgent : 'N/A',
    });

    if (!isBrowser || !hasNavigator) {
      console.warn('%c[JalSetu GPS] Geolocation API is not supported on this browser/environment.', 'color: #f59e0b; font-weight: bold;');
      console.groupEnd();
      return 'unsupported';
    }

    if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn('%c[JalSetu GPS] Warning: Geolocation requires a secure HTTPS context or localhost.', 'color: #f59e0b;');
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log(`%c[JalSetu GPS] Permissions API query result: "${permission.state}"`, 'color: #0284c7; font-weight: bold;');
        console.groupEnd();
        return permission.state; // 'granted' | 'denied' | 'prompt'
      } catch (err) {
        console.log('[JalSetu GPS] navigator.permissions.query not supported for geolocation or threw:', err);
      }
    } else {
      console.log('[JalSetu GPS] navigator.permissions.query is unavailable, defaulting to "prompt".');
    }

    console.groupEnd();
    return 'prompt';
  },

  /**
   * Prompts the browser for real device GPS coordinates with high accuracy,
   * with automatic fallback to standard network/Wi-Fi positioning if high-accuracy satellite lock times out.
   */
  getCurrentPosition(options?: {
    timeout?: number;
    maximumAge?: number;
    enableHighAccuracy?: boolean;
  }): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        console.warn('%c[JalSetu GPS] navigator.geolocation is missing or unsupported!', 'color: #f59e0b; font-weight: bold;');
        reject(new Error('Geolocation is not supported by this browser or device.'));
        return;
      }

      const initialHighAccuracy = options?.enableHighAccuracy ?? true;
      const initialTimeout = options?.timeout ?? 10000;
      const maximumAge = options?.maximumAge ?? 0;

      console.group('%c[JalSetu GPS] Invoking navigator.geolocation.getCurrentPosition', 'color: #0284c7; font-weight: bold;');
      console.log('[JalSetu GPS] Request options:', {
        enableHighAccuracy: initialHighAccuracy,
        timeout: initialTimeout,
        maximumAge,
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('%c[JalSetu GPS] Device location acquired.', 'color: #10b981; font-weight: bold;');
          console.groupEnd();
          resolve(position);
        },
        (error) => {
          console.warn('%c[JalSetu GPS] Initial geolocation attempt returned error:', 'color: #f59e0b; font-weight: bold;', {
            code: error.code,
            codeName:
              error.code === 1
                ? 'PERMISSION_DENIED'
                : error.code === 2
                ? 'POSITION_UNAVAILABLE'
                : error.code === 3
                ? 'TIMEOUT'
                : 'UNKNOWN',
            message: error.message,
          });

          // If high-accuracy timed out or is unavailable (common on desktop/laptops without satellite chips),
          // attempt automatic fallback to standard network/Wi-Fi triangulation.
          if (initialHighAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
            console.log(
              '%c[JalSetu GPS] Attempting automatic fallback with enableHighAccuracy: false (Wi-Fi/Cellular/Network triangulation)...',
              'color: #0284c7; font-weight: bold;'
            );

            navigator.geolocation.getCurrentPosition(
              (fallbackPosition) => {
                console.log('%c[JalSetu GPS] Fallback device location acquired.', 'color: #10b981; font-weight: bold;');
                console.groupEnd();
                resolve(fallbackPosition);
              },
              (fallbackError) => {
                console.warn('%c[JalSetu GPS] Fallback geolocation attempt also failed:', 'color: #f59e0b; font-weight: bold;', {
                  code: fallbackError.code,
                  message: fallbackError.message,
                });
                console.groupEnd();

                let message = 'Unable to acquire device location.';
                if (fallbackError.code === fallbackError.PERMISSION_DENIED) {
                  message = 'Location permission was denied in your browser settings. Please allow location access to continue.';
                } else if (fallbackError.code === fallbackError.POSITION_UNAVAILABLE) {
                  message = 'Device location is currently unavailable. Please verify GPS or Wi-Fi location services are enabled on your device.';
                } else if (fallbackError.code === fallbackError.TIMEOUT) {
                  message = 'GPS location request timed out. Please check your device location settings or move to an open area.';
                }
                const err = new Error(message) as any;
                err.code = fallbackError.code;
                reject(err);
              },
              {
                enableHighAccuracy: false,
                timeout: 12000,
                maximumAge: 30000,
              }
            );
            return;
          }

          console.groupEnd();

          let message = 'Unable to acquire device location.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission was denied in your browser settings. Please click the lock or settings icon in your address bar to allow location access.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Device GPS position is currently unavailable. Please verify GPS or Wi-Fi location is turned on in your device settings.';
          } else if (error.code === error.TIMEOUT) {
            message = 'GPS location request timed out. Please try again.';
          }
          const err = new Error(message) as any;
          err.code = error.code;
          reject(err);
        },
        {
          enableHighAccuracy: initialHighAccuracy,
          timeout: initialTimeout,
          maximumAge,
        }
      );
    });
  },

  /**
   * Real Reverse Geocoding: Converts raw GPS coordinates into human-readable street, neighbourhood, and city names.
   * Uses OpenStreetMap Nominatim reverse geocoding API with proper attribution headers.
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodeResult> {
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const cachedResult = reverseGeocodeCache.get(cacheKey);
    if (cachedResult) return cachedResult;

    const request = (async (): Promise<ReverseGeocodeResult> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const delay = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        lastNominatimRequestAt = Date.now();

        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.search = new URLSearchParams({
          format: 'jsonv2',
          lat: String(latitude),
          lon: String(longitude),
          zoom: '18',
          addressdetails: '1',
        }).toString();
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Nominatim reverse geocoding failed with HTTP ${response.status}.`);
        }

        const data = await response.json();
        const addr = data.address || {};
        const street = addr.road || addr.pedestrian || addr.street || addr.lane || addr.path;
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || addr.city_district;
        // Do not use district/county as the city: it can incorrectly turn a
        // municipal lookup into a district-level result.
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.borough;
        const geocoderWard = parseGeocoderWard(addr.ward);
        const state = addr.state;
        const postcode = addr.postcode;
        const displayName = typeof data.display_name === 'string' ? data.display_name : '';
        const formattedShort = [street, suburb, city].filter(Boolean).join(', ')
          || displayName
          || `GPS coordinates: ${coordinateLabel(latitude, longitude)}`;
        return {
          displayName: displayName || formattedShort,
          street,
          suburb,
          city,
          state,
          postcode,
          wardNumber: geocoderWard?.wardNumber,
          wardName: geocoderWard?.wardName,
          formattedShort,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    })();
    reverseGeocodeCache.set(cacheKey, request);

    try {
      return await request;
    } catch (error) {
      reverseGeocodeCache.delete(cacheKey);
      console.warn('[JalSetu GPS] Reverse geocoding unavailable; showing coordinates without guessing a city.', error);
      const coordinates = `GPS coordinates: ${coordinateLabel(latitude, longitude)}`;
      return { displayName: coordinates, formattedShort: coordinates };
    }
  },

  /**
   * PostGIS Ward Detection:
   * Maps device coordinates to the corresponding municipal water ward.
  * Returns only a ward whose configured PostGIS boundary contains the GPS point.
   */
  async detectWard(
    latitude: number,
    longitude: number,
    cityName?: string,
    geocoderWard?: Pick<ReverseGeocodeResult, 'wardNumber' | 'wardName'>
  ): Promise<{
    wardId?: string;
    wardNumber: string;
    wardName: string;
    city: string;
    status: WardLookupStatus;
  }> {
    if (!isSupabaseConfigured) {
      return { wardNumber: '', wardName: '', city: cityName || '', status: 'lookup-unavailable' };
    }

    const { data, error } = await supabase.rpc('get_ward_by_coordinates', {
      lat: latitude,
      lon: longitude,
    });
    if (error) {
      throw new Error(`PostGIS ward lookup failed: ${error.message}`);
    }

    const ward = data?.find((entry: { ward_id?: string; ward_name?: string; ward_number?: string; city?: string }) =>
      entry?.ward_id && entry?.ward_number && entry?.ward_name && entry?.city
    );
    if (!ward) {
      if (geocoderWard?.wardName) {
        return {
          wardNumber: geocoderWard.wardNumber || '',
          wardName: geocoderWard.wardName,
          city: cityName || '',
          status: 'geocoder-matched',
        };
      }
      return { wardNumber: '', wardName: '', city: cityName || '', status: 'boundary-not-found' };
    }

    return {
      wardId: ward.ward_id,
      wardNumber: ward.ward_number,
      wardName: ward.ward_name,
      city: ward.city,
      status: 'matched',
    };
  },

  async resolveCoordinates(
    latitude: number,
    longitude: number,
    accuracy: number,
    timestamp = new Date().toISOString()
  ): Promise<RealLocationData> {
    if (
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    ) {
      throw new Error('GPS returned invalid latitude or longitude coordinates.');
    }

    const geocode = await this.reverseGeocode(latitude, longitude);
    let wardData: Awaited<ReturnType<typeof this.detectWard>>;
    let wardLookupError: string | undefined;
    try {
      wardData = await this.detectWard(latitude, longitude, geocode.city, geocode);
    } catch (error) {
      wardLookupError = error instanceof Error ? error.message : 'PostGIS ward lookup failed.';
      console.error('[JalSetu GPS] Coordinates acquired but PostGIS ward lookup failed.', error);
      wardData = {
        wardNumber: '',
        wardName: '',
        city: geocode.city || '',
        status: 'lookup-unavailable',
      };
    }

    return {
      latitude,
      longitude,
      accuracy: Math.round(accuracy),
      timestamp,
      ward: wardData.wardName,
      wardNumber: wardData.wardNumber,
      wardId: wardData.wardId,
      gpsVerified: true,
      city: wardData.status === 'matched' ? wardData.city : geocode.city || '',
      address: geocode.formattedShort,
      wardLookupStatus: wardData.status,
      wardLookupError,
      wardLookupSource: wardData.status === 'matched'
        ? 'postgis-boundary'
        : wardData.status === 'geocoder-matched'
          ? 'nominatim'
          : 'unavailable',
      street: geocode.street,
      suburb: geocode.suburb,
      postcode: geocode.postcode,
    };
  },

  /**
   * Master function: Executes the complete GPS flow:
   * Real Device GPS -> Latitude + Longitude + Accuracy -> Reverse Geocoding -> PostGIS Ward Detection
   */
  async getCompleteLocation(options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
  }): Promise<RealLocationData> {
    console.group('%c[JalSetu GPS] Executing Full Location Pipeline', 'color: #0284c7; font-weight: bold;');
    const position = await this.getCurrentPosition(options);
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = new Date(position.timestamp).toISOString();

    console.log('[JalSetu GPS] Step 2: Resolving city via Nominatim and ward via PostGIS...');
    const completeResult = await this.resolveCoordinates(latitude, longitude, accuracy || 0, timestamp);

    console.log('%c[JalSetu GPS] Location pipeline complete.', 'color: #10b981; font-weight: bold;');
    console.groupEnd();

    return completeResult;
  },
};
