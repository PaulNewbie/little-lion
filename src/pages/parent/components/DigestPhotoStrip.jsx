// src/pages/parent/components/DigestPhotoStrip.jsx
// Horizontal scrollable photo strip for Daily Digest

import React, { useState } from 'react';

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '16px 20px',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  scrollContainer: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '8px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
  },
  photoWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  photo: {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    border: '2px solid #e2e8f0',
  },
  photoHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderColor: '#0052A1',
  },
  moreBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    pointerEvents: 'none',
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  // Lightbox styles
  lightbox: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  lightboxClose: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  lightboxNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxPrev: {
    left: '20px',
  },
  lightboxNext: {
    right: '20px',
  },
  lightboxCounter: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'white',
    fontSize: '14px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: '6px 12px',
    borderRadius: '20px',
  },
};

const MAX_VISIBLE_PHOTOS = 6;

/**
 * DigestPhotoStrip - Horizontal scrollable photo strip
 * @param {Array} photos - Array of photo objects with url, title
 */
const DigestPhotoStrip = ({ photos }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
      <div style={styles.container}>
        <div style={styles.header}>
          <span>📸</span> Photos ({photos.length})
        </div>

        <div style={styles.scrollContainer}>
          {visiblePhotos.map((photo, index) => {
            const isLast = index === visiblePhotos.length - 1 && showMoreBadge;

            return (
              <div key={`${photo.activityId}-${photo.index}-${index}`} style={styles.photoWrapper}>
                <img
                  src={photo.url}
                  alt={photo.title || `Photo ${index + 1}`}
                  style={{
                    ...styles.photo,
                    ...(hoveredIndex === index ? styles.photoHover : {}),
                  }}
                  onClick={() => openLightbox(index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  loading="lazy"
                />
                {isLast && (
                  <>
                    <div
                      style={styles.moreOverlay}
                      onClick={() => openLightbox(index)}
                    />
                    <div style={styles.moreBadge}>+{remainingCount} more</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div style={styles.lightbox} onClick={closeLightbox}>
          {/* Close Button */}
          <button
            style={styles.lightboxClose}
            onClick={closeLightbox}
            aria-label="Close"
          >
            ×
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              style={{ ...styles.lightboxNav, ...styles.lightboxPrev }}
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
            style={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              style={{ ...styles.lightboxNav, ...styles.lightboxNext }}
              onClick={goToNext}
              aria-label="Next"
            >
              ›
            </button>
          )}

          {/* Counter */}
          <div style={styles.lightboxCounter}>
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
};

export default DigestPhotoStrip;
