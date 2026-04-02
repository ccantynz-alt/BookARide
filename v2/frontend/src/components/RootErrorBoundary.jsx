import { Component } from 'react'

export default class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('RootErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
          <div style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>Something went wrong</div>
            <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
              We're sorry for the inconvenience. Please try reloading the page.
              If the problem continues, contact us at info@bookaride.co.nz
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#D4AF37', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
