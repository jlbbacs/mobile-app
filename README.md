# RCPOS App

A React Native (Expo) mobile app for collecting personal registration data
with a photo, storing the photo in Google Drive, and appending the record to
a Google Sheet — all through a Google Apps Script backend. Every
registration gets a unique Registration ID and a QR code that can be
scanned later to pull up the full profile.

## Flow

```
Splash → Home → Registration Form (fields + photo) → Submit
  → Upload image to Google Drive → Generate Registration ID + QR code
  → Insert row into Google Sheet → Success screen (QR displayed)

Scan QR (or search) → Lookup by Registration ID → Profile page
  → Edit (admin) / Print QR / Print CR80 ID card / Share
```

If there's no connection at submit time, the registration is saved on-device
and uploaded automatically the next time the app detects connectivity — no
user interaction required. Scanned IDs are also kept in a local history so a
profile can be fetched once the connection returns.

## QR code system

- Every registration receives a sequential **Registration ID**
  (`REG-YYYYMMDD-NNNNNN`).
- The QR code contains **only the Registration ID** — never any personal
  information.
- QR PNGs are stored automatically in a **"QR Codes"** Drive folder; the
  URL is written to the sheet next to the record.
- The **Scan** screen reads QR codes with the camera (with flashlight
  toggle and scan history); a manual-entry field covers the web build,
  where live camera scanning isn't available.
- Scanning (or searching by ID/name/phone/email) opens the **Profile**
  page, with buttons for editing (admin-gated), downloading/printing/
  sharing the QR, and printing a CR80-sized ID card (landscape or
  portrait; print-to-PDF gives the exportable PDF card).

## Tech stack

- React Native + Expo (TypeScript)
- React Navigation (native-stack)
- React Hook Form + Yup validation
- expo-image-picker (camera + gallery capture) / expo-image-manipulator (compression, cross-platform base64 output)
- expo-camera (QR scanning) / expo-print (QR + ID card printing)
- AsyncStorage-backed offline queue + NetInfo-triggered background sync
- Backend: Google Apps Script (Sheets API + Drive API), see `/apps-script`

## Project structure

```
/src
  /components   Reusable UI (Button, Input, Dropdown, ImagePickerField, ...)
  /screens      Splash, Home, RegistrationForm, Success, Scan, Search,
                Profile, EditRegistration, Settings, Admin
  /services     imageService, registrationService, qrService, storageService,
                syncService, deviceInfoService, validationService
  /hooks        useNetworkStatus, useOfflineQueue
  /context      ThemeContext (light/dark), SettingsContext
  /navigation   RootNavigator (typed stack)
  /constants    theme.ts, config.ts, env.ts
  /types        registration.ts, navigation.ts, settings.ts
  /utils        errorMessages.ts, exportCsv.ts
/apps-script    Code.gs — the Google Apps Script backend (action-based API)
/docs           Installation, deployment, environment variable guides
```

The backend is a single action-based endpoint (`register`, `lookup`,
`search`, `update`, `stats`, `list`), so future capabilities — accounts,
attendance, NFC, a different database — slot in as new actions or a
swapped-out service layer without touching the screens.

## Getting started

See **[docs/INSTALLATION.md](docs/INSTALLATION.md)** for local setup and
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for deploying the Google Apps
Script backend (this is a one-time, ~10 minute manual step in your Google
account — it can't be automated from outside your account). If you deployed
the pre-QR version, follow the
[v1 → v2 upgrade notes](docs/DEPLOYMENT.md#upgrading-from-v1-to-v2-qr-code-system).

Quick start once the backend is deployed:

```bash
npm install
npm start
```

Then set the Apps Script Web App URL in the app's **Settings** screen (or via
`EXPO_PUBLIC_API_ENDPOINT`, see [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)).

## Admin

The password-gated Admin screen (default password `admin123` — change it in
**Settings → Admin** before shipping) shows a live dashboard (total
registered, today's registrations, sex breakdown, average age, recent
registrations), device sync status, and a CSV export of all records.
Editing a record from the Profile page requires the same admin password.

## Security notes

- QR codes never contain personal data — only the Registration ID; all
  personal information stays in the Google Sheet, resolved server-side.
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#security-hardening) for the
  optional shared-secret token on the Apps Script endpoint (it covers every
  API action, including lookups).
- No Google API keys are ever embedded in the app — the Apps Script Web App
  handles all Drive/Sheets access using your Google account's own
  authorization.
