// app/(onboarding)/step3.tsx
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/useOnboardingStore';
import type { PrimaryGoal } from '../../src/types/onboarding';
import OnboardingShell from '../../src/components/onboarding/OnboardingShell';
import OptionCard from '../../src/components/onboarding/OptionCard';

const OPTIONS: { value: PrimaryGoal; label: string; icon: string }[] = [
  { value: 'read_fluently',      label: "Lire l'arabe couramment",              icon: '📖' },
  { value: 'basic_conversation', label: 'Avoir une conversation basique',        icon: '🗣️' },
  { value: 'understand_quran',   label: 'Comprendre le Coran sans traduction',   icon: '🕋' },
  { value: 'master_grammar',     label: "Maîtriser la grammaire et l'écriture",  icon: '✍️' },
];

export default function Step3() {
  const router = useRouter();
  const { primaryGoal, setPrimaryGoal } = useOnboardingStore();

  return (
    <OnboardingShell
      step={3}
      title="Si tu devais choisir UN objectif ?"
      onNext={() => router.push('/(onboarding)/step4')}
      nextDisabled={primaryGoal === null}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          icon={opt.icon}
          mode="single"
          selected={primaryGoal === opt.value}
          onPress={() => setPrimaryGoal(opt.value)}
        />
      ))}
    </OnboardingShell>
  );
}
