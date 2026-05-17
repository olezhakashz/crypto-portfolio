// env.ts
// A small utility that tells the rest of the app whether it is running inside
// Expo Go (the testing app) or a real standalone build.
//
// WHY THIS MATTERS:
// Expo Go is a sandboxed environment — it does NOT support push notifications
// since SDK 53. If we try to use expo-notifications in Expo Go, the app crashes.
// So we check at runtime and skip notification code when inside Expo Go.

import Constants from 'expo-constants'; // expo-constants gives info about the current runtime environment

/**
 * IS_EXPO_GO = true  → the app is running inside the Expo Go app (used for development/testing)
 * IS_EXPO_GO = false → the app is a real build installed directly on the device
 *
 * 'storeClient' is the internal name Expo uses for the Expo Go app.
 */
export const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
