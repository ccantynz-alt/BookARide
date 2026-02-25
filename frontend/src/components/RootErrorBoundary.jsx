import React from 'react';

/**
 * Catches any uncaught error in the app and shows the message + stack
 * instead of a white screen. Wrap the whole app (e.g. in App.js).
 */
class RootErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('App error:', error, errorInfo);
  }

  handleReload = () => window.location.reload();
  handleHome = () => {
    this.setState({ error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message ?? String(this.state.error);
      const stack = this.state.errorInfo?.componentStack ?? '';

      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p
              style={{
                color: '#f87171',
                marginBottom: '1rem',
                wordBreak: 'break-word',
                fontSize: '0.95rem',
              }}
            >
              {msg}
            </p>
            {stack && (
              <pre
                style={{
                  fontSize: '0.7rem',
                  background: '#1e293b',
                  padding: '1rem',
                  overflow: 'auto',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '40vh',
                }}
              >
                {stack}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#334155',
                  color: '#e2e8f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Go to home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default RootErrorBoundary;
