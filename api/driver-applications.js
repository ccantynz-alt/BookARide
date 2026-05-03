/**
 * POST /api/driver-applications
 *
 * Public endpoint — receives driver applications from the
 * /drive-with-us page. Stores in driver_applications table and
 * notifies the admin inbox via Mailgun.
 */
const { insertOne } = require('./_lib/db');
const { sendEmail } = require('./_lib/mailgun');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const body = req.body || {};
    const required = ['name', 'email', 'phone'];
    for (const field of required) {
      if (!body[field]) return res.status(400).json({ detail: `${field} is required` });
    }

    const application = {
      id: uuidv4(),
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: String(body.phone).trim(),
      suburb: body.suburb || '',
      vehicleType: body.vehicleType || '',
      vehicleYear: body.vehicleYear || '',
      experience: body.experience || '',
      availability: body.availability || '',
      message: body.message || '',
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    const result = await insertOne('driver_applications', application);
    if (!result.acknowledged) {
      return res.status(500).json({ detail: 'Failed to save your application — please try again' });
    }

    // Notify admin (best-effort — don't fail the request if email fails)
    const adminEmail = process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
    sendEmail({
      to: adminEmail,
      subject: `New Driver Application — ${application.name}`,
      html: `
        <h2>New Driver Application</h2>
        <table style="border-collapse:collapse;">
          <tr><td><strong>Name:</strong></td><td>${application.name}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${application.email}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${application.phone}</td></tr>
          <tr><td><strong>Suburb:</strong></td><td>${application.suburb}</td></tr>
          <tr><td><strong>Vehicle:</strong></td><td>${application.vehicleType} ${application.vehicleYear}</td></tr>
          <tr><td><strong>Experience:</strong></td><td>${application.experience}</td></tr>
          <tr><td><strong>Availability:</strong></td><td>${application.availability}</td></tr>
        </table>
        <p><strong>Message:</strong></p>
        <p>${(application.message || '').replace(/</g, '&lt;')}</p>
      `,
      fromName: 'BookARide Driver Applications',
    }).catch(err => console.error('Driver application notification failed:', err.message));

    return res.status(200).json({ success: true, applicationId: application.id });
  } catch (err) {
    console.error('Driver application error:', err.message);
    return res.status(500).json({ detail: 'Failed to submit application' });
  }
};
