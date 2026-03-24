import { Shield, Award, Clock, Heart } from 'lucide-react'

export default function About() {
  return (
    <div className="section-padding">
      <div className="container-max max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">About BookARide</h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          BookARide is Auckland&apos;s dedicated airport transfer service. We provide reliable,
          comfortable door-to-door transport between Auckland Airport and anywhere in the
          greater Auckland region. Whether you&apos;re heading to a flight, arriving in New Zealand,
          or need a cruise terminal transfer, we&apos;ve got you covered.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Shield, title: 'Licensed & Insured', desc: 'All our drivers are fully licensed and our vehicles are commercially insured.' },
            { icon: Award, title: '4.9 Star Rating', desc: 'Over 15,000 satisfied customers with a 4.9 Google rating.' },
            { icon: Clock, title: 'Always On Time', desc: 'We track your flight and adjust if it\'s delayed. No extra charge.' },
            { icon: Heart, title: 'Locally Owned', desc: 'A proud New Zealand business based right here in Auckland.' },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-xl bg-gray-50">
              <item.icon className="w-8 h-8 text-gold mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
