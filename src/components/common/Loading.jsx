import React from 'react';
import LoadingScreen from './LoadingScreen';

/**
 * Loading Component
 * Wrapper around LoadingScreen for backward compatibility
 * All props are passed through to LoadingScreen
 */
const Loading = (props) => {
  return <LoadingScreen {...props} />;
};

export default Loading;
