// src/components/NetworkErrorScreen.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onRetry: () => void;
}

export function NetworkErrorScreen({ onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📶</Text>
      <Text style={styles.title}>Connexion requise</Text>
      <Text style={styles.subtitle}>
        La première ouverture nécessite une connexion internet pour télécharger les leçons.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFFDF7', padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  button: { backgroundColor: '#2D6A4F', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
