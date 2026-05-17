// TabNavigator.tsx
// This sets up the 3-tab bottom navigation bar of the app.
// Each tab shows a different screen when tapped.
//
// Tab order (left to right):
//   1. Market    → live list of top 50 cryptocurrencies
//   2. Portfolio → the user's personal coin collection
//   3. Settings  → currency, refresh rate, notifications

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Creates a bottom tab bar navigator
import type { TabsParamList } from './types'; // TypeScript list of valid tab names

import MarketScreen from '../screens/MarketScreen';       // Screen 1: live crypto prices
import PortfolioScreen from '../screens/PortfolioScreen'; // Screen 2: user's saved coins
import SettingsScreen from '../screens/SettingsScreen';   // Screen 3: app preferences
import { theme } from '../theme/theme';    // App color palette
import GlassTabBar from './GlassTabBar';  // Our custom-designed tab bar (glass/blur style)

// Create the tab navigator typed with our screen list
const Tab = createBottomTabNavigator<TabsParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />} // Use our custom glass tab bar instead of the default one
      screenOptions={{
        headerShown: false, // No header at the top of tab screens — we draw our own
        sceneStyle: { backgroundColor: theme.color.bg }, // Dark background for all tab screens
      }}
    >
      {/* Each Tab.Screen registers one tab — name must match the TabsParamList type */}
      <Tab.Screen name="Market" component={MarketScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
