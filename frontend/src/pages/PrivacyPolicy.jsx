import React from 'react';
import SEO from '../components/SEO';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Privacy Policy | Book A Ride NZ"
        description="Privacy policy for Book A Ride NZ. Learn how we collect, use, store, and protect your personal information in compliance with New Zealand Privacy Act 2020."
        canonical="/privacy-policy"
      />

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            Privacy Policy
          </h1>
          <p className="text-center text-gray-300 mt-4">
            Last Updated: December 2025
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="mb-3">
              Book A Ride NZ ("we", "us", "our") is committed to protecting your privacy and personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our website (bookaride.co.nz and bookaridenz.com) and our airport shuttle services.
            </p>
            <p className="mb-3">
              This policy is designed to comply with the New Zealand Privacy Act 2020 and its 13 Privacy Principles. 
              We are committed to being transparent about how we handle your personal information and ensuring your 
              privacy rights are respected.
            </p>
            <p>
              By using our services or website, you consent to the collection, use, and disclosure of your personal 
              information as described in this Privacy Policy. If you do not agree with this policy, please do not 
              use our services or website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Personal Information You Provide</h3>
            <p className="mb-3">We collect personal information that you voluntarily provide when you:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Make a booking:</strong> Name, email address, phone number, pickup/dropoff addresses, flight details, passenger count, special requirements</li>
              <li><strong>Create an account:</strong> Username, password, email address, contact preferences</li>
              <li><strong>Make a payment:</strong> Billing information (processed securely through Stripe - we do not store full credit card details)</li>
              <li><strong>Contact us:</strong> Name, email, phone number, inquiry details</li>
              <li><strong>Subscribe to communications:</strong> Email address, communication preferences</li>
              <li><strong>Submit reviews or feedback:</strong> Name, review content, ratings</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Information Automatically Collected</h3>
            <p className="mb-3">When you visit our website, we automatically collect certain information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Device information:</strong> IP address, browser type and version, operating system, device type</li>
              <li><strong>Usage data:</strong> Pages visited, time spent on pages, links clicked, referring website</li>
              <li><strong>Location data:</strong> Approximate geographic location based on IP address</li>
              <li><strong>Cookies and tracking data:</strong> See Section 8 for detailed information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Information from Third Parties</h3>
            <p className="mb-3">We may receive information from:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment processors (Stripe):</strong> Transaction confirmation, payment status</li>
              <li><strong>Google Maps API:</strong> Distance calculations, route information</li>
              <li><strong>Flight tracking services:</strong> Flight arrival/departure times, delays</li>
              <li><strong>Analytics providers:</strong> Aggregated usage statistics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">3.1 Primary Purposes</h3>
            <p className="mb-3">We use your personal information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provide services:</strong> Process bookings, arrange transportation, coordinate pickups and dropoffs</li>
              <li><strong>Communication:</strong> Send booking confirmations, service updates, SMS notifications, driver coordination</li>
              <li><strong>Payment processing:</strong> Process transactions, issue invoices and receipts</li>
              <li><strong>Customer support:</strong> Respond to inquiries, resolve complaints, provide assistance</li>
              <li><strong>Service improvement:</strong> Analyze usage patterns, improve website functionality, enhance customer experience</li>
              <li><strong>Safety and security:</strong> Verify identities, prevent fraud, ensure passenger and driver safety</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Secondary Purposes</h3>
            <p className="mb-3">With your consent, we may also use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Marketing:</strong> Send promotional emails, special offers, service updates (you can opt-out anytime)</li>
              <li><strong>Research:</strong> Conduct surveys, market research, customer satisfaction studies</li>
              <li><strong>Personalization:</strong> Customize website content, remember your preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.3 Legal Purposes</h3>
            <p className="mb-3">We may use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comply with legal obligations and respond to lawful requests from authorities</li>
              <li>Enforce our Terms and Conditions and other agreements</li>
              <li>Protect our rights, property, and safety, and those of our users and the public</li>
              <li>Resolve disputes and investigate complaints</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">4.1 Service Providers</h3>
            <p className="mb-3">We share information with trusted third-party service providers who assist us in operating our business:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment processors (Stripe):</strong> To process secure payments</li>
              <li><strong>Communication services (Mailgun, Twilio):</strong> To send emails and SMS notifications</li>
              <li><strong>Cloud hosting providers:</strong> To store and manage data</li>
              <li><strong>Analytics providers (Google Analytics):</strong> To analyze website usage</li>
              <li><strong>Mapping services (Google Maps):</strong> To calculate distances and routes</li>
            </ul>
            <p className="mt-3">
              These service providers are contractually obligated to protect your information and use it only for the 
              purposes we specify.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Drivers and Contractors</h3>
            <p className="mb-3">
              We share necessary booking information with our drivers and contracted transportation providers to fulfill 
              your service request. This includes your name, contact number, pickup/dropoff locations, and service details.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Business Transfers</h3>
            <p className="mb-3">
              In the event of a merger, acquisition, sale of assets, or bankruptcy, your personal information may be 
              transferred to the acquiring entity. We will notify you via email and/or prominent notice on our website 
              of any such change in ownership or control of your personal information.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.4 Legal Requirements</h3>
            <p className="mb-3">
              We may disclose your information if required to do so by law or in response to valid requests by public 
              authorities (e.g., court orders, subpoenas, government agencies). We will only disclose information to 
              the extent necessary to comply with legal obligations.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.5 Consent-Based Sharing</h3>
            <p className="mb-3">
              We may share your information with other parties when you have given us explicit consent to do so.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">5.1 Security Measures</h3>
            <p className="mb-3">
              We implement appropriate technical and organizational security measures to protect your personal information 
              from unauthorized access, use, alteration, or destruction:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
              <li><strong>Secure servers:</strong> Data stored on secure, password-protected servers</li>
              <li><strong>Access controls:</strong> Limited employee access based on role requirements</li>
              <li><strong>Payment security:</strong> PCI-DSS compliant payment processing via Stripe</li>
              <li><strong>Regular security audits:</strong> Periodic review of security practices</li>
              <li><strong>Backup systems:</strong> Regular data backups to prevent data loss</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Limitations</h3>
            <p className="mb-3">
              While we strive to protect your personal information, no method of transmission over the internet or 
              electronic storage is 100% secure. We cannot guarantee absolute security but are committed to using 
              industry-standard practices to safeguard your data.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.3 Data Breach Response</h3>
            <p className="mb-3">
              In the event of a data breach that poses a risk to your privacy, we will notify you and relevant authorities 
              in accordance with New Zealand Privacy Act 2020 requirements, typically within 72 hours of becoming aware 
              of the breach.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
            <p className="mb-3">
              We retain your personal information for as long as necessary to fulfill the purposes for which it was 
              collected, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Booking records:</strong> 7 years (for accounting and tax purposes)</li>
              <li><strong>Account information:</strong> Duration of account plus 2 years after closure</li>
              <li><strong>Communication records:</strong> 3 years from last interaction</li>
              <li><strong>Marketing data:</strong> Until you unsubscribe or withdraw consent</li>
              <li><strong>Website usage data:</strong> 14 months</li>
              <li><strong>Legal compliance records:</strong> As required by applicable laws</li>
            </ul>
            <p className="mt-3">
              After the retention period expires, we securely delete or anonymize your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Your Privacy Rights</h2>
            
            <p className="mb-3">Under the New Zealand Privacy Act 2020, you have the following rights:</p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.1 Right to Access</h3>
            <p className="mb-3">
              You have the right to request access to the personal information we hold about you. We will provide you 
              with a copy of your information within 20 working days of receiving your request.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.2 Right to Correction</h3>
            <p className="mb-3">
              You have the right to request correction of inaccurate or incomplete personal information. We will correct 
              your information promptly upon verification of the correction request.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.3 Right to Deletion</h3>
            <p className="mb-3">
              You have the right to request deletion of your personal information, subject to legal retention requirements. 
              We will delete your information within 20 working days unless we have a legitimate reason to retain it.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.4 Right to Withdraw Consent</h3>
            <p className="mb-3">
              Where we process your information based on consent, you have the right to withdraw that consent at any time. 
              This will not affect the lawfulness of processing based on consent before withdrawal.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.5 Right to Object</h3>
            <p className="mb-3">
              You have the right to object to processing of your personal information for direct marketing purposes. 
              You can opt-out of marketing communications at any time by clicking "unsubscribe" in our emails or 
              contacting us directly.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.6 Right to Complain</h3>
            <p className="mb-3">
              If you believe we have breached the Privacy Act 2020, you have the right to complain to us first. 
              If you are not satisfied with our response, you may complain to the Office of the Privacy Commissioner: 
              <a href="https://www.privacy.org.nz" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                www.privacy.org.nz
              </a>
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.7 How to Exercise Your Rights</h3>
            <p className="mb-3">
              To exercise any of these rights, please contact us at info@bookaride.co.nz with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your full name and contact details</li>
              <li>Details of your request</li>
              <li>Proof of identity (for security purposes)</li>
            </ul>
            <p className="mt-3">
              We will respond to your request within 20 working days. There is no fee for access requests unless the 
              request is manifestly unfounded, excessive, or repetitive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking Technologies</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">8.1 What Are Cookies</h3>
            <p className="mb-3">
              Cookies are small text files stored on your device when you visit our website. We use cookies and similar 
              tracking technologies to enhance your experience, analyze site usage, and assist with our marketing efforts.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">8.2 Types of Cookies We Use</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential cookies:</strong> Required for website functionality (e.g., maintaining your session)</li>
              <li><strong>Performance cookies:</strong> Help us understand how visitors use our site (e.g., Google Analytics)</li>
              <li><strong>Functional cookies:</strong> Remember your preferences and choices</li>
              <li><strong>Marketing cookies:</strong> Track your browsing to show relevant advertisements</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">8.3 Cookie Management</h3>
            <p className="mb-3">
              You can control cookie settings through your browser preferences. However, disabling cookies may affect 
              website functionality. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>See what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Third-Party Services</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">9.1 Payment Processing (Stripe)</h3>
            <p className="mb-3">
              We use Stripe to process secure payments. Stripe's privacy policy governs their collection and use of 
              your payment information. We do not store full credit card details on our servers.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">9.2 Google Services</h3>
            <p className="mb-3">
              We use Google Maps API for distance calculations and Google Analytics for website analytics. Google's 
              privacy policy governs their data practices.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">9.3 Communication Services</h3>
            <p className="mb-3">
              We use Mailgun for email delivery and Twilio for SMS notifications. These providers have access to your 
              contact information only for the purpose of delivering communications on our behalf.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Children's Privacy</h2>
            <p className="mb-3">
              Our services are not directed to children under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If you become aware that a child has provided us with personal 
              information, please contact us immediately. If we discover we have collected information from a child 
              under 13, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. International Data Transfers</h2>
            <p className="mb-3">
              Your personal information may be transferred to and processed in countries other than New Zealand, including 
              countries where our service providers operate (e.g., United States for Stripe, Google services). These 
              countries may have different data protection laws than New Zealand.
            </p>
            <p className="mb-3">
              We ensure appropriate safeguards are in place for international transfers, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Standard contractual clauses approved by data protection authorities</li>
              <li>Service providers with adequate data protection policies</li>
              <li>Compliance with applicable data protection regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">12. Changes to Privacy Policy</h2>
            <p className="mb-3">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, 
              legal requirements, or other factors. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Posting the updated policy on our website with a new "Last Updated" date</li>
              <li>Sending an email notification to registered users</li>
              <li>Displaying a prominent notice on our website</li>
            </ul>
            <p className="mt-3">
              We encourage you to review this Privacy Policy periodically. Your continued use of our services after 
              changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
            <p className="mb-3">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="mb-2"><strong>Book A Ride NZ - Privacy Officer</strong></p>
              <p className="mb-2">Email: privacy@bookaride.co.nz</p>
              <p className="mb-2">Phone: +64 9 555 0123</p>
              <p className="mb-2">Postal Address: Auckland, New Zealand</p>
              <p className="mt-4 text-sm text-gray-600">
                We aim to respond to all privacy-related inquiries within 20 working days.
              </p>
            </div>
          </section>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
            <p className="font-semibold mb-2">Acknowledgment and Consent</p>
            <p className="text-sm">
              By using our services and website, you acknowledge that you have read and understood this Privacy Policy 
              and consent to the collection, use, and disclosure of your personal information as described herein.
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 mt-6">
            <p className="font-semibold mb-2">✓ Privacy Act 2020 Compliance</p>
            <p className="text-sm">
              This Privacy Policy complies with the New Zealand Privacy Act 2020 and its 13 Privacy Principles. 
              We are committed to protecting your privacy and handling your personal information responsibly.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
