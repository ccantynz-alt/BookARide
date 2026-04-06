export default function Privacy() {
  return (
    <div className="section-padding">
      <div className="container-max max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600 leading-relaxed">
          <p><strong>Last updated:</strong> April 2026</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Information We Collect</h2>
          <p>When you book a transfer, we collect: your name, email address, phone number, pickup and drop-off addresses, flight details (if applicable), and payment information. Payment card details are processed securely by Stripe and are never stored on our servers.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">2. How We Use Your Information</h2>
          <p>Your information is used to: process your booking, communicate trip details, send confirmations and reminders, process payments, improve our services, and comply with legal obligations.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Information Sharing</h2>
          <p>We share your information only with: our drivers (name, pickup address, and flight details only), payment processors (Stripe), and email service providers (Mailgun) for sending confirmations. We never sell your personal information.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Data Security</h2>
          <p>We use industry-standard security measures including encrypted connections (HTTPS), secure payment processing, and access controls. Your data is stored on secure servers hosted in reputable cloud infrastructure.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Your Rights</h2>
          <p>Under the New Zealand Privacy Act 2020, you have the right to: access your personal information, request corrections, and request deletion. Contact us at <a href="mailto:info@bookaride.co.nz" className="text-gold hover:underline">info@bookaride.co.nz</a> to exercise these rights.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Cookies</h2>
          <p>We use essential cookies for website functionality and analytics cookies to understand how visitors use our site. You can disable cookies in your browser settings.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Contact</h2>
          <p>For privacy inquiries: <a href="mailto:info@bookaride.co.nz" className="text-gold hover:underline">info@bookaride.co.nz</a></p>
        </div>
      </div>
    </div>
  )
}
