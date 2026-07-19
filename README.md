# Personal Information Collection App

A React Native (Expo) mobile app for collecting personal registration data
with a photo, storing the photo in Google Drive, and appending the record to
a Google Sheet — all through a Google Apps Script backend.

## Flow

```
Splash → Home → Registration Form (fields + photo) → Submit
  → Upload image to Google Drive → Insert row into Google Sheet
  → Success screen
```

If there's no connection at submit time, the registration is saved on-device
and uploaded automatically the next time the app detects connectivity — no
user interaction required.

## Tech stack

- React Native + Expo (TypeScript)
- React Navigation (native-stack)
- React Hook Form + Yup validation
- expo-camera / expo-image-picker / expo-image-manipulator / expo-file-system
- expo-location for optional GPS capture
- AsyncStorage-backed offline queue + NetInfo-triggered background sync
- Backend: Google Apps Script (Sheets API + Drive API), see `/apps-script`

## Project structure

```
/src
  /components   Reusable UI (Button, Input, Dropdown, ImagePickerField, ...)
  /screens      Splash, Home, RegistrationForm, Success, Settings, Admin
  /services     imageService, locationService, registrationService,
                storageService, syncService, deviceInfoService, validationService
  /hooks        useNetworkStatus, useOfflineQueue
  /context      ThemeContext (light/dark), SettingsContext
  /navigation   RootNavigator (typed stack)
  /constants    theme.ts, config.ts, env.ts
  /types        registration.ts, navigation.ts, settings.ts
/apps-script    Code.gs — the Google Apps Script backend
/docs           Installation, deployment, environment variable guides
```

## Getting started

See **[docs/INSTALLATION.md](docs/INSTALLATION.md)** for local setup and
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for deploying the Google Apps
Script backend (this is a one-time, ~10 minute manual step in your Google
account — it can't be automated from outside your account).

Quick start once the backend is deployed:

```bash
npm install
npm start
```

Then set the Apps Script Web App URL in the app's **Settings** screen (or via
`EXPO_PUBLIC_API_ENDPOINT`, see [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)).

## Admin screen

A basic password-gated screen (default password `admin123`, change it in
`src/constants/config.ts` before shipping) shows submission count, last
upload time, and pending/failed offline-queue items with a manual retry
button.

## Security notes

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#security-hardening) for how to
add an optional shared-secret token to the Apps Script endpoint. No Google
API keys are ever embedded in the app — the Apps Script Web App handles all
Drive/Sheets access using your Google account's own authorization.
