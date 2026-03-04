import { Plane } from 'lucide-react'

export default function BookNow() {
  return (
    <div className="section-padding">
      <div className="container-max max-w-3xl">
        <div className="text-center mb-10">
          <Plane className="w-10 h-10 text-gold mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Book Your Transfer
          </h1>
          <p className="text-gray-500">
            Booking form coming in Session 2.
          </p>
        </div>

        {/* Placeholder booking form shell */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Drop-off Address</label>
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
            <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
              Get Price (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
