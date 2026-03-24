import { Link } from 'react-router-dom'
import { ArrowRight, Car, Users, Ship, MapPin } from 'lucide-react'

const SERVICES = [
  {
    icon: Car,
    title: 'Private Airport Transfer',
    desc: 'Direct door-to-door service in a private vehicle. Your driver tracks your flight and waits with a name board. Perfect for families, business travellers, and groups up to 11.',
    features: ['Door-to-door service', 'Flight tracking', 'Meet & greet', 'Child seats available', 'Free cancellation (24h)'],
    price: 'From $55',
    path: '/book-now',
  },
  {
    icon: Users,
    title: 'Shared Shuttle',
    desc: 'Share the ride from Auckland CBD to the airport. Daily scheduled departures with multiple pickup points. The most affordable way to get to the airport.',
    features: ['Daily departures', 'CBD pickup points', 'Airport drop-off', 'From $25 per person', 'Pay on arrival option'],
    price: 'From $25pp',
    path: '/shared-shuttle',
  },
  {
    icon: Ship,
    title: 'Cruise Ship Transfers',
    desc: 'Reliable transfers to and from Auckland cruise terminal at Princes Wharf. All cruise lines, all ship sizes.',
    features: ['Princes Wharf terminal', 'All cruise lines', 'Group discounts', 'Luggage handling', 'Flexible scheduling'],
    price: 'From $65',
    path: '/cruise-transfers',
  },
  {
    icon: MapPin,
    title: 'Hobbiton Day Trip',
    desc: 'Return transfers from Auckland to the world-famous Hobbiton Movie Set in Matamata. A magical day out for the whole family.',
    features: ['Return transfers', 'Auckland pickup', 'Matamata direct', 'Flexible times', 'Group rates'],
    price: 'From $180',
    path: '/hobbiton-transfers',
  },
]

export default function Services() {
  return (
    <div className="section-padding">
      <div className="container-max">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            From budget-friendly shared shuttles to premium private transfers across Auckland.
          </p>
        </div>

        <div className="space-y-8">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 hover:border-gold/40 hover:shadow-lg transition-all">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-gold" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{s.title}</h2>
                    <span className="ml-auto text-sm font-semibold text-gold bg-gold-50 px-3 py-1 rounded-full">
                      {s.price}
                    </span>
                  </div>
                  <p className="text-gray-500 mb-4">{s.desc}</p>
                  <ul className="grid sm:grid-cols-2 gap-2 mb-6">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to={s.path} className="btn-primary text-sm px-6 py-2.5">
                    Book Now <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
