// ErrorBoundary.tsx
// React error boundary that catches JavaScript errors anywhere in its child
// component tree and shows a friendly fallback UI instead of a blank white screen.
// NOTE: Error boundaries MUST be class components — React does not (yet) provide
// a hook-based equivalent for getDerivedStateFromError / componentDidCatch.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from './ui';

// Props — only expects children to wrap
interface Props {
  children: React.ReactNode;
}

// State — tracks whether an error has been caught and stores the Error object
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Start in the "no error" state
    this.state = { hasError: false, error: null };
  }

  // Called during the render phase when a child throws.
  // Returns new state so React can show the fallback on the very next render.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Called after the error has been committed to the DOM.
  // Good place for logging / error-reporting (e.g. Sentry, Crashlytics).
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    // If an error was caught, show the fallback UI
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          {/* Display the error message so the user (or dev) has some context */}
          <Text style={styles.subtitle}>{this.state.error?.message}</Text>
          {/* Resetting hasError lets React try rendering the children again */}
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    // No error — render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.xl,
    backgroundColor: theme.color.bg,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.color.text,
    marginBottom: theme.space.sm,
  },
  subtitle: {
    fontSize: 14,
    color: theme.color.text2,
    marginBottom: theme.space.xl,
    textAlign: 'center',
  },
});
