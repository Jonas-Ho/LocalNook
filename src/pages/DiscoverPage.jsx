import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Pencil, RefreshCw } from 'lucide-react';
import { searchPlaces } from '../api/places';
import { useLocation } from '../context/LocationContext';
import CategoryFilter from '../components/CategoryFilter';
import PlaceCard from '../components/PlaceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import LocationPicker from '../components/LocationPicker';
import LocationMap from '../components/LocationMap';

export default function DiscoverPage() {
  const {
    gpsPosition,
    gpsLoading,
    gpsError,
    searchLocation,
    setSearchLocation,
    clearSearchLocation,
    needsSetup,
    retryGps,
  } = useLocation();

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [showLocationEditor, setShowLocationEditor] = useState(false);

  const loadPlaces = async () => {
    if (!searchLocation) return;
    setLoading(true);
    try {
      const res = await searchPlaces({
        lat: searchLocation.lat,
        lng: searchLocation.lng,
        area: searchLocation.area || undefined,
        city: searchLocation.city,
        country: searchLocation.country,
      });
      setPlaces(res.places);
    } catch (err) {
      console.error('Failed to load gems:', err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchLocation && !needsSetup) loadPlaces();
  }, [searchLocation]);

  const filtered = useMemo(() => {
    if (category === 'all') return places;
    return places.filter((p) => p.category === category);
  }, [places, category]);

  if (gpsLoading && !searchLocation) {
    return <LoadingSpinner label="Finding your location..." />;
  }

  if (needsSetup || showLocationEditor || !searchLocation) {
    return (
      <div className="page discover-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Community picks only</p>
            <h1>Local Nook</h1>
          </div>
        </header>
        <LocationPicker
          gpsPosition={gpsPosition}
          gpsError={gpsError}
          onRetryGps={retryGps}
          initial={searchLocation}
          onApply={(loc) => {
            setSearchLocation(loc);
            setShowLocationEditor(false);
          }}
        />
      </div>
    );
  }

  const precisionLabel = searchLocation.area
    ? `Area: ${searchLocation.area}`
    : searchLocation.city
      ? `City: ${searchLocation.city}`
      : `Country: ${searchLocation.country}`;

  const locationName =
    searchLocation.label ||
    searchLocation.area ||
    searchLocation.city ||
    searchLocation.country ||
    'this location';

  return (
    <div className="page discover-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Community picks only</p>
          <h1>Local Nook</h1>
        </div>
        <button className="icon-btn" onClick={loadPlaces} aria-label="Refresh">
          <RefreshCw size={20} />
        </button>
      </header>

      <div className="location-bar">
        <span>
          <MapPin size={14} />
          {searchLocation.label || precisionLabel}
        </span>
        <button
          type="button"
          className="text-btn"
          onClick={() => setShowLocationEditor(true)}
        >
          <Pencil size={14} /> Change
        </button>
      </div>

      <LocationMap
        center={[searchLocation.lat, searchLocation.lng]}
        zoom={searchLocation.area ? 14 : searchLocation.city ? 11 : 8}
        userPosition={gpsPosition}
        pinPosition={searchLocation}
        gems={filtered}
        onMapClick={null}
        interactive={true}
        height={220}
      />

      <CategoryFilter active={category} onChange={setCategory} />

      {loading ? (
        <LoadingSpinner label="Loading nearby gems..." />
      ) : filtered.length === 0 && places.length === 0 ? (
        <div className="empty-state unknown-state">
          <MapPin size={40} />
          <h2>No gems near this location yet</h2>
          <p>
            There aren&apos;t any community recommendations around {locationName} at
            the moment. Know a great spot? Share it with others.
          </p>
          <Link to="/add" className="btn primary">
            Add a gem
          </Link>
          <button
            type="button"
            className="btn secondary"
            onClick={clearSearchLocation}
          >
            Search another area
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state unknown-state">
          <h2>No gems in this category</h2>
          <p>
            Nothing matches your filter around {locationName}. Try a different
            category or broaden your search area.
          </p>
        </div>
      ) : (
        <>
          <p className="results-count">
            {filtered.length} gem{filtered.length !== 1 ? 's' : ''} in{' '}
            {searchLocation.area || searchLocation.city || searchLocation.country}
          </p>
          <div className="place-list">
            {filtered.map((place) => (
              <PlaceCard key={place._id} place={place} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}