// src/components/ErrorBoundary.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, eventId: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack);
    // Sentry.captureException sera réactivé au moment du build EAS
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Quelque chose s'est mal passé</Text>
          <Text style={styles.subtitle}>
            L'erreur a été signalée automatiquement.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, eventId: null })}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
