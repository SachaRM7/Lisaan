// app/(onboarding)/step5.tsx
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/useOnboardingStore';
import type { DailyTime } from '../../src/types/onboarding';
import OnboardingShell from '../../src/components/onboarding/OnboardingShell';
import OptionCard from '../../src/components/onboarding/OptionCard';

const OPTIONS: { value: DailyTime; label: string; icon: string }[] = [
  { value: '5min',     label: '5 minutes',          icon: '⚡' },
  { value: '10min',    label: '10 minutes',          icon: '⏱️' },
  { value: '15-20min', label: '15–20 minutes',       icon: '🕐' },
  { value: '20min+',   label: 'Plus de 20 minutes',  icon: '🔥' },
];

export default function Step5() {
  const router = useRouter();
  const { dailyTime, setDailyTime, computeAndSetRecommendation } = useOnboardingStore();

  function handleNext() {
    computeAndSetRecommendation();
    router.push('/(onboarding)/recommendation');
  }

  return (
    <OnboardingShell
      step={5}
      title="Combien de temps par jour peux-tu consacrer ?"
      onNext={handleNext}
      nextDisabled={dailyTime === null}
      nextLabel="Voir ma recommandation"
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          icon={opt.icon}
          mode="single"
          selected={dailyTime === opt.value}
          onPress={() => setDailyTime(opt.value)}
        />
      ))}
    </OnboardingShell>
  );
}
