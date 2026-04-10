/**
 * GET /api/cron/send-reminders
 *
 * Daily reminder cron. Runs once per day via Vercel Cron Jobs
 * (configured in vercel.json). Finds every confirmed booking
 * scheduled for TOMORROW (NZ time), then sends:
 *
 *   1. Reminder email via Mailgun
 *   2. Reminder SMS via Twilio
 *
 * Idempotency: Each booking is stamped with `reminderSentForDate`
 * so re-runs on the same day don't double-send. A booking is
 * skipped if it's cancelled, has `cancellation_requested`, or has
 * already been reminded for this date.
 *
 * Security: Only accept requests with the Vercel cron header or
 * a matching `CRON_SECRET`. Same pattern as daily-seo-agent.js.
 */

const { findMany, updateOne } = require('../_lib/db');
const { sendEmail } = require('../_lib/mailgun');
const { sendSms } = require('../_lib/twilio');
const { customerReminderEmail } = require('../_lib/email-templates');
const { bookingReminderSms } = require('../_lib/sms-templates');

function getTomorrowNZDate() {
  const now = new Date();
  const nzNow = new Date(now.toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
  nzNow.setDate(nzNow.getDate() + 1);
  const y = nzNow.getFullYear();
  const m = String(nzNow.getMonth() + 1).padStart(2, '0');
  const d = String(nzNow.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

module.exports = async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const providedSecret = req.headers['x-cron-secret'] || req.query.secret;
  const expectedSecret = process.env.CRON_SECRET;
  const isAuthorized = isVercelCron || (expectedSecret && providedSecret === expectedSecret);

  if (!isAuthorized) {
    return res.status(401).json({ detail: 'Unauthorized — cron secret required' });
  }

  const startTime = Date.now();
  const tomorrowDate = getTomorrowNZDate();
  console.log(`Reminder cron starting for ${tomorrowDate}`);

  try {
    const bookings = await findMany('bookings', { date: tomorrowDate }, { limit: 500 });

    const eligible = bookings.filter(b => {
      if (!b) return false;
      if (b.status !== 'confirmed') return false;
      if (b.cancellation_requested === true) return false;
      if (b.reminderSentForDate === tomorrowDate) return false;
      if (!b.email) return false;
      return true;
    });

    console.log(`Found ${eligible.length} bookings needing reminders (of ${bookings.length} total for ${tomorrowDate})`);

    let emailSent = 0;
    let emailFailed = 0;
    let smsSent = 0;
    let smsFailed = 0;
    const now = new Date().toISOString();

    for (const booking of eligible) {
      const template = customerReminderEmail(booking);
      const smsBody = bookingReminderSms(booking);

      // Fire email + SMS in parallel for each booking
      const [emailResult, smsResult] = await Promise.allSettled([
        sendEmail({
          to: booking.email,
          subject: template.subject,
          html: template.html,
          replyTo: 'info@bookaride.co.nz',
        }),
        booking.phone
          ? sendSms({ to: booking.phone, body: smsBody })
          : Promise.resolve(false),
      ]);

      const emailOk = emailResult.status === 'fulfilled' && emailResult.value === true;
      const smsOk = smsResult.status === 'fulfilled' && smsResult.value === true;

      if (emailOk) emailSent++; else emailFailed++;
      if (smsOk) smsSent++; else if (booking.phone) smsFailed++;

      // Only stamp as "reminded" if at least one channel succeeded,
      // so a total failure gets retried on the next run.
      if (emailOk || smsOk) {
        await updateOne('bookings', { id: booking.id }, {
          $set: {
            reminderSentForDate: tomorrowDate,
            reminderSentAt: now,
            reminderSource: 'cron',
            reminderEmailSent: emailOk,
            reminderSmsSent: smsOk,
            reminderCompleted: true,
          },
        }).catch(err => {
          console.error(`Failed to mark reminder sent for booking ${booking.id}: ${err.message}`);
        });
      } else {
        console.error(`CRITICAL: Both email AND SMS failed for booking ${booking.id} (${booking.email}) — will retry next run`);
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(
      `Reminder cron complete in ${durationMs}ms: ` +
      `email ${emailSent} sent / ${emailFailed} failed, ` +
      `SMS ${smsSent} sent / ${smsFailed} failed, ` +
      `${bookings.length - eligible.length} skipped`
    );

    return res.status(200).json({
      success: true,
      date: tomorrowDate,
      total_for_date: bookings.length,
      eligible: eligible.length,
      email: { sent: emailSent, failed: emailFailed },
      sms: { sent: smsSent, failed: smsFailed },
      skipped: bookings.length - eligible.length,
      duration_ms: durationMs,
    });
  } catch (err) {
    console.error(`CRITICAL: Reminder cron failed: ${err.message}`);
    return res.status(500).json({ detail: `Reminder cron failed: ${err.message}` });
  }
};
