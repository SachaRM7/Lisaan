// src/components/ui/ContentDownloadScreen.tsx

import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export function ContentDownloadScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>لسان</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      <Text style={styles.title}>Préparation du contenu...</Text>
      <Text style={styles.subtitle}>Première utilisation — nécessite une connexion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 64,
    fontFamily: 'Amiri-Bold',
    color: Colors.primary,
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
