// App.tsx
// This is the ENTRY POINT of the entire application — the first thing React Native runs.
// It wraps all screens in several "providers" that make global features available
// throughout the app (navigation, gesture handling, safe areas, toasts, error catching).
//
// Think of this file as the outermost shell — every screen lives inside it.

import { useEffect } from 'react';
import Constants from 'expo-constants';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';    // Required wrapper for all navigation to work
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Required for swipe gestures to work
import { SafeAreaProvider } from 'react-native-safe-area-context';      // Prevents content from going under the notch/status bar
import RootNavigator from './src/navigation/RootNavigator'; // Our top-level screen router
import { useSettingsStore } from './src/store/settingsStore'; // Global settings state
import { ToastProvider } from './src/components/Toast';        // Makes toast notifications available everywhere
import { ErrorBoundary } from './src/components/ErrorBoundary'; // Catches unexpected crashes so the app doesn't white-screen
import NetworkCheck from './src/components/NetworkCheck';       // Shows an offline banner when internet is lost

// ── Expo Go Guard ──────────────────────────────────────────────────────────────
// Expo Go is the app used for testing — it doesn't support push notifications.
// 'storeClient' is the internal name Expo uses for the Expo Go app.
// We check this BEFORE importing expo-notifications to avoid a crash.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

if (!IS_EXPO_GO) {
  // Only set up the notification handler when running as a real build (not Expo Go)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  // This tells the OS what to do when a notification arrives while the app is open
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,  // Show the notification banner at the top of the screen
      shouldShowList: true,    // Show it in the notification center
      shouldPlaySound: false,  // Don't play a sound
      shouldSetBadge: false,   // Don't update the app icon badge number
    }),
  });
}

// The main App component — React Native renders this automatically
export default function App() {
  // When the app first opens, load the user's saved settings (currency, refresh rate, etc.)
  useEffect(() => {
    void useSettingsStore.getState().load(); // Load settings from AsyncStorage on startup
  }, []); // Empty array = run only once, when the component first mounts

  return (
    // GestureHandlerRootView: Required outermost wrapper for any swipe/gesture features to work
    <GestureHandlerRootView style={{ flex: 1 }}>

      {/* SafeAreaProvider: Automatically adds padding around the status bar and bottom navigation bar */}
      <SafeAreaProvider>

        {/* ErrorBoundary: If any child component crashes, this catches the error and shows a friendly message instead */}
        <ErrorBoundary>
          <View style={{ flex: 1 }}>

            {/* NetworkCheck: Watches the internet connection and shows a banner when offline */}
            <NetworkCheck />

            {/* ToastProvider: Makes it possible for any screen to show a toast popup message */}
            <ToastProvider>

              {/* NavigationContainer: Required wrapper for React Navigation to work */}
              <NavigationContainer>

                {/* RootNavigator: The actual screen router — decides which screen to show */}
                <RootNavigator />

              </NavigationContainer>
            </ToastProvider>
          </View>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
