import React from 'react';

/**
 * Catches any uncaught error in the app and shows a friendly message
 * instead of a white screen. Wrap the whole app (e.g. in App.js).
 *
 * Note: ErrorBoundary must be a class component — React requires it.
 * Stack traces are logged to console only, never shown to customers.
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
      return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans flex items-center justify-center">
          <div className="max-w-lg text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-3">
              Something went wrong
            </h1>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              We're sorry — the page ran into an unexpected problem.
              Please try reloading, or head back to the home page.
              If this keeps happening, contact us at{' '}
              <a href="mailto:info@bookaride.co.nz" className="text-amber-400 hover:underline">
                info@bookaride.co.nz
              </a>
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors font-medium"
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer transition-colors font-medium"
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
