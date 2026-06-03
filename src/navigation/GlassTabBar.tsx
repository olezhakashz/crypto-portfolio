// GlassTabBar.tsx
// Custom bottom tab bar with a dark, semi-transparent "glass" look.
// Passed to the <Tab.Navigator tabBar={...}> prop in the navigation config
// to replace React Navigation's default tab bar with our own design.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
// BottomTabBarProps gives us state, descriptors, and navigation —
// everything needed to render tabs and handle presses ourselves.
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

// Emoji icons mapped to route names — keeps icons in one place
const TAB_ICONS: Record<string, string> = {
  Market: '📈',
  Portfolio: '💎',
  Settings: '⚙️',
};

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // Respect the device's bottom safe area (home indicator on iPhones, nav bar on Android)
  const insets = useSafeAreaInsets();

  return (
    // Outer wrapper — floats the bar above the screen content with side margins
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Inner bar with the dark glass background */}
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          // Fall back to the route name if no custom title was set in screen options
          const label = descriptors[route.key]?.options?.title ?? route.name;
          // Look up the emoji; fall back to a bullet if the route name isn't mapped
          const icon = TAB_ICONS[route.name] ?? '●';

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name as never)}
              // Pressable style function gives us the `pressed` boolean for feedback
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              {/* Active indicator line */}
              <View style={[styles.indicator, isFocused && styles.indicatorActive]} />

              {/* Tab icon — dimmed when inactive, full opacity when focused */}
              <Text style={[styles.icon, isFocused && styles.iconActive]}>{icon}</Text>
              {/* Tab label — changes colour when focused */}
              <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Floating container — absolutely positioned so screen content scrolls behind it
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 8,
  },
  // The actual tab bar with a near-opaque dark background to create the "glass" effect
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,10,20,0.92)', // Dark translucent background
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },

  // Each tab takes equal space
  item: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  itemPressed: {
    opacity: 0.7,
  },

  // Thin line at the top of the active tab
  indicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: theme.radius.full,
    backgroundColor: 'transparent', // Hidden by default
  },
  indicatorActive: {
    backgroundColor: theme.color.primaryLight, // Coloured when the tab is focused
  },

  icon: {
    fontSize: 20,
    opacity: 0.45, // Dimmed when inactive
  },
  iconActive: {
    opacity: 1, // Full brightness when active
  },

  label: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.color.text3,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: theme.color.primaryLight,
    fontWeight: '800',
  },
});
