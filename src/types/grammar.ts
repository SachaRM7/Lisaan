// src/types/grammar.ts

export interface GrammarRule {
  id: string;
  module_id: string;
  sort_order: number;
  title_fr: string;
  title_ar?: string;
  concept_fr: string;
  formula?: string;
  example_ar: string;
  example_ar_vocalized: string;
  example_transliteration: string;
  example_translation_fr: string;
  example_audio_url?: string;
  pedagogy_notes?: string;
  difficulty: number;
  synced_at?: string;
}

export interface ConjugationEntry {
  id: string;
  word_id: string;
  tense: 'past' | 'present' | 'imperative';
  form: number;
  pronoun_code: 'ana' | 'anta' | 'anti' | 'huwa' | 'hiya' | 'nahnu' | 'antum' | 'hum';
  pronoun_ar: string;
  pronoun_fr: string;
  conjugated_ar: string;
  conjugated_ar_vocalized: string;
  conjugated_transliteration: string;
  audio_url?: string;
  example_sentence_ar?: string;
  example_sentence_ar_vocalized?: string;
  example_sentence_translation_fr?: string;
  synced_at?: string;
}
