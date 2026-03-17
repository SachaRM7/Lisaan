// app/(onboarding)/step1.tsx
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/useOnboardingStore';
import type { Motivation } from '../../src/types/onboarding';
import OnboardingShell from '../../src/components/onboarding/OnboardingShell';
import OptionCard from '../../src/components/onboarding/OptionCard';

const OPTIONS: { value: Motivation; label: string; icon: string }[] = [
  { value: 'quran',    label: 'Comprendre le Coran',               icon: '🕌' },
  { value: 'family',   label: 'Communiquer avec ma famille',        icon: '👨‍👩‍👧' },
  { value: 'travel',   label: 'Voyager dans un pays arabophone',    icon: '✈️' },
  { value: 'media',    label: 'Regarder des films / séries',        icon: '🎬' },
  { value: 'books',    label: 'Lire des livres / de la presse',     icon: '📚' },
  { value: 'business', label: 'Travailler / faire des affaires',    icon: '💼' },
  { value: 'culture',  label: 'Curiosité intellectuelle',           icon: '🌍' },
];

export default function Step1() {
  const router = useRouter();
  const { motivations, setMotivations } = useOnboardingStore();

  function toggle(value: Motivation) {
    if (motivations.includes(value)) {
      setMotivations(motivations.filter((m) => m !== value));
    } else {
      setMotivations([...motivations, value]);
    }
  }

  return (
    <OnboardingShell
      step={1}
      title="Pourquoi veux-tu apprendre l'arabe ?"
      subtitle="Plusieurs réponses possibles"
      onNext={() => router.push('/(onboarding)/step2')}
      nextDisabled={motivations.length === 0}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          icon={opt.icon}
          mode="multi"
          selected={motivations.includes(opt.value)}
          onPress={() => toggle(opt.value)}
        />
      ))}
    </OnboardingShell>
  );
}
