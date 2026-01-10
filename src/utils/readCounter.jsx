// src/utils/readCounter.jsx
// DEVELOPMENT UTILITY: Track Firestore reads to measure optimization impact
// Enable this in development to see how many reads each page uses

/**
 * USAGE:
 * 
 * 1. Import in your main App.jsx:
 *    import { enableReadCounter, ReadStatsDisplay } from './utils/readCounter';
 * 
 * 2. Enable in development:
 *    if (import.meta.env.DEV) {
 *      enableReadCounter();
 *    }
 * 
 * 3. View stats in console or via browser devtools:
 *    window.firestoreStats.getStats()
 *    window.firestoreStats.reset()
 */

import React, { useState, useEffect } from 'react';

let isEnabled = false;
let readCount = 0;
let readsByCollection = {};
let readsByPage = {};
let currentPage = 'unknown';

/**
 * Enable read counting (call once at app startup)
 * Note: This tracks reads via the trackRead() function called from services
 */
export function enableReadCounter() {
  if (isEnabled) return;
  
  isEnabled = true;
  
  // Expose stats globally for easy access in browser console
  window.firestoreStats = {
    getStats,
    getSummary,
    reset,
    setPage,
    getReadsByPage,
    incrementRead: manualIncrementRead,
  };
  
  console.log('📊 Firestore read counter enabled.');
  console.log('   - Use window.firestoreStats.getStats() to view stats');
  console.log('   - Use window.firestoreStats.reset() to reset counters');
}

/**
 * Disable read counting
 */
export function disableReadCounter() {
  if (!isEnabled) return;
  isEnabled = false;
  console.log('📊 Firestore read counter disabled');
}

/**
 * Track a read operation (call this from your services)
 * @param {string} collection - Collection name
 * @param {number} count - Number of documents read
 */
export function trackRead(collection, count = 1) {
  if (!isEnabled) return;
  
  readCount += count;
  readsByCollection[collection] = (readsByCollection[collection] || 0) + count;
  readsByPage[currentPage] = (readsByPage[currentPage] || 0) + count;
  
  console.debug(`📖 Firestore read: ${collection} (${count} docs) [Total: ${readCount}]`);
}

/**
 * Manual increment for console usage
 */
function manualIncrementRead(collection, count = 1) {
  trackRead(collection, count);
}

/**
 * Set current page (call on navigation)
 */
export function setPage(pageName) {
  currentPage = pageName;
}

/**
 * Get current stats
 */
export function getStats() {
  return {
    totalReads: readCount,
    byCollection: { ...readsByCollection },
    byPage: { ...readsByPage },
    currentPage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get reads by page
 */
export function getReadsByPage() {
  return { ...readsByPage };
}

/**
 * Reset all counters
 */
export function reset() {
  readCount = 0;
  readsByCollection = {};
  readsByPage = {};
  console.log('📊 Read counters reset');
}

/**
 * Get summary for display
 */
export function getSummary() {
  const stats = getStats();
  
  const summary = `
📊 Firestore Read Summary
========================
Total Reads: ${stats.totalReads}

By Collection:
${Object.entries(stats.byCollection)
  .sort((a, b) => b[1] - a[1])
  .map(([col, count]) => `  ${col}: ${count}`)
  .join('\n') || '  (none)'}

By Page:
${Object.entries(stats.byPage)
  .sort((a, b) => b[1] - a[1])
  .map(([page, count]) => `  ${page}: ${count}`)
  .join('\n') || '  (none)'}
`;
  
  console.log(summary);
  return summary;
}

/**
 * React hook for tracking reads on a page
 */
export function useReadTracker(pageName) {
  useEffect(() => {
    const previousPage = currentPage;
    setPage(pageName);
    
    return () => {
      const pageReads = readsByPage[pageName] || 0;
      if (pageReads > 0) {
        console.log(`📊 Page "${pageName}" used ${pageReads} reads`);
      }
      setPage(previousPage);
    };
  }, [pageName]);
  
  return {
    getPageReads: () => readsByPage[pageName] || 0,
    getTotalReads: () => readCount,
  };
}

/**
 * Development component to display read stats overlay
 */
export function ReadStatsDisplay() {
  const [stats, setStats] = useState(getStats());
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Only show in development and when enabled
  const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
  if (!isDev || !isEnabled) {
    return null;
  }

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          backgroundColor: stats.totalReads > 50 ? '#dc2626' : 'rgba(0,0,0,0.8)',
          color: '#22c55e',
          padding: '8px 12px',
          borderRadius: '20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          zIndex: 9999,
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        📊 {stats.totalReads} reads
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: '#22c55e',
        padding: '12px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 9999,
        minWidth: '220px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          borderBottom: '1px solid #333',
          paddingBottom: '8px',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>📊 Firestore Reads</span>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
          }}
        >
          −
        </button>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '4px' }}>
        Total: <strong>{stats.totalReads}</strong> {stats.totalReads > 50 ? '⚠️' : '✓'}
      </div>
      <div style={{ marginBottom: '4px', color: '#888' }}>
        Page: {stats.currentPage}
      </div>
      <div style={{ marginBottom: '8px' }}>
        This page: {stats.byPage[stats.currentPage] || 0}
      </div>

      {/* Collections breakdown */}
      <div
        style={{
          fontSize: '10px',
          color: '#888',
          maxHeight: '80px',
          overflow: 'auto',
          marginBottom: '8px',
        }}
      >
        <div style={{ marginBottom: '4px', color: '#666' }}>By Collection:</div>
        {Object.entries(stats.byCollection)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([col, count]) => (
            <div key={col} style={{ paddingLeft: '8px' }}>
              {col}: {count}
            </div>
          ))}
        {Object.keys(stats.byCollection).length === 0 && (
          <div style={{ paddingLeft: '8px', fontStyle: 'italic' }}>(none yet)</div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={reset}
          style={{
            padding: '4px 10px',
            fontSize: '10px',
            cursor: 'pointer',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
          }}
        >
          Reset
        </button>
        <button
          onClick={getSummary}
          style={{
            padding: '4px 10px',
            fontSize: '10px',
            cursor: 'pointer',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
          }}
        >
          Log Details
        </button>
      </div>
    </div>
  );
}

export default {
  enableReadCounter,
  disableReadCounter,
  trackRead,
  setPage,
  getStats,
  getSummary,
  reset,
  useReadTracker,
  ReadStatsDisplay,
};