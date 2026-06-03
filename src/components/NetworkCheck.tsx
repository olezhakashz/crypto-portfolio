// NetworkCheck.tsx
// Monitors internet connectivity and shows a red "offline" banner at the top
// of the screen when the device loses its connection. Render this component
// once in the app shell — it positions itself absolutely over other content.

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// NetInfo provides a cross-platform API to detect network connectivity changes
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../theme/theme';

export default function NetworkCheck() {
  // Tri-state: true = online, false = offline, null = unknown (initial load).
  // Defaulting to true avoids flashing the banner before NetInfo reports in.
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  // Subscribe to connectivity changes when the component mounts.
  // NetInfo fires the callback immediately with the current state, then again
  // on every subsequent change. We clean up the listener on unmount.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Only show the banner when we're definitively offline (false).
  // If connected or unknown (null), render nothing.
  if (isConnected !== false) return null;

  return (
    // pointerEvents="none" lets touches pass through so the banner doesn't block taps
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>No internet connection. Showing cached data.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Absolutely positioned at the top, overlaying the rest of the UI
  container: {
    backgroundColor: theme.color.danger,
    paddingTop: 50, // Extra top padding to clear the status bar / notch
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000, // Ensure the banner sits above all other content
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
