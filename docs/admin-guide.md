# Edgeway Admin — user guide

Everything the client needs day to day. No technical knowledge required.

---

## 1. Signing in

1. Open **edgewaysecurity.com/admin**
2. Email + password (created for you in Supabase → Authentication → Users).
3. On a phone, install the app first (section 5) — it opens full-screen and can notify you.

Forgot the password? Use “reset password” on the sign-in screen, or ask your developer to
re-send an invite.

---

## 2. Handling quote requests

The **Inquiries** tab is the inbox. It updates itself — no refresh needed.

* **Yellow dots / “Unread”** — a request nobody has opened yet. The number also shows in the
  browser tab title (`(3) Edgeway Admin`) and in the sidebar badge.
* **Open a request** → full details, the customer's message, and buttons for **Call**,
  **WhatsApp**, **Email** and “copy phone”.
* **Status** — keep each lead honest:
  | Status | Meaning |
  |---|---|
  | New | Just arrived, nobody has replied |
  | Contacted | You spoke / replied, waiting on them |
  | Quoted | A price has been sent |
  | Won | They signed |
  | Lost | Went elsewhere / no answer |
  | Spam | Bot junk — hidden from the overview counts |
* **Notes** — write down what was agreed (“Called 4pm, quoted 2 posts × 12h”). The next person
  who opens the lead sees it.
* **Search** by name, phone, site type or message text.
* **CSV** downloads whatever the current filter shows — perfect for a monthly report or for
  moving data into a spreadsheet.
* **Delete** is permanent; the button asks for confirmation.

### A new request arrives — what happens automatically

1. It is saved in the database (never lost, even if you are asleep).
2. A **push notification** lands on every registered phone/laptop.
3. The dashboard row appears instantly with a toast.
4. If email alerts are configured, a copy goes to the notification inbox.

---

## 3. Changing images on the website

**Images** tab → pick a slot → **Replace**.

Slots:

| Slot | Where it appears |
|---|---|
| Home hero | Big photo under the headline on the home page |
| Security guards | Home “Guards” tab + Services page |
| Cameras | Home “Cameras” tab + Services + Industries |
| Vehicle patrol | Home “Vehicle patrol” tab + Services |
| Dispatch band | Dark section on the home page |
| Control room | Dark section on the Services page |
| Night patrol | Industries hero + the closing CTA band on every page |
| Logo crest | Header/footer logo |

How it works:

* Upload a JPG, PNG, WebP or AVIF up to 12 MB. Landscape photos work best for banners; the logo
  should be a portrait/square PNG with a transparent background.
* The system automatically creates the two sizes the website uses (1200 px and 2400 px, WebP) —
  no resizing needed on your side. Pages stay fast.
* **Alt text** describes the picture for screen readers and Google. Please keep it descriptive.
* Press **Save & publish** → the change is live on the next page load. No developer, no deploy.
* **Reset** puts the original bundled photo back.
* **Previous versions** lets you roll back to an earlier upload.

Tip: keep the subject roughly centred — very wide banners get cropped on phones.

---

## 4. Notifications (push)

**Notifications** tab:

1. Press the switch for **This device**.
2. Allow the browser prompt.
3. Press **Send test notification** — you should see it appear instantly.

Each device is registered separately (phone, laptop, tablet). Remove a lost phone with the bin icon.

**iPhone / iPad:** Apple only allows web push for sites installed to the home screen:

> Safari → Share → **Add to Home Screen** → open the new **Edgeway** icon → enable notifications
> inside the app.

**Android / Windows / Mac:** works in Chrome, Edge, Firefox and Safari as soon as permission is
granted.

If you block the prompt by accident, open the browser's site settings for edgewaysecurity.com
and set Notifications back to “Allow”, then press **Re-register this device**.

---

## 5. Installing the app (PWA)

* **iPhone/iPad:** Safari → Share → Add to Home Screen.
* **Android:** Chrome menu → Install app (or the install icon in the address bar).
* **Desktop:** install icon in the address bar → Install.

The app opens full-screen, keeps working offline (last synced inbox, cached pages), and can send
push notifications.

---

## 6. Settings

**Settings** holds the business contact details shown on the site (phone, email, street address,
PPO number) and the email address that should receive lead alerts. **Export** downloads a JSON
backup of every inquiry.

> The street address in the original design was a placeholder — fill it in here before go-live.

---

## 7. Do / don't

* ✅ Keep statuses up to date — the overview numbers are how you see what still needs a reply.
* ✅ Add a note after every call.
* ✅ Check spam before deleting real leads.
* ❌ Don't upload a 15 MB phone photo straight from the camera roll — anything under 12 MB is
  fine, but screenshots and web-sized images are quickest.
* ❌ Don't share the admin login; add a separate account for each person instead.

---

## 8. If something looks wrong

| Symptom | Fix |
|---|---|
| No notification on my phone | Install to home screen (iOS), check permission, “Re-register this device”, “Send test” |
| Image uploaded but the site looks the same | Hard-refresh the page (Ctrl/Cmd + Shift + R). If it's still old after a minute, the CDN cache is catching up |
| “Too many requests” on the contact form | Spam protection — 5 submissions per email per minute |
| Offline badge / stale inbox | The dashboard keeps the last synced list; reconnect and it refreshes itself |
| Can't sign in | Password reset from the login screen, or ask for a new invite |

---

## Deleting inquiries (permanent)

You can delete a request in three ways — all of them remove the row from the database for good,
so use them when a lead is a test, a duplicate or spam.

1. **Single, from the list** — the small bin icon on the right of a row → confirm with
   **Yes, delete**.
2. **Single, from the detail page** — open the request → *Danger zone* → **Delete this inquiry** →
   **Yes, delete permanently**.
3. **Many at once** — tick the boxes of the rows you want (or **Select all** under the toolbar),
   then press **Delete N** in the toolbar and confirm.

Every deletion shows a short confirmation bar first ("This removes it from the database. It cannot
be undone."), and notes attached to that request are deleted with it. A toast confirms
"All inquiries deleted / Inquiry deleted". If the delete fails (no connection, session expired) the
row comes back immediately and an error toast explains why — nothing is lost silently.

Prefer keeping the record? Change its status to **Spam** or **Lost** instead; the stats and filters
still work and the row stays out of the way.
