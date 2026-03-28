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

  // flex:1 garantit que les composants avec footer sticky (MCQExercise) ont une hauteur ancrée
  return (
    <View style={{ flex: 1 }}>
      <Component config={config} onComplete={onComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  error: { padding: 20, alignItems: 'center' },
});
