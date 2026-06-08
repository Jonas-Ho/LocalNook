import { Link } from 'react-router-dom';
import { Bookmark, MapPin, ThumbsUp } from 'lucide-react';
import { getCategoryMeta } from '../utils/categories';

export default function PlaceCard({ place }) {
  const cat = getCategoryMeta(place.category);

  return (
    <Link to={`/place/${place._id}`} className="place-card">
      <div className="place-card-image">
        <img src={place.photo?.url} alt={place.name} loading="lazy" />
        <span className="place-card-category">
          {cat.emoji} {cat.label}
        </span>
      </div>
      <div className="place-card-body">
        <h3>{place.name}</h3>
        <p className="place-card-note">{place.shortNote}</p>
        {(place.displayAddress || place.address?.formatted) && (
          <p className="place-card-address">
            <MapPin size={12} />
            {place.displayAddress || place.address?.formatted}
          </p>
        )}
        <div className="place-card-meta">
          <span>
            <ThumbsUp size={14} /> {place.upvoteCount}
          </span>
          <span>
            <MapPin size={14} /> Trust {place.trustScore}
          </span>
          {place.isSaved && (
            <span className="saved-badge">
              <Bookmark size={14} fill="currentColor" />
            </span>
          )}
        </div>
        {place.tags?.length > 0 && (
          <div className="tag-list">
            {place.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}