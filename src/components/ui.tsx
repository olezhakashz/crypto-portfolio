// ui.tsx
// Shared UI primitives used across the entire app.
// Every visual building block — cards, buttons, pills, badges, etc. — lives here
// so screens can import one file and stay visually consistent.

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type PressableProps,
} from 'react-native';
// SafeAreaView / useSafeAreaInsets account for notches, status bars, and home indicators
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

// ─── Screen ──────────────────────────────────────────────────────────────────
// Full-screen wrapper that fills the background and respects device safe areas.
// Every top-level screen in the app should be wrapped in <Screen>.
export function Screen({
  children,
  style,
  noHorizontalPad,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  noHorizontalPad?: boolean;
}) {
  // Insets give us the exact pixel offsets for the notch, status bar, etc.
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          // Use whichever is larger: the device inset or our design-system spacing
          paddingTop: Math.max(insets.top, theme.space.lg),
          paddingBottom: Math.max(insets.bottom, theme.space.lg),
          // Some screens (e.g. lists) manage their own horizontal padding
          paddingHorizontal: noHorizontalPad ? 0 : theme.space.lg,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// A rounded container with a dark surface background and subtle border.
// Pass `glow` to add a coloured border + shadow for emphasis (e.g. portfolio value card).
export function Card({
  children,
  style,
  glow,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: 'primary' | 'success' | 'danger';
}) {
  // Map the glow variant name to the matching theme colour
  const glowColor =
    glow === 'primary'
      ? theme.color.primaryGlow
      : glow === 'success'
        ? theme.color.successGlow
        : glow === 'danger'
          ? theme.color.dangerGlow
          : undefined;

  return (
    <View
      style={[
        styles.card,
        // When a glow colour is set, apply a matching border + platform shadow
        glowColor
          ? { borderColor: glowColor, shadowColor: glowColor, shadowOpacity: 0.9, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8 }
          : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Title ────────────────────────────────────────────────────────────────────
// Large, bold heading text — used for screen titles and section headers.
export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

// ─── Subtle ───────────────────────────────────────────────────────────────────
// Small, muted secondary text — typically placed right below a Title for context.
export function Subtle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.subtle, style]}>{children}</Text>;
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
// A compact label + value chip, used for stats like "24h Volume" or "Market Cap".
// Set `accent` to true to highlight with the primary colour scheme.
export function Pill({
  label,
  value,
  style,
  accent,
}: {
  label: string;
  value: string;
  style?: ViewStyle;
  accent?: boolean;
}) {
  return (
    <View style={[styles.pill, accent && styles.pillAccent, style]}>
      {/* Upper label in small caps (e.g. "RANK") */}
      <Text style={styles.pillLabel}>{label}</Text>
      {/* Main value below (e.g. "#4") */}
      <Text style={[styles.pillValue, accent && styles.pillValueAccent]}>{value}</Text>
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
// A circular rank indicator. Coins ranked in the top 3 get a gold style.
export function Badge({ n }: { n: number }) {
  const isTop3 = n <= 3;
  return (
    <View style={[styles.badge, isTop3 && styles.badgeGold]}>
      <Text style={[styles.badgeText, isTop3 && styles.badgeTextGold]}>{n}</Text>
    </View>
  );
}

// ─── ChangePill ───────────────────────────────────────────────────────────────
// Shows a percentage change with colour coding: green for gains, red for losses.
// Displays a neutral "—" dash when data is unavailable (null / undefined).
export function ChangePill({ value }: { value: number | null | undefined }) {
  // Handle missing data — show a neutral placeholder instead of crashing
  if (value === null || value === undefined) {
    return (
      <View style={styles.changePillNeutral}>
        <Text style={styles.changePillTextNeutral}>—</Text>
      </View>
    );
  }
  const isUp = value > 0;
  return (
    <View style={[styles.changePill, isUp ? styles.changePillUp : styles.changePillDown]}>
      {/* Show ▲/▼ arrow + absolute percentage, e.g. "▲ 3.42%" */}
      <Text style={[styles.changePillText, isUp ? styles.changePillTextUp : styles.changePillTextDown]}>
        {isUp ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
      </Text>
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
// General-purpose button with three visual variants:
//   • primary — solid accent background (default, for main actions)
//   • ghost   — transparent with a border (for secondary actions)
//   • danger  — red background (for destructive actions like removing a coin)
type ButtonProps = {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  onPress: () => void;
  disabled?: boolean;
} & Omit<PressableProps, 'onPress'>;

export function Button({ title, variant = 'primary', onPress, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      // Pressable's `style` prop accepts a function so we can react to press state
      style={({ pressed }) => [
        styles.btnBase,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        // Slight shrink effect on press for tactile feedback
        pressed && !disabled ? styles.btnPressed : null,
        disabled ? styles.btnDisabled : null,
      ]}
    >
      {/* Text colour depends on variant so it stays readable on each background */}
      <Text
        style={[
          styles.btnText,
          variant === 'primary' && { color: theme.color.onPrimary },
          variant === 'ghost' && { color: theme.color.text2 },
          variant === 'danger' && { color: theme.color.onDanger },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

// ─── Segment ─────────────────────────────────────────────────────────────────
// A two-option toggle switch (like iOS UISegmentedControl).
// Used on the Market screen to switch between "Top 50" and "Gainers".
export type SegmentValue = 'left' | 'right';

export function Segment({
  left,
  right,
  value,
  onChange,
  style,
}: {
  left: string;
  right: string;
  value: SegmentValue;
  onChange: (v: SegmentValue) => void;
  style?: ViewStyle;
}) {
  const leftActive = value === 'left';
  const rightActive = value === 'right';

  return (
    <View style={[styles.segment, style]}>
      {/* Left option */}
      <Pressable onPress={() => onChange('left')} style={[styles.segBtn, leftActive && styles.segActive]}>
        <Text style={[styles.segText, leftActive && styles.segTextActive]}>{left}</Text>
      </Pressable>

      {/* Right option */}
      <Pressable onPress={() => onChange('right')} style={[styles.segBtn, rightActive && styles.segActive]}>
        <Text style={[styles.segText, rightActive && styles.segTextActive]}>{right}</Text>
      </Pressable>
    </View>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
// Uppercase section header (e.g. "YOUR HOLDINGS") used to separate content groups.
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

// ─── Divider ─────────────────────────────────────────────────────────────────
// A thin horizontal line used to visually separate adjacent elements.
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },

  card: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
  },

  title: {
    color: theme.color.text,
    fontSize: theme.font.xxl,
    fontWeight: '900',
    letterSpacing: -0.5, // Tighter tracking looks better at large sizes
  },

  subtle: {
    marginTop: 4,
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Pill
  pill: {
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'flex-end',
    minWidth: 110,
  },
  pillAccent: {
    borderColor: theme.color.primaryGlow,
    backgroundColor: theme.color.accentSoft,
  },
  pillLabel: { color: theme.color.text3, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  pillValue: { marginTop: 2, color: theme.color.text, fontSize: theme.font.md, fontWeight: '900' },
  pillValueAccent: { color: theme.color.primaryLight },

  // Badge
  badge: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.surface2,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGold: {
    backgroundColor: theme.color.goldSoft,
    borderColor: theme.color.gold,
  },
  badgeText: { color: theme.color.text2, fontWeight: '900', fontSize: theme.font.sm },
  badgeTextGold: { color: theme.color.gold },

  // ChangePill
  changePill: {
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  changePillNeutral: {
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
  },
  changePillUp: {
    backgroundColor: 'rgba(16,185,129,0.12)', // Semi-transparent green tint
    borderColor: 'rgba(16,185,129,0.35)',
  },
  changePillDown: {
    backgroundColor: 'rgba(244,63,94,0.12)', // Semi-transparent red tint
    borderColor: 'rgba(244,63,94,0.35)',
  },
  changePillText: { fontSize: theme.font.sm, fontWeight: '800' },
  changePillTextNeutral: { color: theme.color.text3, fontSize: theme.font.sm, fontWeight: '700' },
  changePillTextUp: { color: theme.color.success },
  changePillTextDown: { color: theme.color.danger },

  // Button
  btnBase: {
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: theme.color.primary,
    borderColor: 'transparent',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: theme.color.border,
  },
  btnDanger: {
    backgroundColor: theme.color.danger,
    borderColor: 'transparent',
  },
  btnPressed: {
    transform: [{ scale: 0.97 }], // Subtle shrink for touch feedback
    opacity: 0.88,
  },
  btnDisabled: { opacity: 0.38 },
  btnText: {
    fontWeight: '800',
    fontSize: theme.font.sm,
    letterSpacing: 0.3,
  },

  // Segment
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    padding: 3,
    gap: 3,
  },
  segBtn: {
    flex: 1, // Each option takes equal width
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  segActive: {
    backgroundColor: theme.color.primary,
  },
  segText: { color: theme.color.text3, fontWeight: '700', fontSize: theme.font.sm },
  segTextActive: { color: theme.color.white, fontWeight: '800' },

  // Section label
  sectionLabel: {
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.space.sm,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.color.border,
    marginVertical: theme.space.md,
  },
});
