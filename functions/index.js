/**
 * Firebase Cloud Functions — Email notifications for the schedule app.
 *
 * Triggered by writes to the `emailQueue` collection in Firestore.
 * Each document has a `type` field:
 *   - "booking_confirmed"  → send confirmation to client + notification to owner
 *   - "booking_updated"    → send cancel/reschedule notice to both owner and client
 *
 * Email is sent via Nodemailer using SMTP credentials stored in
 * Firebase environment config:
 *
 *   firebase functions:config:set \
 *     mail.host="smtp.gmail.com" \
 *     mail.port="587" \
 *     mail.user="your@gmail.com" \
 *     mail.pass="your-app-password" \
 *     mail.owner="contact@tituspaine.com"
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions }  = require("firebase-functions/v2");
const admin     = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// ─── Nodemailer transport (configured via Firebase environment) ──────────────
function createTransport() {
  const cfg = process.env;
  return nodemailer.createTransport({
    host:   cfg.MAIL_HOST   || "smtp.gmail.com",
    port:   Number(cfg.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: cfg.MAIL_USER,
      pass: cfg.MAIL_PASS
    }
  });
}

const OWNER_EMAIL = process.env.MAIL_OWNER || "contact@tituspaine.com";
const FROM_ADDRESS = `"Titus Paine Scheduling" <${process.env.MAIL_USER || "noreply@tituspaine.com"}>`;

// ─── Send helper ─────────────────────────────────────────────────────────────
async function sendMail(to, subject, text) {
  const transport = createTransport();
  await transport.sendMail({ from: FROM_ADDRESS, to, subject, text });
}

// ─── Cloud Function: process emailQueue ──────────────────────────────────────
exports.processEmailQueue = onDocumentCreated("emailQueue/{docId}", async (event) => {
  const data = event.data.data();
  if (!data || data.status !== "pending") return;

  const db  = admin.firestore();
  const ref = event.data.ref;

  try {
    if (data.type === "booking_confirmed") {
      await handleBookingConfirmed(data);
    } else if (data.type === "booking_updated") {
      await handleBookingUpdated(data);
    } else {
      console.warn("Unknown email type:", data.type);
    }

    await ref.update({ status: "sent", processedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Email send failed:", err);
    await ref.update({ status: "error", error: err.message });
  }
});

// ─── Email builders ──────────────────────────────────────────────────────────
async function handleBookingConfirmed(d) {
  const clientSubject = `Your Haircut Appointment Confirmed — ${d.appt_date} at ${d.appt_slot}`;
  const clientBody = `Hi ${d.client_name},

Your appointment is confirmed!

Date:   ${d.appt_date}
Time:   ${d.appt_slot}
People: ${d.num_people}
Phone:  ${d.client_phone}

Need to cancel or reschedule? Use this link:
${d.manage_link}

See you soon!
– Titus`;

  const ownerSubject = `New Appointment — ${d.client_name} on ${d.appt_date}`;
  const ownerBody = `New appointment booked:

Client: ${d.client_name}
Date:   ${d.appt_date}
Time:   ${d.appt_slot}
People: ${d.num_people}
Phone:  ${d.client_phone}
Email:  ${d.client_email}

Manage link: ${d.manage_link}`;

  await sendMail(d.client_email, clientSubject, clientBody);
  await sendMail(OWNER_EMAIL, ownerSubject, ownerBody);
}

async function handleBookingUpdated(d) {
  const subject = `Appointment ${d.action} — ${d.client_name}`;
  const newInfo = d.new_date
    ? `New: ${d.new_date} at ${d.new_slot}`
    : "New: N/A (cancelled)";

  const body = `Appointment Update — ${d.action}

Client:   ${d.client_name}
Original: ${d.old_date} at ${d.old_slot}
${newInfo}
Phone:    ${d.client_phone}
Email:    ${d.client_email}
People:   ${d.num_people}`;

  await sendMail(d.client_email, subject, body);
  await sendMail(OWNER_EMAIL, subject, body);
}
