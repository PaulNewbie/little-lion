// src/pages/parent/components/DigestPhotoStrip.jsx
// Horizontal scrollable photo strip for Daily Digest

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import '../css/DigestComponents.css';

const MAX_VISIBLE_PHOTOS = 6;

/**
 * DigestPhotoStrip - Horizontal scrollable photo strip
 * @param {Array} photos - Array of photo objects with url, title
 */
const DigestPhotoStrip = ({ photos }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const visiblePhotos = photos.slice(0, MAX_VISIBLE_PHOTOS);
  const remainingCount = photos.length - MAX_VISIBLE_PHOTOS;
  const showMoreBadge = remainingCount > 0;

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const goToPrev = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrev(e);
    if (e.key === 'ArrowRight') goToNext(e);
  };

  // Add keyboard listener when lightbox is open
  React.useEffect(() => {
    if (lightboxIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxIndex]);

  return (
    <>
      <div className="digest-photo-strip">
        <div className="digest-photo-header">
          <Camera size={18} /> Photos ({photos.length})
        </div>

        <div className="digest-photo-scroll">
          {visiblePhotos.map((photo, index) => {
            const isLast = index === visiblePhotos.length - 1 && showMoreBadge;

            return (
              <div key={`${photo.activityId}-${photo.index}-${index}`} className="digest-photo-wrapper">
                <img
                  src={photo.url}
                  alt={photo.title || `Photo ${index + 1}`}
                  className="digest-photo"
                  onClick={() => openLightbox(index)}
                  loading="lazy"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') openLightbox(index); }}
                />
                {isLast && (
                  <>
                    <div
                      className="digest-photo-more-overlay"
                      onClick={() => openLightbox(index)}
                    />
                    <div className="digest-photo-more-badge">+{remainingCount} more</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="digest-lightbox" onClick={closeLightbox}>
          {/* Close Button */}
          <button
            className="digest-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            ×
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              className="digest-lightbox-nav digest-lightbox-prev"
              onClick={goToPrev}
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={photos[lightboxIndex].url}
            alt={photos[lightboxIndex].title || `Photo ${lightboxIndex + 1}`}
            className="digest-lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              className="digest-lightbox-nav digest-lightbox-next"
              onClick={goToNext}
              aria-label="Next"
            >
              ›
            </button>
          )}

          {/* Counter */}
          <div className="digest-lightbox-counter">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
};

export default DigestPhotoStrip;
