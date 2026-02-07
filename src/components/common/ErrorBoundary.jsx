import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif",
          background: '#f8f9fa'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px'
          }}>
            🦁
          </div>
          <h1 style={{
            color: '#003d7a',
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 12px'
          }}>
            Oops! Something went wrong
          </h1>
          <p style={{
            color: '#666',
            fontSize: '1rem',
            maxWidth: '400px',
            lineHeight: 1.5,
            margin: '0 0 24px'
          }}>
            Don't worry, your data is safe. Please try again.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 32px',
              backgroundColor: '#003d7a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
