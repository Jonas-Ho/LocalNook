import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle,
  MapPin,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import {
  getPlace,
  savePlace,
  unsavePlace,
  visitPlace,
  votePlace,
} from '../api/places';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { getCategoryMeta } from '../utils/categories';
import LoadingSpinner from '../components/LoadingSpinner';
import LocationMap from '../components/LocationMap';

export default function PlaceDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();

  const enrichPlace = (raw) => {
    if (!user) {
      return { ...raw, hasUpvoted: false, hasVisited: false, isSaved: false };
    }
    const uid = user.id;
    const matchId = (id) =>
      (typeof id === 'string' ? id : id?._id || id?.toString()) === uid;
    return {
      ...raw,
      hasUpvoted: raw.hasUpvoted ?? raw.upvotedBy?.some(matchId) ?? false,
      hasVisited: raw.hasVisited ?? raw.visitedBy?.some(matchId) ?? false,
      isSaved:
        raw.isSaved ??
        user.savedPlaces?.some((id) => matchId(id)) ??
        false,
    };
  };
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPlace(id);
      setPlace(enrichPlace(res.place));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, user?.id]);

  const handleVote = async () => {
    if (!requireAuth(`/place/${id}`) || place.hasUpvoted) return;
    setActionLoading('vote');
    try {
      const res = await votePlace(place._id);
      setPlace((p) => ({
        ...p,
        hasUpvoted: true,
        upvoteCount: res.place.upvoteCount,
        trustScore: res.place.trustScore,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVisit = async () => {
    if (!requireAuth(`/place/${id}`) || place.hasVisited) return;
    setActionLoading('visit');
    try {
      const res = await visitPlace(place._id);
      setPlace((p) => ({
        ...p,
        hasVisited: true,
        visitedCount: res.place.visitedCount,
        trustScore: res.place.trustScore,
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSave = async () => {
    if (!requireAuth(`/place/${id}`)) return;
    setActionLoading('save');
    try {
      if (place.isSaved) {
        await unsavePlace(place._id);
        setPlace((p) => ({ ...p, isSaved: false }));
      } else {
        await savePlace(place._id);
        setPlace((p) => ({ ...p, isSaved: true }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = async () => {
    if (!requireAuth(`/place/${id}`)) return;

    const url = window.location.href;
    const payload = {
      title: place?.name || 'Local Nook gem',
      text: place?.shortNote || 'Check out this local gem',
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert('Could not share this gem');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !place) {
    return (
      <div className="page empty-state">
        <p>{error || 'Place not found'}</p>
        <Link to="/" className="btn primary">
          Back to discover
        </Link>
      </div>
    );
  }

  const cat = getCategoryMeta(place.category);

  return (
    <div className="page detail-page">
      <div className="detail-hero">
        <img src={place.photo?.url} alt={place.name} />
        <Link to="/" className="back-btn" aria-label="Go back">
          <ArrowLeft size={22} />
        </Link>
        <span className="detail-category">
          {cat.emoji} {cat.label}
        </span>
      </div>

      <div className="detail-body">
        <h1>{place.name}</h1>
        <p className="detail-note">{place.shortNote}</p>

        <div className="trust-bar">
          <div>
            <strong>Trust score</strong>
            <span>{place.trustScore}</span>
          </div>
          <div>
            <strong>Upvotes</strong>
            <span>{place.upvoteCount}</span>
          </div>
          <div>
            <strong>Visited</strong>
            <span>{place.visitedCount}</span>
          </div>
        </div>

        {place.tags?.length > 0 && (
          <div className="tag-list">
            {place.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {place.creator && (
          <p className="creator-line">
            Recommended by <strong>{place.creator.name}</strong>
          </p>
        )}

        <div className="address-block">
          <h3>
            <MapPin size={16} /> Location
          </h3>
          <p className="address-formatted">
            {place.displayAddress || place.address?.formatted || 'Address not provided'}
          </p>
          {place.address?.building && (
            <p className="address-detail">
              <strong>Building:</strong> {place.address.building}
            </p>
          )}
          {place.address?.floor && (
            <p className="address-detail">
              <strong>Floor:</strong> {place.address.floor}
            </p>
          )}
          {(place.address?.area || place.address?.city || place.address?.country) && (
            <p className="address-detail">
              {[place.address.area, place.address.city, place.address.country]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <LocationMap
            center={[place.lat, place.lng]}
            zoom={16}
            pinPosition={{ lat: place.lat, lng: place.lng }}
            interactive={false}
            height={180}
          />
        </div>

        {!isAuthenticated && (
          <p className="guest-hint">Browsing as guest — sign in to upvote, save, or share.</p>
        )}

        <div className="action-row action-row-4">
          <button
            className={`action-btn ${place.hasUpvoted ? 'done' : ''}`}
            onClick={handleVote}
            disabled={actionLoading === 'vote' || place.hasUpvoted}
          >
            <ThumbsUp size={18} />
            {place.hasUpvoted ? 'Upvoted' : 'Upvote'}
          </button>
          <button
            className={`action-btn ${place.isSaved ? 'done' : ''}`}
            onClick={handleSave}
            disabled={actionLoading === 'save'}
          >
            <Bookmark size={18} fill={place.isSaved ? 'currentColor' : 'none'} />
            {place.isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            className="action-btn"
            onClick={handleShare}
            disabled={actionLoading === 'share'}
          >
            <Share2 size={18} />
            Share
          </button>
          <button
            className={`action-btn ${place.hasVisited ? 'done' : ''}`}
            onClick={handleVisit}
            disabled={actionLoading === 'visit' || place.hasVisited}
          >
            <CheckCircle size={18} />
            {place.hasVisited ? 'Visited' : 'Visited'}
          </button>
        </div>
      </div>
    </div>
  );
}