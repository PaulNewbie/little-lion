// src/components/common/ImageLightbox.jsx
// Reusable image lightbox/popup with navigation

import React, { useState, useEffect, useCallback } from 'react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    color: 'white',
    fontSize: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  image: {
    maxWidth: '92%',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: '8px',
    userSelect: 'none',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    color: 'white',
    fontSize: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  prevBtn: {
    left: '12px',
  },
  nextBtn: {
    right: '12px',
  },
  counter: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'white',
    fontSize: '14px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: '6px 16px',
    borderRadius: '20px',
    fontWeight: '500',
  },
};

/**
 * ImageLightbox - Reusable image popup with prev/next navigation
 * @param {Array<string>} images - Array of image URLs
 * @param {number} currentIndex - Currently displayed image index
 * @param {Function} onClose - Called when lightbox should close
 */
const ImageLightbox = ({ images, currentIndex, onClose }) => {
  const [index, setIndex] = useState(currentIndex);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const goToPrev = useCallback((e) => {
    e.stopPropagation();
    setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback((e) => {
    e.stopPropagation();
    setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleClose = useCallback((e) => {
    if (e) e.stopPropagation();
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') goToPrev(e);
      if (e.key === 'ArrowRight') goToNext(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, goToPrev, goToNext]);

  if (!images || images.length === 0) return null;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      {/* Close Button */}
      <button style={styles.closeBtn} onClick={handleClose} aria-label="Close">
        ×
      </button>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          style={{ ...styles.navBtn, ...styles.prevBtn }}
          onClick={goToPrev}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt={`Photo ${index + 1}`}
        style={styles.image}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next Button */}
      {images.length > 1 && (
        <button
          style={{ ...styles.navBtn, ...styles.nextBtn }}
          onClick={goToNext}
          aria-label="Next"
        >
          ›
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div style={styles.counter}>
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
