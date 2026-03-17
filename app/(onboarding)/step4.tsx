// app/(onboarding)/step4.tsx
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/useOnboardingStore';
import type { DialectContact } from '../../src/types/onboarding';
import OnboardingShell from '../../src/components/onboarding/OnboardingShell';
import OptionCard from '../../src/components/onboarding/OptionCard';

const OPTIONS: { value: DialectContact; label: string; icon: string }[] = [
  { value: 'none',      label: 'Aucun en particulier',                      icon: '🤷' },
  { value: 'darija',    label: 'Marocain (darija)',                          icon: '🇲🇦' },
  { value: 'egyptian',  label: 'Égyptien',                                   icon: '🇪🇬' },
  { value: 'levantine', label: 'Levantin (libanais, syrien, palestinien)',   icon: '🇱🇧' },
  { value: 'khaliji',   label: 'Du Golfe (khaliji)',                         icon: '🇸🇦' },
];

export default function Step4() {
  const router = useRouter();
  const { dialectContact, setDialectContact } = useOnboardingStore();

  return (
    <OnboardingShell
      step={4}
      title="Avec quel dialecte es-tu le plus en contact ?"
      onNext={() => router.push('/(onboarding)/step5')}
      nextDisabled={dialectContact === null}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          icon={opt.icon}
          mode="single"
          selected={dialectContact === opt.value}
          onPress={() => setDialectContact(opt.value)}
        />
      ))}
    </OnboardingShell>
  );
}
