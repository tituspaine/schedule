# Schedule — Haircut Appointment Booking

A free, static scheduling app hosted on GitHub Pages.

**Live site:** https://tituspaine.github.io/schedule/

## Features

- Monthly calendar with availability per day
- Tuesday–Friday: 10 slots before lunch, 10 after (7:30am–5pm, lunch 12–1pm)
- Saturday: 30-minute slots
- Monday/Sunday: Closed
- Shared booking persistence via Firebase Firestore (prevents double-booking across all users)
- Email confirmations via Firebase Cloud Functions + SMTP (no third-party email SDK in the browser)
- Appointment management links — clients can view, cancel, or reschedule from their email
- Email notifications to owner on all booking activity

## Setup

See [SETUP.md](./SETUP.md) for full Firebase and Firebase Functions configuration instructions.