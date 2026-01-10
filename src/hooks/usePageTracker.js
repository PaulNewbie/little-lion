// src/hooks/usePageTracker.js
// Simple hook to track current page for read counter

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setPage } from '../utils/readCounter';

/**
 * Hook to automatically track the current page
 * Add this to your main layout or App component
 */
export function usePageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Extract page name from pathname
    const pathname = location.pathname;
    
    // Convert pathname to readable page name
    // e.g., "/admin/StudentProfile" -> "Admin StudentProfile"
    const pageName = pathname
      .split('/')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Home';
    
    setPage(pageName);
    
    console.debug(`📍 Page changed to: ${pageName}`);
  }, [location.pathname]);
}

/**
 * Component version if you prefer
 */
export function PageTracker() {
  usePageTracker();
  return null;
}

export default usePageTracker;