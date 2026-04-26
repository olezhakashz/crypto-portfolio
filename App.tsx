import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import * as Notifications from 'expo-notifications';
import { ToastProvider } from './src/components/Toast';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import NetworkCheck from './src/components/NetworkCheck';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // показывать баннер (Android/iOS где поддерживается)
    shouldShowList: true, // показывать в списке уведомлений
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    void useSettingsStore.getState().load();
  }, []);

  return (
    <ErrorBoundary>
      <NetworkCheck />
      <ToastProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ToastProvider>
    </ErrorBoundary>
  );
}
