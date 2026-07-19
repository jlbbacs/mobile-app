# Deploying the Google Apps Script Backend

This is a one-time setup done entirely in your browser with your own Google
account — nothing here can be automated on your behalf, since it requires
your personal Google authorization.

## 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet.
2. Name it something like **"Personal Registrations"**.
3. Keep this tab open — you'll deploy the script from inside it, which lets
   the backend write to it without any extra configuration.

## 2. Add the Apps Script code

1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete the placeholder `Code.gs` content.
3. Copy the entire contents of [`/apps-script/Code.gs`](../apps-script/Code.gs)
   from this repo and paste it in.
4. Click the **Save** icon (or `Ctrl+S`).

The script will automatically create a `Registrations` sheet tab with the
correct headers the first time it receives a submission, and a
**"Personal Registrations"** folder in your Google Drive the first time it
uploads a photo.

## 3. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Fill in:
   - **Description**: `Personal Info Collection App`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` (required so the mobile app can reach it —
     see "Security hardening" below for how to still lock this down)
4. Click **Deploy**.
5. Google will ask you to **authorize** the script the first time — approve
   the Drive and Sheets permissions it requests (these are your own
   permissions being granted to your own script, not shared with anyone
   else).
6. Copy the **Web app URL** it gives you — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   This is the value you'll paste into the app's **Settings → Google Apps
   Script API Endpoint** field (or `EXPO_PUBLIC_API_ENDPOINT`).

## 4. Re-deploying after you edit Code.gs

Apps Script Web App URLs are pinned to a specific deployment version. If you
change `Code.gs` later:

1. **Deploy → Manage deployments**.
2. Click the pencil (edit) icon on your existing deployment.
3. Under **Version**, choose **New version**.
4. Click **Deploy**.

This keeps the same URL, so you don't need to update the app's Settings
again.

## Security hardening

By default, "Who has access: Anyone" means anyone with the URL can POST to
your script. The URL itself is long and unguessable, which is the baseline
protection Apps Script Web Apps rely on — but for extra hardening:

1. In the Apps Script editor, go to **Project Settings → Script Properties**.
2. Add a property named `API_TOKEN` with a long random value you generate
   yourself.
3. The deployed script will now reject any request whose JSON body doesn't
   include a matching `"apiKey"` field.
4. Set the same value as `EXPO_PUBLIC_API_TOKEN` in your `.env` (see
   `docs/ENVIRONMENT_VARIABLES.md`) — the app already attaches it to every
   submission automatically when present, no code changes needed.

You can also restrict the **Google Drive Folder ID** and **Sheet URL** the
script writes to via Script Properties (`DRIVE_FOLDER_ID`, `SHEET_URL`)
instead of relying on the default "active spreadsheet" / "folder by name"
lookup — useful if you want the backend pinned to specific, pre-shared
resources.

## Testing the deployment directly

```bash
curl -X POST "<your-web-app-url>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "age": "30",
    "phoneNumber": "09171234567",
    "imageBase64": "'"$(base64 -w0 some-small-test.jpg)"'",
    "imageFileName": "test.jpg",
    "imageMimeType": "image/jpeg"
  }'
```

A successful response looks like:

```json
{ "success": true, "imageUrl": "https://drive.google.com/uc?id=...", "message": "Registration saved successfully." }
```
