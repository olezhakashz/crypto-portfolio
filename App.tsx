import { useEffect } from 'react';
import Constants from 'expo-constants';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { ToastProvider } from './src/components/Toast';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import NetworkCheck from './src/components/NetworkCheck';

// executionEnvironment === 'storeClient' means running inside Expo Go.
// expo-notifications' setNotificationHandler triggers push infrastructure in SDK 53+,
// which crashes in Expo Go. Use conditional require to skip entirely.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

if (!IS_EXPO_GO) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export default function App() {
  useEffect(() => {
    void useSettingsStore.getState().load();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <View style={{ flex: 1 }}>
            <NetworkCheck />
            <ToastProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </ToastProvider>
          </View>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
