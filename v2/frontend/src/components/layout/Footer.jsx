import { Link } from 'react-router-dom'
import { Plane, Phone, Mail, MapPin } from 'lucide-react'

const FOOTER_LINKS = {
  Services: [
    { label: 'Airport Transfers', path: '/services' },
    { label: 'Shared Shuttle', path: '/shared-shuttle' },
    { label: 'Cruise Transfers', path: '/cruise-transfers' },
    { label: 'Hobbiton Transfers', path: '/hobbiton-transfers' },
  ],
  Company: [
    { label: 'About Us', path: '/about' },
    { label: 'Drive With Us', path: '/drive-with-us' },
    { label: 'Travel Agents', path: '/travel-agents' },
    { label: 'Contact', path: '/contact' },
  ],
  Legal: [
    { label: 'Terms & Conditions', path: '/terms-and-conditions' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Website Usage', path: '/website-usage-policy' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="container-max section-padding pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Plane className="w-7 h-7 text-gold" />
              <span className="text-xl font-bold text-white">
                Book<span className="text-gold">A</span>Ride
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Auckland&apos;s trusted airport transfer service. Door-to-door
              private and shared shuttle rides at the best prices.
            </p>
            <div className="space-y-3 text-sm">
              <a href="tel:+6421880793" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Phone className="w-4 h-4 text-gold" /> 021 880 793
              </a>
              <a href="mailto:info@bookaride.co.nz" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Mail className="w-4 h-4 text-gold" /> info@bookaride.co.nz
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" /> Auckland, New Zealand
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-400 hover:text-gold transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} BookARide. All rights reserved.</p>
          <p>Auckland Airport Transfer Specialists</p>
        </div>
      </div>
    </footer>
  )
}
