import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { theme } from '../theme/theme';

type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastApi = {
  show: (p: { type?: ToastType; title: string; message?: string; durationMs?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider />');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ToastState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;

    Animated.timing(anim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setState((s) => ({ ...s, visible: false }));
    });
  }, [anim]);

  const show = useCallback(
    ({
      type = 'info',
      title,
      message,
      durationMs = 2200,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      durationMs?: number;
    }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;

      setState({ visible: true, type, title, message });

      Animated.timing(anim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        hide();
      }, durationMs);
    },
    [anim, hide],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      hide,
      success: (title, message) => show({ type: 'success', title, message }),
      error: (title, message) => show({ type: 'error', title, message }),
      info: (title, message) => show({ type: 'info', title, message }),
    }),
    [show, hide],
  );

  const accent =
    state.type === 'success'
      ? theme.color.success
      : state.type === 'error'
        ? theme.color.danger
        : theme.color.accent;

  return (
    <ToastContext.Provider value={api}>
      {children}

      {state.visible ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            {
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable style={styles.toast} onPress={api.hide}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{state.title}</Text>
              {state.message ? <Text style={styles.msg}>{state.message}</Text> : null}
            </View>
            <Text style={styles.close}>×</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 18,
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
