// app/module-complete.tsx

import { useLocalSearchParams } from 'expo-router';
import { ModuleCompleteScreen } from '../src/screens/ModuleCompleteScreen';

export default function ModuleCompletePage() {
  const params = useLocalSearchParams<{
    moduleTitle: string;
    moduleIcon: string;
    totalXP: string;
    lessonsCount: string;
    timeMinutes: string;
  }>();

  return (
    <ModuleCompleteScreen
      moduleTitle={params.moduleTitle ?? 'Module complété'}
      moduleIcon={params.moduleIcon ?? '🎓'}
      totalXP={parseInt(params.totalXP ?? '0')}
      lessonsCount={parseInt(params.lessonsCount ?? '0')}
      timeMinutes={parseInt(params.timeMinutes ?? '0')}
    />
  );
}
