# Schedule App — Setup Guide

This app is a static GitHub Pages scheduling site for haircut appointments. It uses:

- **GitHub Pages** — free hosting
- **Firebase Firestore** — free-tier shared persistence (prevents double-booking across all users/devices)
- **Firebase Cloud Functions** — serverless backend that sends transactional emails on booking events
- **Nodemailer + SMTP** — email delivery inside the function (Gmail App Password or any SMTP provider)

---

## 1. Firebase Setup (Shared Persistence)

Firebase Firestore stores appointments and prevents double-booking globally.

### Steps

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/) and create a **new project** (free Spark plan is fine for Firestore; Cloud Functions require the **Blaze (pay-as-you-go)** plan — costs are negligible for personal use).
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

In the Firebase console, go to **Firestore → Rules** and paste the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appointments/{apptId} {
      allow read: true;
      allow create: if !exists(/databases/$(database)/documents/appointments/$(apptId));
      allow update: if request.resource.data.keys().hasOnly(['status', 'updatedAt'])
                    || request.resource.data.diff(resource.data).affectedKeys().hasOnly(
                         ['status','rescheduledFrom','updatedAt','date','slot']);
      allow delete: if false;
    }
    // emailQueue is write-only from the browser; only Functions read/update it
    match /emailQueue/{docId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

---

## 2. Firebase Cloud Functions Setup (Email Notifications)

The `functions/` directory contains a Node.js Cloud Function that watches the `emailQueue` collection and sends emails via SMTP whenever a new document is created there.

### 2a. Install the Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2b. Install function dependencies

```bash
cd functions
npm install
```

### 2c. Set SMTP environment variables

The function reads SMTP credentials from environment variables set with the Firebase CLI.

```bash
firebase functions:config:set \
  mail.host="smtp.gmail.com" \
  mail.port="587" \
  mail.user="your@gmail.com" \
  mail.pass="your-app-password" \
  mail.owner="contact@tituspaine.com"
```

> **Gmail tip:** Use a [Google App Password](https://myaccount.google.com/apppasswords) — not your regular Gmail password.  
> **Other providers:** Set `mail.host` and `mail.port` for Outlook, Zoho, etc.

For the **2nd-gen Functions** (`firebase-functions` v5), secrets are stored differently — use Firebase Secret Manager:

```bash
firebase functions:secrets:set MAIL_HOST
firebase functions:secrets:set MAIL_PORT
firebase functions:secrets:set MAIL_USER
firebase functions:secrets:set MAIL_PASS
firebase functions:secrets:set MAIL_OWNER
```

Then grant the function access to each secret in the Firebase console under **Functions → Secrets**.

### 2d. Deploy the function

```bash
firebase deploy --only functions
```

After deployment, the `processEmailQueue` function will automatically trigger whenever a new document is added to `emailQueue` in Firestore and send the appropriate emails.

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

## How Email Sending Works

1. User books/cancels/reschedules an appointment in the browser.
2. The browser writes a document to the `emailQueue` Firestore collection with status `"pending"`.
3. The Firebase Cloud Function `processEmailQueue` is triggered automatically.
4. The function sends emails via SMTP using Nodemailer.
5. The function updates the document status to `"sent"` (or `"error"` on failure).

No email credentials are ever in the browser or in `index.html`.

---

## Free Tier Notes

| Service | Free Tier |
|---------|-----------|
| GitHub Pages | Unlimited static hosting |
| Firebase Firestore | 50K reads/day, 20K writes/day, 1GB storage |
| Firebase Functions | 2M invocations/month, 400K GB-seconds compute (Blaze plan required but very low cost) |
| Gmail SMTP | Free with App Password (500 emails/day limit) |

