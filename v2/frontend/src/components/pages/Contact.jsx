import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export default function Contact() {
  return (
    <div className="section-padding">
      <div className="container-max max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-gray-500 mb-10">
          Have a question or need help with a booking? Get in touch.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          <a href="tel:+6421880793" className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 hover:bg-gold-50 transition-colors group">
            <Phone className="w-6 h-6 text-gold mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-gold transition-colors">Phone</h3>
              <p className="text-gray-500 text-sm">021 880 793</p>
            </div>
          </a>
          <a href="mailto:info@bookaride.co.nz" className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 hover:bg-gold-50 transition-colors group">
            <Mail className="w-6 h-6 text-gold mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-gold transition-colors">Email</h3>
              <p className="text-gray-500 text-sm">info@bookaride.co.nz</p>
            </div>
          </a>
          <div className="flex items-start gap-4 p-6 rounded-xl bg-gray-50">
            <MapPin className="w-6 h-6 text-gold mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Location</h3>
              <p className="text-gray-500 text-sm">Auckland, New Zealand</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-xl bg-gray-50">
            <Clock className="w-6 h-6 text-gold mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Hours</h3>
              <p className="text-gray-500 text-sm">24/7 - We never sleep</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
