import React from 'react';

/**
 * Catches runtime errors in the admin dashboard so we see the real error
 * instead of a white screen (e.g. "Cannot access 'mr' before initialization").
 */
class AdminErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Admin dashboard error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error);
      const stack = this.state.errorInfo?.componentStack || '';

      return (
        <div style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#e2e8f0',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Admin dashboard error
            </h1>
            <p style={{ color: '#f87171', marginBottom: '1rem', wordBreak: 'break-word' }}>
              {msg}
            </p>
            {stack && (
              <pre style={{
                fontSize: '0.75rem',
                background: '#1e293b',
                padding: '1rem',
                overflow: 'auto',
                borderRadius: '6px',
                marginBottom: '1rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {stack}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Try again
              </button>
              <a
                href="/admin/login"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#334155',
                  color: '#e2e8f0',
                  borderRadius: '6px',
                  textDecoration: 'none'
                }}
              >
                Back to login
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
