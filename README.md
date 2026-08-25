# Schedule with Titus 💈

A free, GitHub Pages-hosted personal scheduling app for haircut bookings.

## 🚀 Live App
Once deployed: `https://tituspaine.github.io/schedule/`

## ⚙️ Setup

### 1. Enable GitHub Pages
1. Go to your repo → **Settings → Pages**
2. Under *Source*, choose **Deploy from a branch**
3. Select `main` branch, folder `/ (root)`, then click **Save**
4. Your app will be live at `https://tituspaine.github.io/schedule/` in ~1 minute.

---

### 2. Set Up EmailJS (free — required for email notifications)

EmailJS sends confirmation emails to clients and notifications to you — no backend needed.

1. **Create a free account** at [emailjs.com](https://www.emailjs.com/) (free tier = 200 emails/month).
2. **Add an Email Service:**
   - In the EmailJS dashboard, go to **Email Services → Add New Service**
   - Choose Gmail (or another provider) and connect your account
   - Copy the **Service ID** (e.g. `service_abc123`)
3. **Create an Email Template** for confirmations:
   - Go to **Email Templates → Create New Template**
   - Set the *To Email* field to `{{to_email}}`
   - Use these variables in your template body:

     ```
     Hi {{to_name}},

     Your appointment with Titus is confirmed!

     📅 Date: {{appt_date}}
     🕐 Time: {{appt_time}}
     👤 People: {{num_people}}
     📞 Phone: {{phone}}

     See you soon!
     ```

   - In the same template, add a **BCC** or second recipient field set to `contact@tituspaine.com` so Titus gets notified of each booking.
   - Copy the **Template ID** (e.g. `template_xyz456`)
4. Go to **Account → API Keys** and copy your **Public Key**
5. Open `index.html` and fill in the four config constants at the top of the `<script>` section:

   ```js
   const EMAILJS_PUBLIC_KEY    = 'YOUR_PUBLIC_KEY';
   const EMAILJS_SERVICE_ID    = 'service_abc123';
   const EMAILJS_TEMPLATE_CONF = 'template_xyz456';
   const EMAILJS_TEMPLATE_REM  = ''; // optional reminder template
   ```

6. Commit and push — the yellow notice banner will disappear automatically once the keys are set.

---

### 3. Reminder Emails (optional)
EmailJS's free tier doesn't support scheduled/delayed sends natively. Options:
- **Simplest free workaround**: The confirmation email already includes all appointment details; clients can add it to their calendar from the email.
- **Google Apps Script**: Set up a script to query a Google Sheet and send reminders — free and powerful.
- **Zapier free tier**: Can trigger emails from a Google Sheet on a schedule.

---

## 📋 How It Works

| Day | Hours | Slots |
|-----|-------|-------|
| Sunday | — | CLOSED |
| Monday | — | CLOSED |
| Tuesday–Friday | 7:30 AM – 5:00 PM (lunch 12–1 PM) | 10 AM + 10 PM = 20 slots |
| Saturday | 7:30 AM – 5:00 PM | 19 × 30-min slots |

- **Bookings** are stored in `localStorage` (per browser/device).
- Once a slot is booked on a device, it is hidden for that device's future sessions.
- The current day is highlighted in blue.
- Past days and fully-booked days are non-clickable.

## 📞 Contact Button
The floating chat button (bottom-right) opens call and email options:
- **Call**: `tel:2294492453`
- **Email**: `mailto:contact@tituspaine.com`
