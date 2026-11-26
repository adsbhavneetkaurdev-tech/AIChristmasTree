# Wish Tree: live, interactive holiday wish tree

Guests scan a QR code, send a wish from their phone, and watch it fly onto a glowing, animated tree on the big screen. Everything for a customer's event (name, greeting, logos, sponsor gifts, colours, moderation) lives in **one file: `config.json`**.

| Page | Who it's for |
|---|---|
| `/` | Guests: the wish form (opened from the QR code) |
| `/display` | The projector or TV (16:9, fullscreen) |
| `/admin` | The host: approve or reject wishes, reset (password-protected) |
| `/qr` | A printable QR card for tables |

---

## One-time setup (do this once, then reuse it for every customer)

1. **Supabase:** create a free project at [supabase.com](https://supabase.com). Open **SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
   One Supabase project can serve **all** your customers: every wish is stored with its event ID, and each event only ever sees its own wishes.
2. Copy the three values from **Project Settings → API**: the Project URL, the anon/publishable key, and the service_role/secret key.

---

## New customer event, in under 10 minutes

### 1. Edit `config.json` (3 min)
```json
{
  "eventId": "smith-holiday-2026",
  "eventName": "Happy Holidays from the Smith Family",
  "greeting": "Every wish makes the tree shine brighter.",
  "eyebrow": "December 2026",
  "hostLogo": { "src": "/brand/host-logo.png", "alt": "Smith Family", "label": "Hosted by" },
  "gifts": [
    { "logo": "/brand/sponsor-1.png", "name": "Sponsor One" },
    { "logo": "/brand/sponsor-2.png", "name": "Sponsor Two" }
  ],
  "theme": { "preset": "classic" },
  "form": { "prompt": "What is your holiday wish?", "maxLength": 140 },
  "moderation": { "requireApproval": true, "profanityFilter": true },
  "showPoweredBy": false
}
```
- **`eventId` must be unique per event:** lowercase letters, numbers and dashes, e.g. `acme-gala-2026`.
- Anything you leave out falls back to a sensible default. The full list is in the reference table below.

### 2. Add logos (2 min)
Put the files in **`public/brand/`** and reference them as `/brand/<file>`, as in the example above.
- **Host logo:** optional. It's shown at the top of the guest form.
- **Gifts:** 0–6 sponsor or partner logos, one per wrapped present under the tree. Use `[]` for plain decorative presents.
- Any image works. Dark logos automatically get a light label, white logos a dark one, and the whole logo is always shown (never cropped).

### 3. Deploy (4 min)
1. Upload the project to a **new GitHub repository**: **Add file → Upload files**, then drag in everything inside the project folder.
2. In **Vercel**, go to **Add New → Project**, import the repository, and add these **Environment Variables**:

| Key | Type | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Config | `https://xxxx.supabase.co` (nothing after `.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Config | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | service_role / secret key |
| `ADMIN_PASSWORD` | Secret | the host's admin password |
| `ADMIN_SESSION_SECRET` | Secret | any long random string |

3. Click **Deploy**. Add these variables by hand; don't use Vercel's "Connect Supabase" integration.

### 4. Share (1 min)
- Send the host `https://<project>.vercel.app/admin` and their password.
- Open `/display` on the projector and press **F**. The QR code on screen links to the guest page automatically.
- Print `/qr` for the tables.

**Check it worked:** `/api/wishes` shows `{"wishes":[],…}`, and `/admin` shows **Live** with a **Supabase** badge.

---

## Selling it: demo mode
Open **`/display?demo=true`**. The tree fills with sample wishes and new ones keep flying in every few seconds, so you can show it to potential buyers with no audience. Nothing is saved, and it works without a database.

## Display controls
| Key | Action |
|---|---|
| **F** | Fullscreen |
| **Q** | Show / hide the QR code |
| **T** | Show / hide the on-screen text (wishes and title) |
| **C** | Projection calibration (drag the corners onto your surface) |

URL options: `?qr=0` or `?qr=1`, `?cards=0` (start with text hidden), `?bg=black` (pure black, for projecting onto real objects), `?quality=medium` (older computers).

## For the host (`/admin`)
- **Approve / reject / delete** wishes. The **Auto-approve** switch sends wishes straight to the tree; its starting value comes from `moderation.requireApproval`.
- **Reset display:** clears the tree. Wishes are archived and can be restored.
- **Reset wishes:** permanently deletes **all** wishes for this event, for example after a rehearsal. It asks the host to type the event ID, and other events are never touched.

---

## `config.json` reference
| Setting | Default | What it does |
|---|---|---|
| `eventId` | `"default"` | Keeps this event's wishes separate. Unique per event. Can be overridden with the env var `NEXT_PUBLIC_EVENT_ID` |
| `eventName` | `"The Christmas Wish Tree"` | Title on the display, guest page, QR card and browser tab |
| `greeting` | `"Every wish makes the tree shine brighter."` | Subtitle under the title |
| `eyebrow` | `""` | Small line above the title on the guest page, e.g. `"Happy Holidays"` |
| `hostLogo` | `null` | `{ "src", "alt", "label" }`. Optional logo on the wish form; `label` defaults to `"Hosted by"` |
| `gifts` | `[]` | Up to 6 `{ "logo", "name" }`. An empty list shows decorative presents |
| `theme.preset` | `"classic"` | `classic` (red/gold) · `elegant` (gold/white) · `winter` (silver/ice blue) · `custom` |
| `theme.custom` | – | With `"custom"`: `{ "accent", "secondary", "background", "text" }` as hex colours |
| `form.prompt` | `"What is your Christmas wish?"` | The question on the form |
| `form.placeholder`, `form.namePrompt`, `form.buttonText` | – | Other form wording |
| `form.maxLength` | `140` | Character limit for a wish (20–500) |
| `moderation.requireApproval` | `true` | `true`: the host approves each wish. `false`: wishes go straight to the tree |
| `moderation.profanityFilter` | `true` | Blocks offensive words, including disguised ones like "f*ck" |
| `display.showQr` | `true` | QR code visible when the display opens (Q still toggles it) |
| `display.qrLabel` | `["Scan to add", "your Christmas wish"]` | Text beside the QR code |
| `guestUrl` | `""` | Custom guest address for the QR code; leave empty to use the site's own address |
| `showPoweredBy` | `false` | `true` shows the "Created by Morus AI" credit, e.g. for discounted or free versions |

## Good to know
- **Changing `config.json` needs a redeploy.** On GitHub, editing the file triggers it automatically.
- **One deployment = one event.** To run several events at once, deploy the same repository several times, each with its own `NEXT_PUBLIC_EVENT_ID`.
- **Local preview:** `npm install`, `cp .env.example .env.local`, set `ADMIN_PASSWORD`, then `npm run dev`. Without Supabase keys, wishes are saved to a local file.
- **Upgrading an older install:** run `supabase/schema.sql` again. Existing wishes are kept under the event ID `default`.
- **Supabase free projects pause after about a week of inactivity.** Open the site or the dashboard before each event.
