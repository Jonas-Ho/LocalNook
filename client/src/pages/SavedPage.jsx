import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { getSavedPlaces } from '../api/places';
import { useAuth } from '../context/AuthContext';
import PlaceCard from '../components/PlaceCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SavedPage() {
  const { isAuthenticated } = useAuth();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    getSavedPlaces()
      .then((res) => setPlaces(res.places.map((p) => ({ ...p, isSaved: true }))))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="page saved-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your collection</p>
          <h1>Saved Gems</h1>
        </div>
      </header>

      {!isAuthenticated ? (
        <div className="empty-state">
          <Bookmark size={40} />
          <h2>Sign in to save gems</h2>
          <p>Browse freely — sign in when you want to bookmark places for later.</p>
          <Link to="/login" className="btn primary">
            Sign in
          </Link>
          <Link to="/" className="btn secondary">
            Keep browsing
          </Link>
        </div>
      ) : loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      ) : places.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={40} />
          <h2>No saved gems yet</h2>
          <p>Tap the bookmark on any place to save it here.</p>
          <Link to="/" className="btn primary">
            Discover gems
          </Link>
        </div>
      ) : (
        <div className="place-list">
          {places.map((place) => (
            <PlaceCard key={place._id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}