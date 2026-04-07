// src/components/parcours/MsaModuleList.tsx
// Liste verticale des modules MSA

import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { MsaModuleItem } from './MsaModuleItem';
import type { Module, Lesson } from '../../hooks/useModules';
import type { LessonProgress } from '../../hooks/useProgress';

interface MsaModuleListProps {
  modules: Module[];
  lessonsByModuleId: Record<string, Lesson[]>;
  progressByModule: Record<string, LessonProgress[]>;
  lessonCountByModule: Record<string, number>;
  onModulePress?: (module: Module) => void;
}

function isModuleUnlocked(
  moduleSortOrder: number,
  progressByModule: Record<string, LessonProgress[]>,
  modules: Module[],
  lessonCountByModule: Record<string, number>,
): boolean {
  if (moduleSortOrder === 1) return true;
  const previousModule = modules.find(m => m.sort_order === moduleSortOrder - 1);
  if (!previousModule) return true;
  const previousProgress = progressByModule[previousModule.id] ?? [];
  const previousCompleted = previousProgress.filter(p => p.status === 'completed').length;
  const previousTotal = lessonCountByModule[previousModule.id] ?? 0;
  return previousTotal > 0 && previousCompleted >= previousTotal;
}

export function MsaModuleList({
  modules,
  lessonsByModuleId,
  progressByModule,
  lessonCountByModule,
  onModulePress,
}: MsaModuleListProps) {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();

  const allModules = modules ?? [];

  return (
    <View style={{ gap: 0 }}>
      {allModules.map((mod) => {
        const total = lessonCountByModule[mod.id] ?? 0;
        const modProgress = progressByModule[mod.id] ?? [];
        const completed = modProgress.filter(p => p.status === 'completed').length;
        const inProgress = modProgress.some(p => p.status === 'in_progress' || p.status === 'available');

        const unlocked = isModuleUnlocked(mod.sort_order, progressByModule, allModules, lessonCountByModule);

        let status: 'completed' | 'in_progress' | 'locked' = 'locked';
        if (!unlocked) {
          status = 'locked';
        } else if (completed >= total && total > 0) {
          status = 'completed';
        } else {
          status = inProgress ? 'in_progress' : 'locked';
          // First module is always in_progress if unlocked
          if (mod.sort_order === 1 && total > 0 && completed === 0) {
            status = 'in_progress';
          }
        }

        return (
          <View key={mod.id}>
            {/* Ligne de séparation */}
            {mod.sort_order > 1 && (
              <View style={{
                height: 1,
                backgroundColor: colors.border.subtle,
                marginLeft: 56,
              }} />
            )}

            {/* Indicateur couleur gauche */}
            <View style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor:
                status === 'completed' ? colors.status.success :
                status === 'in_progress' ? colors.brand.primary :
                'transparent',
              borderRadius: 1.5,
            }} />

            <MsaModuleItem
              module={mod}
              number={mod.sort_order}
              status={status}
              onPress={() => {
                if (onModulePress) {
                  onModulePress(mod);
                } else {
                  router.push(`/module/${mod.id}` as any);
                }
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
