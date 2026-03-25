/**
 * POST /api/contact
 * Contact form submission — sends email via Mailgun to admin.
 */
const { sendEmail } = require('./_lib/mailgun');
const { insertOne } = require('./_lib/db');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const { name, email, phone, message, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ detail: 'Name, email, and message are required' });
    }

    // Log the contact submission
    await insertOne('contact_submissions', {
      id: uuidv4(),
      name,
      email,
      phone: phone || '',
      message,
      subject: subject || 'General Inquiry',
      createdAt: new Date().toISOString(),
    }).catch(err => console.error('Failed to log contact submission:', err.message));

    // Send to admin
    const adminEmail = process.env.CONTACT_NOTIFICATION_EMAIL || process.env.BOOKINGS_NOTIFICATION_EMAIL || 'bookings@bookaride.co.nz';
    await sendEmail({
      to: adminEmail,
      subject: `Contact Form: ${subject || 'General Inquiry'} - ${name}`,
      html: `<h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>`,
      replyTo: email,
    });

    return res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact form error:', err.message);
    return res.status(500).json({ detail: 'Failed to send message. Please try again.' });
  }
};
