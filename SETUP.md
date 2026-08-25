# Schedule App — Setup Guide

This app is a static GitHub Pages scheduling site for haircut appointments. It uses:

- **GitHub Pages** — free hosting
- **Firebase Firestore** — free-tier shared persistence (prevents double-booking across all users/devices)
- **EmailJS** — free-tier email delivery (no backend required)

---

## 1. Firebase Setup (Shared Persistence)

Firebase Firestore stores appointments and prevents double-booking globally.

### Steps

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/) and create a **new project** (free Spark plan).
2. In the project, click **Firestore Database** → **Create database** → choose **Production mode** → pick a region → click **Enable**.
3. Go to **Project Settings** (gear icon) → **Your apps** → click **</>** (Web) → register the app → copy the `firebaseConfig` object.
4. Open `index.html` and replace the placeholder values in the `firebaseConfig` block near the top of the `<script type="module">`:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### Firestore Security Rules

In the Firebase console, go to **Firestore → Rules** and paste the following to allow reads/writes from your GitHub Pages domain only:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appointments/{apptId} {
      // Anyone can read and create appointments (needed for booking + management links)
      allow read: true;
      // Allow create only if the document doesn't already exist (prevents double-booking)
      allow create: if !exists(/databases/$(database)/documents/appointments/$(apptId));
      // Allow update only to cancel/reschedule (not replace full document)
      allow update: if request.resource.data.keys().hasOnly(['status', 'updatedAt'])
                    || request.resource.data.diff(resource.data).affectedKeys().hasOnly(
                         ['status','rescheduledFrom','updatedAt','date','slot']);
      allow delete: if false;
    }
  }
}
```

> **Note:** These rules let anyone with the appointment ID manage their booking, which is intentional — management links are private per-user.

---

## 2. EmailJS Setup (Email Notifications)

EmailJS sends emails from the browser without a backend.

### Steps

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/) and create a free account.
2. Click **Email Services** → **Add New Service** → connect your email provider (Gmail, Outlook, etc.).
3. Note your **Service ID**.
4. Go to **Email Templates** and create **three templates**:

#### Template 1 — `template_confirm` (sent to client on booking)

- **Template Name:** `template_confirm`
- **To Email:** `{{to_email}}`
- **Subject:** `Your Haircut Appointment Confirmed — {{appt_date}} at {{appt_slot}}`
- **Body:**
```
Hi {{client_name}},

Your appointment is confirmed!

Date: {{appt_date}}
Time: {{appt_slot}}
People: {{num_people}}
Phone: {{client_phone}}

Need to cancel or reschedule? Use this link:
{{manage_link}}

See you soon!
– Titus
```

#### Template 2 — `template_notify` (sent to owner on new booking)

- **Template Name:** `template_notify`
- **To Email:** `{{to_email}}`
- **Subject:** `New Appointment — {{client_name}} on {{appt_date}}`
- **Body:**
```
New appointment booked:

Client: {{client_name}}
Date: {{appt_date}}
Time: {{appt_slot}}
People: {{num_people}}
Phone: {{client_phone}}
Email: {{client_email}}

Manage link: {{manage_link}}
```

#### Template 3 — `template_mgmt_update` (sent on cancel/reschedule)

- **Template Name:** `template_mgmt_update`
- **To Email:** `{{to_email}}`
- **Subject:** `Appointment {{action}} — {{client_name}}`
- **Body:**
```
Appointment Update — {{action}}

Client: {{client_name}}
Original: {{old_date}} at {{old_slot}}
New: {{new_date}} {{new_slot}}
Phone: {{client_phone}}
Email: {{client_email}}
People: {{num_people}}
```

5. In `index.html`, replace the EmailJS config values near the top of the `<script>` block:

```js
const EMAILJS_PUBLIC_KEY  = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
```

> Your **Public Key** is found in EmailJS → Account → API Keys.

---

## 3. GitHub Pages Deployment

1. Push all changes to the `main` branch.
2. In your GitHub repo, go to **Settings → Pages**.
3. Under **Source**, select **Deploy from a branch** → `main` → `/ (root)`.
4. Click **Save**. Your site will be live at `https://tituspaine.github.io/schedule/`.

---

## 4. Update the Site URL constant

In `index.html`, make sure the `SITE_URL` constant matches your GitHub Pages URL:

```js
const SITE_URL = "https://tituspaine.github.io/schedule/";
```

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| GitHub Pages | Unlimited static hosting |
| Firebase Firestore | 50K reads/day, 20K writes/day, 1GB storage |
| EmailJS | 200 emails/month |

For a personal scheduling app these limits are very generous.
