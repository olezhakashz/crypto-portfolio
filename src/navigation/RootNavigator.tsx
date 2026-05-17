// RootNavigator.tsx
// This is the TOP-LEVEL navigation structure of the app.
// Think of it like the main "router" — it decides which screen gets shown.
//
// There are two layers of navigation:
//   1. TabNavigator  → the 3-tab bottom bar (Market / Portfolio / Settings)
//   2. CoinDetails   → a full-screen detail page opened when you tap a coin
//
// The stack works like a pile of cards:
//   - Tabs screen is always on the bottom
//   - CoinDetails gets pushed ON TOP when you navigate to it
//   - The back button pops CoinDetails off to return to the tabs

import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Creates a stack (card-style) navigator
import type { RootStackParamList } from './types'; // TypeScript types listing all possible screen names

import TabNavigator from './TabNavigator';             // The 3-tab bottom navigation
import CoinDetailsScreen from '../screens/CoinDetailsScreen'; // The full-screen coin detail page
import { theme } from '../theme/theme'; // Our app's color palette

// Create a stack navigator typed with our screen list
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hide the default navigation header bar — we draw our own headers
        contentStyle: { backgroundColor: theme.color.bg }, // Set the background color for all screens
      }}
    >
      {/* The main tabs screen — shown by default when the app opens */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* The coin detail screen — pushed on top when user taps a coin in the Market list */}
      <Stack.Screen name="CoinDetails" component={CoinDetailsScreen} />
    </Stack.Navigator>
  );
}
