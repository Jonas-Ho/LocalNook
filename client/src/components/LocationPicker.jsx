import { useEffect, useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { searchLocations, reverseGeocode } from '../api/geo';
import { normalizeLocationFields } from '../utils/normalizeLocation';
import LocationMap from './LocationMap';

export default function LocationPicker({
  gpsPosition,
  gpsError,
  onRetryGps,
  onApply,
  initial = null,
  compact = false,
}) {
  const [fields, setFields] = useState({
    area: initial?.area || '',
    city: initial?.city || '',
    country: initial?.country || '',
  });
  const [pin, setPin] = useState(
    initial?.lat != null ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, value) => setFields((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (initial) {
      setFields({
        area: initial.area || '',
        city: initial.city || '',
        country: initial.country || '',
      });
      if (initial.lat != null) {
        setPin({ lat: initial.lat, lng: initial.lng });
      }
    }
  }, [initial]);

  const runSearch = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchLocations(query);
      setSuggestions(res.results);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const applySuggestion = (loc) => {
    setFields({
      area: loc.area || '',
      city: loc.city || '',
      country: loc.country || '',
    });
    setPin({ lat: loc.lat, lng: loc.lng });
    setSuggestions([]);
    setError(null);
  };

  const handleMapClick = async (lat, lng) => {
    setPin({ lat, lng });
    setLoadingPin(true);
    try {
      const res = await reverseGeocode(lat, lng);
      setFields({
        area: res.location.area || fields.area,
        city: res.location.city || fields.city,
        country: res.location.country || fields.country,
      });
    } catch {
      setError('Pin set — please fill in city and country below.');
    } finally {
      setLoadingPin(false);
    }
  };

  const useGps = async () => {
    if (!gpsPosition) {
      onRetryGps?.();
      return;
    }
    setPin({ lat: gpsPosition.lat, lng: gpsPosition.lng });
    setLoadingPin(true);
    try {
      const res = await reverseGeocode(gpsPosition.lat, gpsPosition.lng);
      applySuggestion(res.location);
    } finally {
      setLoadingPin(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!fields.city.trim() || !fields.country.trim()) {
      setError('City and country are required.');
      return;
    }

    if (!pin) {
      setError('Tap the map to set your search area, or pick a suggestion.');
      return;
    }

    const normalized = normalizeLocationFields(fields);

    onApply({
      lat: pin.lat,
      lng: pin.lng,
      ...normalized,
      label: [normalized.area, normalized.city, normalized.country]
        .filter(Boolean)
        .join(', '),
      source: 'search',
    });
  };

  const searchQuery = [fields.area, fields.city, fields.country].filter(Boolean).join(', ');
  const mapCenter = pin
    ? [pin.lat, pin.lng]
    : gpsPosition
      ? [gpsPosition.lat, gpsPosition.lng]
      : [22.3193, 114.1694];

  const mapZoom = fields.area ? 14 : fields.city ? 11 : fields.country ? 8 : 13;

  return (
    <div className={`location-picker ${compact ? 'compact' : ''}`}>
      {!compact && (
        <>
          <MapPin size={36} className="location-picker-icon" />
          <h2>Where are you exploring?</h2>
          <p className="location-picker-sub">
            Search broadly (e.g. city Hong Kong, country China) or get precise
            (e.g. Tsim Sha Tsui, Hong Kong, China).
            Tap the map to fine-tune.
          </p>
        </>
      )}

      {(gpsError || error) && (
        <div className="banner info">{error || gpsError}</div>
      )}

      <LocationMap
        center={mapCenter}
        zoom={mapZoom}
        userPosition={gpsPosition}
        pinPosition={pin}
        onMapClick={handleMapClick}
        height={compact ? 220 : 300}
      />

      <p className="map-hint">
        {loadingPin ? 'Reading map location...' : 'Tap anywhere on the map to set your area'}
      </p>

      <form onSubmit={handleSubmit} className="location-form">
        <div className="field search-field">
          <label htmlFor="loc-search">
            <Search size={14} /> Quick search
          </label>
          <input
            id="loc-search"
            placeholder="e.g. Tsim Sha Tsui, Hong Kong, China"
            defaultValue={searchQuery}
            onChange={(e) => runSearch(e.target.value)}
          />
          {searching && <span className="search-status">Searching...</span>}
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((s, i) => (
                <li key={`${s.lat}-${i}`}>
                  <button type="button" onClick={() => applySuggestion(s)}>
                    {s.formatted}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="field">
          <label htmlFor="area">Area / neighbourhood (optional)</label>
          <input
            id="area"
            value={fields.area}
            onChange={(e) => update('area', e.target.value)}
            placeholder="e.g. Tsim Sha Tsui"
          />
        </div>

        <div className="field">
          <label htmlFor="city">City *</label>
          <input
            id="city"
            value={fields.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="e.g. Hong Kong"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="country">Country *</label>
          <input
            id="country"
            value={fields.country}
            onChange={(e) => update('country', e.target.value)}
            placeholder="e.g. China"
            required
          />
        </div>

        <button type="button" className="btn secondary full" onClick={useGps}>
          <Navigation size={16} /> Use my GPS location
        </button>

        <button type="submit" className="btn primary full">
          Explore this area
        </button>
      </form>
    </div>
  );
}