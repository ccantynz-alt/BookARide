import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, Plane } from 'lucide-react'
import { cn } from '../../lib/cn'

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'Shuttle', path: '/shared-shuttle' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Plane className="w-8 h-8 text-gold" />
            <span className="text-xl sm:text-2xl font-bold">
              Book<span className="text-gold">A</span>Ride
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.path
                    ? 'text-gold bg-gold-50'
                    : 'text-gray-600 hover:text-gold hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="tel:+6421880793"
              className="hidden sm:flex items-center gap-2 text-sm text-gray-600 hover:text-gold transition-colors"
            >
              <Phone className="w-4 h-4" />
              021 880 793
            </a>
            <Link to="/book-now" className="btn-primary text-sm py-2 px-4">
              Book Now
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gold"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-slide-down">
          <nav className="container-max px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg text-base font-medium transition-colors',
                  location.pathname === link.path
                    ? 'text-gold bg-gold-50'
                    : 'text-gray-600 hover:text-gold hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="tel:+6421880793"
              className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gold"
            >
              <Phone className="w-4 h-4" />
              021 880 793
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
