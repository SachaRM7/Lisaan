// app/module-complete.tsx

import { useLocalSearchParams } from 'expo-router';
import { ModuleCompleteScreen } from '../src/screens/ModuleCompleteScreen';

export default function ModuleCompletePage() {
  const params = useLocalSearchParams<{
    moduleTitle: string;
    moduleTitleAr: string;
    moduleNumber: string;
    moduleIcon: string;
    totalXP: string;
    lessonsCount: string;
    timeMinutes: string;
  }>();

  return (
    <ModuleCompleteScreen
      moduleTitle={params.moduleTitle ?? 'Module complété'}
      moduleTitleAr={params.moduleTitleAr || undefined}
      moduleNumber={params.moduleNumber ? parseInt(params.moduleNumber) : undefined}
      moduleIcon={params.moduleIcon ?? ''}
      totalXP={parseInt(params.totalXP ?? '0')}
      lessonsCount={parseInt(params.lessonsCount ?? '0')}
      timeMinutes={parseInt(params.timeMinutes ?? '0')}
    />
  );
}
