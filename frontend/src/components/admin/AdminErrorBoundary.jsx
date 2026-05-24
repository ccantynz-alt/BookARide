import React from 'react';

/**
 * Catches runtime errors in the admin dashboard so we show a recovery UI
 * instead of a white screen.
 *
 * Note: ErrorBoundary must be a class component — React requires it.
 * Stack traces are logged to console only, never shown in the UI.
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
      return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans flex items-center justify-center">
          <div className="max-w-lg text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold mb-3">
              Dashboard error
            </h1>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              The admin dashboard ran into a problem. Try again, or go back
              to the login page to start fresh.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors font-medium"
              >
                Try again
              </button>
              <a
                href="/admin/login"
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg no-underline transition-colors font-medium inline-block"
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
