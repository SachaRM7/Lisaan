// src/engines/answer-validator.ts

// === NORMALISATION ARABE ===

export function stripHarakats(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

export function normalizeArabic(text: string): string {
  let r = text.trim();
  r = stripHarakats(r);
  r = r.replace(/[أإآ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي'); // hamza
  r = r.replace(/ة(?=\s|$)/g, 'ه');  // taa marbuta
  r = r.replace(/ى/g, 'ي');           // alif maqsura
  return r.replace(/\s+/g, ' ');
}

export function normalizeFrench(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

// === LEVENSHTEIN ===

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  return dp[m][n];
}

// === VALIDATEUR ===

export interface ValidationResult {
  isCorrect: boolean;
  isExact: boolean;
  distance: number;
  closestCorrectAnswer: string;
  feedback: string;
}

export function validateWrittenAnswer(
  userAnswer: string,
  correctAnswers: string[],
  lang: 'ar' | 'fr',
  tolerance: 'strict' | 'normal' | 'indulgent',
): ValidationResult {
  if (!userAnswer.trim()) {
    return { isCorrect: false, isExact: false, distance: 999,
      closestCorrectAnswer: correctAnswers[0] ?? '', feedback: 'Tape ta réponse.' };
  }

  const normalize = lang === 'ar' ? normalizeArabic : normalizeFrench;
  const input = normalize(userAnswer);
  let bestDist = Infinity, bestAnswer = correctAnswers[0] ?? '';

  for (const ans of correctAnswers) {
    const d = levenshtein(input, normalize(ans));
    if (d < bestDist) { bestDist = d; bestAnswer = ans; }
    if (d === 0) return { isCorrect: true, isExact: true, distance: 0,
      closestCorrectAnswer: ans, feedback: 'Parfait !' };
  }

  const maxDist = tolerance === 'strict' ? 0 : tolerance === 'normal' ? 1 : 2;

  if (bestDist <= maxDist) {
    return { isCorrect: true, isExact: false, distance: bestDist,
      closestCorrectAnswer: bestAnswer, feedback: `Presque ! Réponse exacte : ${bestAnswer}` };
  }
  return { isCorrect: false, isExact: false, distance: bestDist,
    closestCorrectAnswer: bestAnswer, feedback: `Bonne réponse : ${bestAnswer}` };
}
