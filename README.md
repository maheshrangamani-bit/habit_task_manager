# Habit Task Manager (React Native + Expo)

A cross-platform mobile app (iOS + Android) for creating **habits** and **tasks** with a slick UI.

## Features

- Create and manage habits and one-off tasks.
- Mark tasks/habits complete for the current day.
- Local persistence with AsyncStorage.
- Background reminder notifications for unfinished items.
- Manual "Check now" action to trigger immediate reminders.
- Polished gradient card-based UI.

## Tech Stack

- Expo + React Native + TypeScript
- `expo-notifications` for reminders
- `@react-native-async-storage/async-storage` for local data

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npx expo start
   ```
3. Build downloadable binaries:
   - iOS: `eas build --platform ios`
   - Android: `eas build --platform android`

## Reminder behavior

- The app schedules recurring local notifications every 4 hours between 8 AM and 8 PM.
- Notifications only include items not marked done for **today**.
- A final evening summary reminder fires at 9 PM if items are still incomplete.

