import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="section-padding text-center">
      <div className="container-max max-w-lg">
        <h1 className="text-6xl font-extrabold text-gold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">
          This page doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
        <Link to="/" className="btn-primary">
          <Home className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
