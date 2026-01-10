// src/App.jsx
// With read counter and page tracking enabled

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

// Your existing imports
import { queryClient } from './config/queryClient';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/routeConfig';

// Read counter imports
import { enableReadCounter, ReadStatsDisplay } from './utils/readCounter';
import { PageTracker } from './hooks/usePageTracker';

// Enable read counter in development
if (import.meta.env.DEV) {
  enableReadCounter();
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Track page changes for read counter */}
        <PageTracker />
        
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
        
        {/* Development: Show read stats overlay */}
        {import.meta.env.DEV && <ReadStatsDisplay />}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;