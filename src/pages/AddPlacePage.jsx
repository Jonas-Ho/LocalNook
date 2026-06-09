import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { addPlace } from '../api/places';
import { reverseGeocode } from '../api/geo';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { normalizeLocationFields } from '../utils/normalizeLocation';
import { CATEGORIES } from '../utils/categories';
import LocationMap from '../components/LocationMap';

const inputCategories = CATEGORIES.filter((c) => c.id !== 'all');

export default function AddPlacePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const { gpsPosition, searchLocation } = useLocation();
  const [form, setForm] = useState({
    name: '',
    category: 'cafe',
    line1: '',
    line2: '',
    building: '',
    floor: '',
    area: searchLocation?.area || '',
    city: searchLocation?.city || '',
    country: searchLocation?.country || '',
    shortNote: '',
    tags: '',
    lat: searchLocation?.lat?.toString() || '',
    lng: searchLocation?.lng?.toString() || '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const pin =
    form.lat && form.lng
      ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng) }
      : null;

  const handleMapClick = async (lat, lng) => {
    update('lat', lat.toFixed(6));
    update('lng', lng.toFixed(6));
    setPinLoading(true);
    try {
      const res = await reverseGeocode(lat, lng);
      const loc = res.location;
      if (loc.area) update('area', loc.area);
      if (loc.city) update('city', loc.city);
      if (loc.country) update('country', loc.country);
    } catch {
      // Pin is set; user can fill address manually
    } finally {
      setPinLoading(false);
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!requireAuth('/add')) return;

    if (!photo) {
      setError('Please add a photo');
      return;
    }

    if (!form.lat || !form.lng) {
      setError('Drop a pin on the map for the exact spot');
      return;
    }

    if (!form.city.trim() || !form.country.trim()) {
      setError('City and country are required');
      return;
    }

    const normalized = normalizeLocationFields(form);

    const fd = new FormData();
    fd.append('photo', photo);
    fd.append('name', form.name);
    fd.append('category', form.category);
    fd.append('lat', form.lat);
    fd.append('lng', form.lng);
    fd.append('line1', form.line1);
    fd.append('line2', form.line2);
    fd.append('building', form.building);
    fd.append('floor', form.floor);
    fd.append('area', normalized.area);
    fd.append('city', normalized.city);
    fd.append('country', normalized.country);
    fd.append('shortNote', form.shortNote);
    if (form.tags) fd.append('tags', form.tags);

    setLoading(true);
    try {
      const res = await addPlace(fd);
      navigate(`/place/${res.place._id}`, {
        state: { message: 'Your gem was submitted for moderation!' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = pin
    ? [pin.lat, pin.lng]
    : gpsPosition
      ? [gpsPosition.lat, gpsPosition.lng]
      : searchLocation
        ? [searchLocation.lat, searchLocation.lng]
        : [22.3193, 114.1694];

  return (
    <div className="page add-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Share a hidden spot</p>
          <h1>Add a Gem</h1>
        </div>
      </header>

      <p className="page-subtitle">
        Pin the exact spot on the map — great for cafés inside malls or on upper floors.
      </p>

      <form className="add-form" onSubmit={handleSubmit}>
        <label className="photo-upload">
          <input type="file" accept="image/*" onChange={handlePhoto} hidden />
          {preview ? (
            <img src={preview} alt="Preview" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">
              <Camera size={32} />
              <span>Add a photo</span>
            </div>
          )}
        </label>

        <div className="field">
          <label>Exact location *</label>
          <LocationMap
            center={mapCenter}
            zoom={16}
            userPosition={gpsPosition}
            pinPosition={pin}
            onMapClick={handleMapClick}
            height={260}
          />
          <p className="map-hint">
            {pinLoading
              ? 'Reading address from map...'
              : pin
                ? 'Pin dropped — drag the map and tap to adjust'
                : 'Tap the map to drop a pin at the exact spot'}
          </p>
        </div>

        <div className="field">
          <label htmlFor="name">Place name</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Hidden café on 3F of K11 Mall"
            required
            maxLength={120}
          />
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          >
            {inputCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="address-section">
          <h3>Address details</h3>
          <p className="section-hint">
            Help others find it inside buildings, malls, or specific floors.
          </p>

          <div className="field">
            <label htmlFor="line1">Street / unit</label>
            <input
              id="line1"
              value={form.line1}
              onChange={(e) => update('line1', e.target.value)}
              placeholder="e.g. 18 Hanoi Road"
            />
          </div>

          <div className="field">
            <label htmlFor="building">Building / mall</label>
            <input
              id="building"
              value={form.building}
              onChange={(e) => update('building', e.target.value)}
              placeholder="e.g. K11 Musea"
            />
          </div>

          <div className="field">
            <label htmlFor="floor">Floor / level</label>
            <input
              id="floor"
              value={form.floor}
              onChange={(e) => update('floor', e.target.value)}
              placeholder="e.g. 3F, Level 2, Rooftop"
            />
          </div>

          <div className="field">
            <label htmlFor="area">Area / neighbourhood</label>
            <input
              id="area"
              value={form.area}
              onChange={(e) => update('area', e.target.value)}
              placeholder="e.g. Tsim Sha Tsui"
            />
          </div>

          <div className="coords-row">
            <div className="field">
              <label htmlFor="city">City *</label>
              <input
                id="city"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="country">Country *</label>
              <input
                id="country"
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="shortNote">Why is it special?</label>
          <textarea
            id="shortNote"
            value={form.shortNote}
            onChange={(e) => update('shortNote', e.target.value)}
            placeholder="Quiet corner table, great natural light..."
            required
            maxLength={280}
            rows={3}
          />
          <span className="char-count">{form.shortNote.length}/280</span>
        </div>

        <div className="field">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            id="tags"
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            placeholder="wifi, quiet, mall"
          />
        </div>

        {error && <div className="banner error">{error}</div>}

        {!isAuthenticated && (
          <p className="form-hint">You can fill out the form now — sign in when you submit.</p>
        )}

        <button type="submit" className="btn primary full" disabled={loading}>
          {loading ? 'Submitting...' : isAuthenticated ? 'Submit for review' : 'Sign in to submit'}
        </button>

        <p className="form-hint">New gems are reviewed before appearing on the map.</p>
      </form>
    </div>
  );
}