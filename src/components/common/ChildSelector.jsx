// src/components/common/ChildSelector.jsx
// Visual card-based child selector for parent views

import React from 'react';

const styles = {
  container: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '10px',
  },
  grid: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '100px',
  },
  cardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#0052A1',
    boxShadow: '0 4px 12px rgba(0, 82, 161, 0.15)',
  },
  checkmark: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    backgroundColor: '#0052A1',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    border: '3px solid #e2e8f0',
    overflow: 'hidden',
    transition: 'border-color 0.2s ease',
  },
  avatarSelected: {
    borderColor: '#0052A1',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#64748b',
  },
  name: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  loadingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '2px dashed #e2e8f0',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#0052A1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '2px dashed #e2e8f0',
  },
};

// Keyframe animation for spinner
const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

/**
 * ChildSelector - Visual card-based selector for parent views
 * @param {Array} children - List of children
 * @param {string} selectedChild - Selected child ID
 * @param {function} onSelect - Selection callback
 * @param {boolean} isLoading - Loading state
 * @param {string} label - Optional label text (default: "Select Child")
 */
const ChildSelector = ({
  children,
  selectedChild,
  onSelect,
  isLoading,
  label = "Select Child"
}) => {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <style>{spinnerKeyframes}</style>
        <div style={styles.loadingCard}>
          <div style={styles.loadingSpinner}></div>
          <span style={{ color: '#64748b', fontSize: '14px' }}>Loading children...</span>
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyCard}>
          <span style={{ fontSize: '24px', marginBottom: '8px' }}>👶</span>
          <span style={{ color: '#64748b', fontSize: '14px' }}>No children found</span>
        </div>
      </div>
    );
  }

  // If only one child, auto-select silently (no selector UI needed)
  if (children.length === 1 && !selectedChild) {
    // Trigger selection on mount
    setTimeout(() => onSelect(children[0].id), 0);
  }

  // Hide selector if only one child
  if (children.length === 1) {
    return null;
  }

  return (
    <div style={styles.container}>
      <style>{spinnerKeyframes}</style>
      <label style={styles.label}>{label}</label>
      <div style={styles.grid}>
        {children.map((child) => {
          const isSelected = selectedChild === child.id;
          return (
            <div
              key={child.id}
              onClick={() => onSelect(child.id)}
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
              }}
            >
              {/* Checkmark for selected */}
              {isSelected && (
                <div style={styles.checkmark}>✓</div>
              )}

              {/* Avatar */}
              <div style={{
                ...styles.avatar,
                ...(isSelected ? styles.avatarSelected : {}),
              }}>
                {child.photoUrl ? (
                  <img
                    src={child.photoUrl}
                    alt={child.firstName}
                    style={styles.avatarImg}
                  />
                ) : (
                  <span style={styles.avatarPlaceholder}>
                    {child.firstName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Name */}
              <div style={styles.name}>
                {child.firstName} {child.lastName?.charAt(0)}.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChildSelector;
