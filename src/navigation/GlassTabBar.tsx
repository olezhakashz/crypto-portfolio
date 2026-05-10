import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

const TAB_ICONS: Record<string, string> = {
  Market: '📈',
  Portfolio: '💎',
  Settings: '⚙️',
};

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = descriptors[route.key]?.options?.title ?? route.name;
          const icon = TAB_ICONS[route.name] ?? '●';

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name as never)}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              {/* Active indicator line */}
              <View style={[styles.indicator, isFocused && styles.indicatorActive]} />

              <Text style={[styles.icon, isFocused && styles.iconActive]}>{icon}</Text>
              <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 8,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,10,20,0.92)',
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },

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

  indicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: theme.radius.full,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: theme.color.primaryLight,
  },

  icon: {
    fontSize: 20,
    opacity: 0.45,
  },
  iconActive: {
    opacity: 1,
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
