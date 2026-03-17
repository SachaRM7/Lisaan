// app/(onboarding)/step2.tsx
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/useOnboardingStore';
import type { ArabicLevel } from '../../src/types/onboarding';
import OnboardingShell from '../../src/components/onboarding/OnboardingShell';
import OptionCard from '../../src/components/onboarding/OptionCard';

const OPTIONS: { value: ArabicLevel; label: string }[] = [
  { value: 'zero',         label: 'Aucune — je pars de zéro' },
  { value: 'few_letters',  label: 'Je connais quelques lettres' },
  { value: 'slow_reader',  label: 'Je sais lire mais lentement' },
  { value: 'oral_only',    label: "Je comprends à l'oral mais pas lire / écrire" },
  { value: 'intermediate', label: 'Je me débrouille mais je veux progresser' },
];

export default function Step2() {
  const router = useRouter();
  const { arabicLevel, setArabicLevel } = useOnboardingStore();

  return (
    <OnboardingShell
      step={2}
      title="As-tu déjà des bases en arabe ?"
      onNext={() => router.push('/(onboarding)/step3')}
      nextDisabled={arabicLevel === null}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          mode="single"
          selected={arabicLevel === opt.value}
          onPress={() => setArabicLevel(opt.value)}
        />
      ))}
    </OnboardingShell>
  );
}
