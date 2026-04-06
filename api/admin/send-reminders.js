/**
 * POST /api/admin/send-reminders
 * Send reminder emails to customers with bookings scheduled for tomorrow.
 * Skips bookings that are cancelled, already reminded, or have cancellation_requested.
 */
const { findMany, updateOne } = require('../_lib/db');
const { sendEmail } = require('../_lib/mailgun');
const { customerReminderEmail } = require('../_lib/email-templates');

function getTomorrowNZDate() {
  // NZ timezone: UTC+12 (or +13 in daylight saving)
  const now = new Date();
  // Use Pacific/Auckland timezone via toLocaleString trick
  const nzNow = new Date(now.toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
  nzNow.setDate(nzNow.getDate() + 1);
  const y = nzNow.getFullYear();
  const m = String(nzNow.getMonth() + 1).padStart(2, '0');
  const d = String(nzNow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  try {
    const tomorrowDate = getTomorrowNZDate();
    console.log(`Checking reminders for ${tomorrowDate}`);

    // Find all confirmed bookings for tomorrow
    const bookings = await findMany('bookings', { date: tomorrowDate }, { limit: 200 });

    // Filter out cancelled, already-reminded, and cancellation-requested
    const eligible = bookings.filter(b => {
      if (!b) return false;
      if (b.status !== 'confirmed') return false;
      if (b.cancellation_requested === true) return false;
      if (b.reminderSentForDate === tomorrowDate) return false;
      if (!b.email) return false;
      return true;
    });

    console.log(`Found ${eligible.length} bookings needing reminders out of ${bookings.length} for ${tomorrowDate}`);

    let sent = 0;
    let failed = 0;
    const now = new Date().toISOString();

    for (const booking of eligible) {
      try {
        const template = customerReminderEmail(booking);
        const success = await sendEmail({
          to: booking.email,
          subject: template.subject,
          html: template.html,
          replyTo: 'info@bookaride.co.nz',
        });

        if (success) {
          // Mark as reminded to prevent duplicate sends
          await updateOne('bookings', { id: booking.id }, {
            $set: {
              reminderSentForDate: tomorrowDate,
              reminderSentAt: now,
              reminderSource: 'admin_manual',
              reminderEmailSent: true,
              reminderCompleted: true,
            },
          });
          sent++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Error sending reminder for booking ${booking.id}:`, err.message);
        failed++;
      }
    }

    console.log(`Reminder job complete: ${sent} sent, ${failed} failed, ${bookings.length - eligible.length} skipped`);

    return res.status(200).json({
      success: true,
      message: `Sent ${sent} reminders, ${failed} failed, ${bookings.length - eligible.length} skipped (already sent or cancelled)`,
      details: {
        date: tomorrowDate,
        total_for_date: bookings.length,
        eligible: eligible.length,
        sent,
        failed,
        skipped: bookings.length - eligible.length,
      },
    });
  } catch (err) {
    console.error('Error sending reminders:', err);
    return res.status(500).json({ detail: `Error sending reminders: ${err.message}` });
  }
};
