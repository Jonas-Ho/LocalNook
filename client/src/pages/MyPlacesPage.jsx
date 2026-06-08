import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { getMyPlaces } from '../api/places';
import { useAuth } from '../context/AuthContext';
import PlaceCard from '../components/PlaceCard';
import LoadingSpinner from '../components/LoadingSpinner';

const statusLabel = {
  pending: { text: 'Pending review', className: 'status-pending' },
  approved: { text: 'Approved', className: 'status-approved' },
  rejected: { text: 'Rejected', className: 'status-rejected' },
};

export default function MyPlacesPage() {
  const { isAuthenticated } = useAuth();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    getMyPlaces()
      .then((res) => setPlaces(res.places))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="page my-places-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your contributions</p>
          <h1>My Gems</h1>
        </div>
        <Link to="/add" className="icon-btn" aria-label="Add gem">
          <PlusCircle size={22} />
        </Link>
      </header>

      {!isAuthenticated ? (
        <div className="empty-state">
          <h2>Sign in to see your submissions</h2>
          <p>Browse gems without an account — sign in when you&apos;re ready to add your own.</p>
          <Link to="/login" className="btn primary">
            Sign in
          </Link>
          <Link to="/add" className="btn secondary">
            Preview add form
          </Link>
        </div>
      ) : loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="empty-state"><p>{error}</p></div>
      ) : places.length === 0 ? (
        <div className="empty-state">
          <h2>No submissions yet</h2>
          <p>Share your first local gem with the community.</p>
          <Link to="/add" className="btn primary">Add a gem</Link>
        </div>
      ) : (
        <div className="place-list">
          {places.map((place) => {
            const status = statusLabel[place.moderationStatus];
            return (
              <div key={place._id} className="my-place-wrap">
                <span className={`moderation-badge ${status.className}`}>
                  {status.text}
                </span>
                <PlaceCard place={place} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}