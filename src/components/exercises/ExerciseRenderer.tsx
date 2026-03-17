// src/components/exercises/ExerciseRenderer.tsx
import { View, Text, StyleSheet } from 'react-native';
import type { ExerciseConfig, ExerciseResult } from '../../types/exercise';
import { getExerciseComponent } from './index';

interface ExerciseRendererProps {
  config: ExerciseConfig;
  onComplete: (result: ExerciseResult) => void;
}

export function ExerciseRenderer({ config, onComplete }: ExerciseRendererProps) {
  const Component = getExerciseComponent(config.type);

  if (!Component) {
    return (
      <View style={styles.error}>
        <Text>Type d'exercice non supporté : {config.type}</Text>
      </View>
    );
  }

  return <Component config={config} onComplete={onComplete} />;
}

const styles = StyleSheet.create({
  error: { padding: 20, alignItems: 'center' },
});
