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

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.subtle, style]}>{children}</Text>;
}

export function Pill({ label, value, style }: { label: string; value: string; style?: ViewStyle }) {
  return (
    <View style={[styles.pill, style]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

type ButtonProps = {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  onPress: () => void;
  disabled?: boolean;
} & Omit<PressableProps, 'onPress'>;

export function Button({ title, variant = 'primary', onPress, disabled, ...rest }: ButtonProps) {
  const textColor =
    variant === 'primary'
      ? theme.color.onPrimary
      : variant === 'danger'
        ? theme.color.onDanger
        : theme.color.text;

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
      <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

/**
 * Segment: two-state switch
 * value: 'left' | 'right'
 */
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
      <Pressable
        onPress={() => onChange('left')}
        style={[styles.segBtn, leftActive && styles.segActive]}
      >
        <Text style={[styles.segText, leftActive && styles.segTextActive]}>{left}</Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('right')}
        style={[styles.segBtn, rightActive && styles.segActive]}
      >
        <Text style={[styles.segText, rightActive && styles.segTextActive]}>{right}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },

  card: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.xl,
    padding: theme.space.lg,
  },

  title: {
    color: theme.color.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  subtle: {
    marginTop: 6,
    color: theme.color.text2,
    fontSize: 12,
    fontWeight: '700',
  },

  pill: {
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
    minWidth: 120,
  },
  pillLabel: { color: theme.color.text3, fontSize: 11, fontWeight: '900' },
  pillValue: { marginTop: 2, color: theme.color.text, fontSize: 14, fontWeight: '900' },

  btnBase: {
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  btnPrimary: {
    backgroundColor: theme.color.primary,
    borderColor: 'rgba(255,255,255,0)',
  },

  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: theme.color.border,
  },

  btnDanger: {
    backgroundColor: theme.color.danger,
    borderColor: 'rgba(255,255,255,0)',
  },

  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  btnDisabled: { opacity: 0.45 },

  btnText: {
    fontWeight: '900',
    fontSize: 14,
  },

  segment: {
    marginTop: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  segBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segActive: { backgroundColor: theme.color.primary },
  segText: { color: theme.color.text2, fontWeight: '900' },
  segTextActive: { color: theme.color.onPrimary },
});
