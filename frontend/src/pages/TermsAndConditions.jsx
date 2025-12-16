import React from 'react';
import SEO from '../components/SEO';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Terms and Conditions of Travel | Book A Ride NZ"
        description="Terms and conditions for airport shuttle services provided by Book A Ride NZ. Read our travel conditions, booking terms, cancellation policy, and liability terms."
        canonical="/terms-and-conditions"
      />

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            Terms and Conditions of Travel
          </h1>
          <p className="text-center text-gray-300 mt-4">
            Last Updated: December 2025
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
            <p>
              By booking and using the airport shuttle services provided by Book A Ride NZ ("we", "us", "our"), 
              you ("the passenger", "you", "your") agree to be bound by these Terms and Conditions of Travel. 
              These terms constitute a legally binding agreement between you and Book A Ride NZ. If you do not 
              agree to these terms, you must not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
            <p className="mb-3">
              Book A Ride NZ provides door-to-door airport shuttle and transfer services throughout the Auckland region, 
              including but not limited to transfers to and from Auckland International Airport, accommodation venues, 
              cruise terminals, and other designated locations.
            </p>
            <p>
              Our services are subject to availability and booking confirmation. We reserve the right to refuse service 
              to any passenger for any lawful reason, including but not limited to intoxication, disruptive behavior, 
              or safety concerns.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Booking and Payment Terms</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">3.1 Booking Confirmation</h3>
            <p className="mb-3">
              A booking is confirmed only when you receive written confirmation via email or SMS from Book A Ride NZ. 
              Verbal bookings or unconfirmed online submissions do not constitute a valid booking.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Pricing</h3>
            <p className="mb-3">
              All prices are quoted in New Zealand Dollars (NZD) and include GST where applicable. Pricing is calculated 
              based on distance traveled, number of passengers, luggage requirements, and any additional services requested. 
              Prices quoted at the time of booking are guaranteed for that specific booking only and are subject to change 
              for future bookings.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.3 Payment</h3>
            <p className="mb-3">
              Payment is required at the time of booking via our secure online payment system. We accept major credit cards 
              and debit cards. Payment receipts will be provided via email. In cases of pre-arranged corporate accounts, 
              alternative payment terms may apply as agreed in writing.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.4 Additional Charges</h3>
            <p className="mb-3">
              Additional charges may apply for: waiting time beyond the included grace period, route changes requested 
              during transit, additional stops not included in the original booking, oversized or excess luggage, child 
              seats, pet transportation (where permitted), or services provided outside standard hours. Passengers will be 
              notified of any additional charges before they are incurred where reasonably possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Cancellation and Refund Policy</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">4.1 Passenger Cancellations</h3>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li><strong>More than 24 hours before scheduled pickup:</strong> Full refund minus a 10% administrative fee</li>
              <li><strong>12-24 hours before scheduled pickup:</strong> 50% refund</li>
              <li><strong>Less than 12 hours before scheduled pickup:</strong> No refund</li>
              <li><strong>No-show:</strong> No refund</li>
            </ul>
            <p className="mb-3">
              Cancellation requests must be made in writing via email to the address provided in your booking confirmation. 
              Cancellation is effective only when confirmed by Book A Ride NZ in writing.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Modifications to Bookings</h3>
            <p className="mb-3">
              Modifications to confirmed bookings (date, time, pickup/dropoff locations) must be requested at least 12 hours 
              before the scheduled pickup time. Modifications are subject to availability and may result in price adjustments. 
              Modification requests made less than 12 hours before pickup will be treated as a cancellation and rebooking, 
              subject to the cancellation policy above.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Company Cancellations</h3>
            <p className="mb-3">
              In the rare event that we must cancel your booking due to circumstances within our control, you will receive 
              a full refund. We will make reasonable efforts to provide alternative transportation or reschedule your service. 
              Our liability is limited to the refund of the booking fee; we are not responsible for consequential losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Passenger Responsibilities</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">5.1 Punctuality and Pickup</h3>
            <p className="mb-3">
              Passengers must be ready at the designated pickup location at the scheduled time. A grace period of 10 minutes 
              is provided. After this time, waiting charges may apply at the rate of $15 per 15 minutes or part thereof. 
              If a passenger is not present within 30 minutes of the scheduled pickup time and has not made contact, 
              the booking may be canceled as a no-show with no refund.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Accurate Information</h3>
            <p className="mb-3">
              Passengers must provide accurate information at the time of booking, including: correct pickup and dropoff 
              addresses, accurate passenger count, special requirements (child seats, wheelchair access, etc.), and valid 
              contact details. Failure to provide accurate information may result in additional charges or service refusal.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.3 Luggage</h3>
            <p className="mb-3">
              Each passenger is entitled to one standard suitcase (maximum 23kg) and one piece of hand luggage. Oversized 
              luggage, sporting equipment, or excess baggage must be declared at the time of booking and may incur additional 
              charges. We reserve the right to refuse transport of items that pose a safety risk or exceed vehicle capacity.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.4 Conduct</h3>
            <p className="mb-3">
              Passengers must conduct themselves in a respectful and lawful manner. We reserve the right to refuse or terminate 
              service without refund if a passenger: is intoxicated or under the influence of drugs, behaves in a threatening, 
              abusive, or disruptive manner, damages company property, smokes in the vehicle, or violates New Zealand law. 
              Any damage caused to vehicles will be charged to the passenger responsible.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.5 Children and Infants</h3>
            <p className="mb-3">
              Children must be properly secured in age-appropriate child restraints as required by New Zealand law. 
              Child seats can be provided upon request at the time of booking for an additional fee. Children under 14 
              must be accompanied by an adult.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Flight and Schedule Changes</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">6.1 Airport Pickups</h3>
            <p className="mb-3">
              For airport pickup services, we monitor flight arrivals and adjust pickup times accordingly at no extra charge. 
              However, passengers must provide accurate flight information at the time of booking. If your flight is delayed 
              by more than 3 hours, we will make reasonable efforts to accommodate you, but cannot guarantee immediate availability.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Schedule Changes</h3>
            <p className="mb-3">
              If your travel plans change, you must notify us as soon as possible. Early notification increases the likelihood 
              of accommodating changes without penalty. Last-minute changes (less than 12 hours before scheduled pickup) are 
              subject to the cancellation and modification policies stated above.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Liability and Insurance</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">7.1 Personal Injury</h3>
            <p className="mb-3">
              All vehicles are fully insured in accordance with New Zealand law. In the event of an accident, claims for 
              personal injury are covered by New Zealand's Accident Compensation Corporation (ACC) system. Our liability 
              for personal injury is limited to the extent provided by law and our insurance coverage.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.2 Property Damage and Loss</h3>
            <p className="mb-3">
              While we take all reasonable care with passenger belongings, we are not liable for loss, theft, or damage to 
              personal property, luggage, or valuables during transport. Passengers are responsible for their own belongings 
              at all times. We strongly recommend comprehensive travel insurance. Maximum liability for lost luggage is limited 
              to NZD $500 per passenger, and claims must be reported immediately to the driver and confirmed in writing within 
              24 hours.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.3 Missed Flights and Consequential Loss</h3>
            <p className="mb-3">
              While we make every effort to provide timely service, we are not liable for missed flights, appointments, or 
              consequential losses arising from delays due to traffic conditions, road accidents, weather events, vehicle 
              breakdowns, or other circumstances beyond our reasonable control. Passengers are advised to allow adequate time 
              for their journey and to have contingency plans for important time-sensitive travel.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.4 Force Majeure</h3>
            <p className="mb-3">
              We are not liable for failure to perform our obligations due to events beyond our reasonable control, including 
              but not limited to: acts of God, natural disasters, extreme weather conditions, civil unrest, government actions, 
              strikes, pandemics, terrorism, or major traffic incidents. In such circumstances, we will make reasonable efforts 
              to provide alternative solutions or refunds where appropriate.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.5 Maximum Liability</h3>
            <p className="mb-3">
              To the maximum extent permitted by law, our total liability to any passenger for any claim arising from or 
              related to our services shall not exceed the amount paid by that passenger for the specific booking in question.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Complaints and Disputes</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">8.1 Complaint Procedure</h3>
            <p className="mb-3">
              If you have a complaint about our service, please contact us in writing within 7 days of the service date. 
              We will investigate all complaints promptly and respond within 14 business days. Complaints should be sent to 
              the email address provided in your booking confirmation.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">8.2 Dispute Resolution</h3>
            <p className="mb-3">
              In the event of a dispute, both parties agree to first attempt to resolve the matter through good faith 
              negotiation. If negotiation is unsuccessful, the parties may pursue mediation before resorting to litigation. 
              Any legal proceedings shall be conducted in accordance with New Zealand law and under the jurisdiction of 
              New Zealand courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Privacy and Data Protection</h2>
            <p className="mb-3">
              We collect and process personal information in accordance with the New Zealand Privacy Act 2020 and our 
              Privacy Policy. By using our services, you consent to the collection, use, and disclosure of your personal 
              information as described in our Privacy Policy, available on our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Prohibited Items and Activities</h2>
            <p className="mb-3">The following items and activities are strictly prohibited in our vehicles:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Smoking, vaping, or use of electronic cigarettes</li>
              <li>Consumption of alcohol or illegal drugs</li>
              <li>Weapons of any kind (unless legally carried by authorized security personnel)</li>
              <li>Hazardous materials or substances</li>
              <li>Illegal items or contraband</li>
              <li>Pets or animals (except registered assistance animals with prior notification)</li>
              <li>Any activity that endangers the safety of passengers or the driver</li>
            </ul>
            <p className="mt-3">
              Violation of these prohibitions will result in immediate termination of service without refund and may be 
              reported to authorities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Intellectual Property</h2>
            <p className="mb-3">
              All content on our website, including but not limited to text, graphics, logos, images, and software, is the 
              property of Book A Ride NZ or its licensors and is protected by New Zealand and international copyright laws. 
              You may not reproduce, distribute, or create derivative works from any content without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">12. Changes to Terms and Conditions</h2>
            <p className="mb-3">
              We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately 
              upon posting to our website. The "Last Updated" date at the top of this document indicates when changes were 
              last made. Continued use of our services after changes are posted constitutes acceptance of the modified terms. 
              We recommend reviewing these terms periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">13. Severability</h2>
            <p className="mb-3">
              If any provision of these Terms and Conditions is found to be invalid or unenforceable by a court of competent 
              jurisdiction, such provision shall be severed from these terms, and the remaining provisions shall continue in 
              full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">14. Entire Agreement</h2>
            <p className="mb-3">
              These Terms and Conditions, together with our Privacy Policy and Website Usage Policy, constitute the entire 
              agreement between you and Book A Ride NZ concerning your use of our services and supersede all prior agreements 
              and understandings, whether written or oral.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">15. Contact Information</h2>
            <p className="mb-3">
              For questions about these Terms and Conditions or our services, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="mb-2"><strong>Book A Ride NZ</strong></p>
              <p className="mb-2">Email: info@bookaride.co.nz</p>
              <p>Address: Auckland, New Zealand</p>
            </div>
          </section>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
            <p className="font-semibold mb-2">Acknowledgment</p>
            <p className="text-sm">
              By booking our services, you acknowledge that you have read, understood, and agree to be bound by these 
              Terms and Conditions of Travel. If you do not agree to these terms, please do not use our services.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
