// Ce fichier est obsolète — remplacé par app/auth.tsx
// Peut être supprimé manuellement : rm app/auth-choice.tsx
import { Redirect } from 'expo-router';
export default function AuthChoiceRedirect() {
  return <Redirect href="/auth" />;
}
