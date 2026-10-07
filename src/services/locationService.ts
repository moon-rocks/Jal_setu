import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  street?: string;
  suburb?: string;
  postcode?: string;
}

export const locationService = {
  async getWards(): Promise<{ id: string; wardNumber: string; name: string; city: string; lat: number; lon: number }[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('get_ward_centers');
    if (error) throw error;
    return ((data || []) as {
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
          console.log('%c[JalSetu GPS] Location successfully acquired!', 'color: #10b981; font-weight: bold;', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp).toISOString(),
          });
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
                console.log('%c[JalSetu GPS] Fallback location acquired successfully!', 'color: #10b981; font-weight: bold;', {
                  latitude: fallbackPosition.coords.latitude,
                  longitude: fallbackPosition.coords.longitude,
                  accuracyMeters: fallbackPosition.coords.accuracy,
                  timestamp: new Date(fallbackPosition.timestamp).toISOString(),
                });
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
  ): Promise<{
    displayName: string;
    street?: string;
    suburb?: string;
    city: string;
    state?: string;
    postcode?: string;
    formattedShort: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JalSetu-WaterPlatform/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};

        const street = addr.road || addr.pedestrian || addr.street || addr.lane || addr.path;
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || addr.city_district;
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || 'Current Location';
        const state = addr.state || '';
        const postcode = addr.postcode;

        // Build human-friendly short address
        const parts = [street, suburb, city].filter(Boolean);
        const formattedShort =
          parts.length > 0
            ? parts.join(', ')
            : data.display_name
            ? data.display_name.split(',').slice(0, 3).join(', ')
            : `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;

        return {
          displayName: data.display_name || formattedShort,
          street,
          suburb,
          city,
          state,
          postcode,
          formattedShort,
        };
      }
    } catch (err) {
      console.warn('Reverse geocoding network fallback:', err);
    }

    // Fallback based on raw coordinates if network is delayed
    return {
      displayName: `GPS (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`,
      city: 'Current Location',
      formattedShort: `GPS: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
    };
  },

  /**
   * PostGIS Ward Detection:
   * Maps device coordinates to the corresponding municipal water ward.
  * Returns only a ward whose configured PostGIS boundary contains the GPS point.
   */
  async detectWard(
    latitude: number,
    longitude: number,
    cityName?: string
  ): Promise<{
    wardId?: string;
    wardNumber: string;
    wardName: string;
    city: string;
  }> {
    // 1. Try Supabase PostGIS RPC if available
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_ward_by_coordinates', {
        lat: latitude,
        lon: longitude,
      });
      if (error) throw new Error(`PostGIS ward lookup failed: ${error.message}`);

      if (data && data.length > 0 && data[0]?.ward_name) {
        return {
          wardId: data[0].ward_id,
          wardNumber: data[0].ward_number || '',
          wardName: data[0].ward_name,
          city: data[0].city || cityName || 'Municipal Jurisdiction',
        };
      }
    }

    const effectiveCity = cityName || 'Current Location';
    return {
      wardNumber: '',
      wardName: '',
      city: effectiveCity,
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

    console.log('[JalSetu GPS] Step 1: Raw Coordinates ->', {
      latitude,
      longitude,
      accuracyMargin: `±${Math.round(accuracy || 0)}m`,
      timestamp,
    });

    // 1. Reverse Geocode for Human-readable location
    console.log('[JalSetu GPS] Step 2: Reverse Geocoding via OpenStreetMap Nominatim...');
    const geocode = await this.reverseGeocode(latitude, longitude);
    console.log('[JalSetu GPS] Step 2: Reverse Geocode result ->', geocode.formattedShort);

    // 2. PostGIS Ward Detection
    console.log('[JalSetu GPS] Step 3: Determining Municipal Ward...');
    const wardData = await this.detectWard(latitude, longitude, geocode.city);
    console.log('[JalSetu GPS] Step 3: Ward detected ->', wardData.wardName);

    const completeResult: RealLocationData = {
      latitude,
      longitude,
      accuracy: Math.round(accuracy || 8),
      timestamp,
      ward: wardData.wardName,
      wardNumber: wardData.wardNumber,
      wardId: wardData.wardId,
      gpsVerified: true,
      city: geocode.city || wardData.city,
      address: geocode.formattedShort,
      street: geocode.street,
      suburb: geocode.suburb,
      postcode: geocode.postcode,
    };

    console.log('%c[JalSetu GPS] Pipeline Complete! Final verified location object:', 'color: #10b981; font-weight: bold;', completeResult);
    console.groupEnd();

    return completeResult;
  },
};
