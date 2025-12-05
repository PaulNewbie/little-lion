import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <div style={{
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '16px',
      border: '1px solid #f5c6cb'
    }}>
      {message}
    </div>
  );
};

export default ErrorMessage;
