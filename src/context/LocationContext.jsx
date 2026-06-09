import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { reverseGeocode } from '../api/geo';

const STORAGE_KEY = 'localnook_search_location';

const readStored = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState(null);
  const [searchLocation, setSearchLocationState] = useState(readStored);
  const [needsSetup, setNeedsSetup] = useState(() => !readStored());

  const setSearchLocation = useCallback((loc) => {
    setSearchLocationState(loc);
    if (loc) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      setNeedsSetup(false);
    }
  }, []);

  const clearSearchLocation = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSearchLocationState(null);
    setNeedsSetup(true);
  }, []);

  const requestGps = useCallback(() => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsLoading(false);
      setGpsError('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const gps = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGpsPosition(gps);
        setGpsLoading(false);

        if (!readStored()) {
          try {
            const res = await reverseGeocode(gps.lat, gps.lng);
            setSearchLocation({
              ...res.location,
              source: 'gps',
              label: res.location.formatted,
            });
          } catch {
            setNeedsSetup(true);
          }
        }
      },
      () => {
        setGpsLoading(false);
        setGpsError('Could not detect your location. Search by area or tap the map.');
        if (!readStored()) setNeedsSetup(true);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [setSearchLocation]);

  useEffect(() => {
    requestGps();
  }, [requestGps]);

  return (
    <LocationContext.Provider
      value={{
        gpsPosition,
        gpsLoading,
        gpsError,
        searchLocation,
        setSearchLocation,
        clearSearchLocation,
        needsSetup,
        retryGps: requestGps,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};