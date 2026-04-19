# Habit Task Manager (React Native + Expo)

A cross-platform mobile app (iOS + Android) for creating **habits** and **tasks** with a slick UI.

## Features

- Create and manage habits and one-off tasks.
- Mark tasks/habits complete for the current day.
- Local persistence with AsyncStorage.
- Background reminder notifications for unfinished items.
- Manual "Check now" action to trigger immediate reminders.
- Polished gradient card-based UI.
- **No backend required**: core app functionality runs fully on-device.

## Tech Stack

- Expo + React Native + TypeScript
- `expo-notifications` for reminders
- `@react-native-async-storage/async-storage` for local data

## 1) Pull the repo to your computer

Run these commands in Terminal (Mac/Linux) or PowerShell (Windows with Git installed):

```bash
git clone <your-github-repo-url>
cd habit_task_manager
```

If you already cloned it and just want the latest changes:

```bash
git pull origin <your-branch>
```

## 2) Install tooling once

```bash
npm install -g eas-cli
npm install
```

Then log in to Expo:

```bash
eas login
```

## 3) Run locally on your own phone (no app store yet)

```bash
npx expo start
```

- Install **Expo Go** on iPhone/Android.
- Scan the QR code from the terminal/browser.
- The app will run on your phone.

## 4) Build store-ready apps (downloadable binaries)

### iOS (App Store build)

```bash
eas build --platform ios --profile production
```

This creates an `.ipa` in Expo's build system.

### Android (Play Store build)

```bash
eas build --platform android --profile production
```

This creates an `.aab` for Google Play.

## 5) Publish to stores

### Apple App Store

1. Join Apple Developer Program.
2. Create app record in App Store Connect.
3. Build iOS app with EAS (command above).
4. Submit:

```bash
eas submit --platform ios --latest
```

5. Complete screenshots, metadata, privacy labels in App Store Connect.
6. Send for Review.

### Google Play Store

1. Create Google Play Console account.
2. Create app listing.
3. Build Android AAB with EAS.
4. Submit:

```bash
eas submit --platform android --latest
```

5. Complete store listing/content rating.
6. Roll out to production.

## Offline behavior (important for your requirement)

This app is designed so the core experience works without internet:

- All habits/tasks are stored locally on the device via AsyncStorage.
- Notifications are local scheduled notifications.
- No backend/API calls are used by the app.
- OTA update checks are disabled in `app.json` so runtime use does not depend on update servers.

What this means for users:

- They can create/update/complete habits and tasks fully offline.
- They do **not** need an internet connection for day-to-day app usage.
- Internet is only needed for downloading/installing the app from the store and for any future app updates.

## Reminder behavior

- The app schedules recurring local notifications every 4 hours between 8 AM and 8 PM.
- Notifications only include items not marked done for **today**.
- A final evening summary reminder fires at 9 PM if items are still incomplete.
