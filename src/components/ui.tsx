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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

// ─── Screen ──────────────────────────────────────────────────────────────────
export function Screen({
  children,
  style,
  noHorizontalPad,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  noHorizontalPad?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, theme.space.lg),
          paddingBottom: Math.max(insets.bottom, theme.space.lg),
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
export function Card({
  children,
  style,
  glow,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: 'primary' | 'success' | 'danger';
}) {
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
export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

// ─── Subtle ───────────────────────────────────────────────────────────────────
export function Subtle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.subtle, style]}>{children}</Text>;
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
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
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, accent && styles.pillValueAccent]}>{value}</Text>
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ n }: { n: number }) {
  const isTop3 = n <= 3;
  return (
    <View style={[styles.badge, isTop3 && styles.badgeGold]}>
      <Text style={[styles.badgeText, isTop3 && styles.badgeTextGold]}>{n}</Text>
    </View>
  );
}

// ─── ChangePill ───────────────────────────────────────────────────────────────
export function ChangePill({ value }: { value: number | null | undefined }) {
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
      <Text style={[styles.changePillText, isUp ? styles.changePillTextUp : styles.changePillTextDown]}>
        {isUp ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
      </Text>
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
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
      style={({ pressed }) => [
        styles.btnBase,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        pressed && !disabled ? styles.btnPressed : null,
        disabled ? styles.btnDisabled : null,
      ]}
    >
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
      <Pressable onPress={() => onChange('left')} style={[styles.segBtn, leftActive && styles.segActive]}>
        <Text style={[styles.segText, leftActive && styles.segTextActive]}>{left}</Text>
      </Pressable>

      <Pressable onPress={() => onChange('right')} style={[styles.segBtn, rightActive && styles.segActive]}>
        <Text style={[styles.segText, rightActive && styles.segTextActive]}>{right}</Text>
      </Pressable>
    </View>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

// ─── Divider ─────────────────────────────────────────────────────────────────
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
    letterSpacing: -0.5,
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
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.35)',
  },
  changePillDown: {
    backgroundColor: 'rgba(244,63,94,0.12)',
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
    transform: [{ scale: 0.97 }],
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
    flex: 1,
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
