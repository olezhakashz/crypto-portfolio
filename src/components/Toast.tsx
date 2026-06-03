// Toast.tsx
// App-wide toast notification system built with React Context.
// Wrap the app in <ToastProvider>, then call useToast().success/error/info
// from any screen to show a temporary popup that auto-dismisses.

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { theme } from '../theme/theme';

// The three visual flavours a toast can have (each gets a different accent colour)
type ToastType = 'success' | 'error' | 'info';

// Internal state that drives what the toast looks like right now
type ToastState = {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
};

// Public API exposed via useToast() — consumers only interact with these methods
type ToastApi = {
  show: (p: { type?: ToastType; title: string; message?: string; durationMs?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  hide: () => void;
};

// React Context that carries the toast API down the component tree (starts null)
const ToastContext = createContext<ToastApi | null>(null);

// Hook that any child component can call to show/hide toasts.
// Throws an error if used outside a <ToastProvider> — a helpful dev-time guard.
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider />');
  return ctx;
}

// Provider component — place this near the root of the app so every screen
// can display toasts. It renders children + the toast overlay on top.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Holds current toast content and visibility
  const [state, setState] = useState<ToastState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Ref to the auto-dismiss timer so we can clear it if a new toast appears
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Single Animated.Value drives both the opacity and the slide-up translation
  const anim = useRef(new Animated.Value(0)).current;

  // hide() — fades the toast out, then sets visible to false.
  // Wrapped in useCallback so it has a stable identity for dependency arrays.
  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;

    // Animate opacity → 0 over 160 ms, then remove from the tree
    Animated.timing(anim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setState((s) => ({ ...s, visible: false }));
    });
  }, [anim]);

  // show() — displays a toast with the given content and starts the auto-dismiss timer.
  // If a toast is already visible, the old timer is cleared so only the new one counts.
  const show = useCallback(
    ({
      type = 'info',
      title,
      message,
      durationMs = 2200, // default display time before auto-dismiss
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      durationMs?: number;
    }) => {
      // Cancel any existing auto-dismiss timer from a previous toast
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;

      // Make the toast visible immediately with the new content
      setState({ visible: true, type, title, message });

      // Animate in: fade + slide up over 180 ms
      Animated.timing(anim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      // Schedule automatic dismissal after durationMs
      timerRef.current = setTimeout(() => {
        hide();
      }, durationMs);
    },
    [anim, hide],
  );

  // Memoised API object so the Context value reference stays stable
  // and doesn't cause unnecessary re-renders in consuming components.
  const api = useMemo<ToastApi>(
    () => ({
      show,
      hide,
      // Convenience shortcuts so callers don't have to pass { type: '...' } every time
      success: (title, message) => show({ type: 'success', title, message }),
      error: (title, message) => show({ type: 'error', title, message }),
      info: (title, message) => show({ type: 'info', title, message }),
    }),
    [show, hide],
  );

  // Pick the accent dot colour based on toast type
  const accent =
    state.type === 'success'
      ? theme.color.success
      : state.type === 'error'
        ? theme.color.danger
        : theme.color.accent;

  return (
    <ToastContext.Provider value={api}>
      {/* Normal app content */}
      {children}

      {/* Toast overlay — rendered on top of everything when visible */}
      {state.visible ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            {
              opacity: anim,
              transform: [
                {
                  // Slide up from 16px below to its natural position
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Tapping the toast dismisses it early */}
          <Pressable style={styles.toast} onPress={api.hide}>
            {/* Coloured dot on the left indicates success / error / info */}
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{state.title}</Text>
              {state.message ? <Text style={styles.msg}>{state.message}</Text> : null}
            </View>
            {/* Close button on the right */}
            <Text style={styles.close}>×</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  // Absolutely positioned at the bottom so it floats above content
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 90, // High enough to clear the bottom tab bar
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  // Small coloured circle indicating toast type
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  title: {
    color: theme.color.text,
    fontWeight: '900',
    fontSize: 14,
  },
  msg: {
    marginTop: 2,
    color: theme.color.text2,
    fontWeight: '600',
    fontSize: 12,
  },
  close: {
    color: theme.color.text3,
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
});
