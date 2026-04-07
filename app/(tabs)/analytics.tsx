// app/(tabs)/analytics.tsx
// Dashboard analytics admin — visible uniquement si isAdmin(email)
// Exception documentée : cet écran seul est autorisé à lire Supabase directement
// car c'est un outil d'administration, pas un flux utilisateur.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { isAdmin } from '../../src/utils/admin-check';
import { supabase } from '../../src/db/remote';

// ─── Types ────────────────────────────────────────────────

interface BetaAnalytics {
  total_testers: number;
  active_j7: number;
  active_j30: number;
  avg_streak: number | null;
  max_streak: number | null;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_email?: string;
}

// ─── KPI Card ──────────────────────────────────────────────

function KPICard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
}) {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.base,
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.medium,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.small,
          color: colors.text.secondary,
        }}>
          {title}
        </Text>
      </View>
      <Text style={{
        fontFamily: typography.family.uiBold,
        fontSize: typography.size.h1,
        color: color,
        marginBottom: 2,
      }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.tiny,
          color: colors.text.secondary,
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

// ─── Retention Bar ─────────────────────────────────────────

function RetentionBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <View style={{ marginBottom: spacing.base }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.small,
          color: colors.text.primary,
        }}>
          {label}
        </Text>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.small,
          color: color,
        }}>
          {pct}%
        </Text>
      </View>
      <View style={{
        height: 8,
        backgroundColor: colors.background.group,
        borderRadius: borderRadius.pill,
        overflow: 'hidden',
      }}>
        <View style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: borderRadius.pill,
        }} />
      </View>
    </View>
  );
}

// ─── Star Rating ──────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#D4AF37"
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────

export default function AnalyticsDashboard() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const email = useAuthStore((s) => s.email);

  const [analytics, setAnalytics] = useState<BetaAnalytics | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Protection admin
  if (!isAdmin(email)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
          gap: spacing.base,
        }}>
          <Ionicons name="shield-outline" size={48} color={colors.text.secondary} />
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h2,
            color: colors.text.primary,
            textAlign: 'center',
          }}>
            Accès restreint
          </Text>
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.body,
            color: colors.text.secondary,
            textAlign: 'center',
          }}>
            Ce tableau de bord est réservé aux administrateurs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function loadData() {
    try {
      // Charger analytics depuis la vue beta_analytics
      const { data: analyticsData, error: analyticsErr } = await supabase
        .from('beta_analytics')
        .select('*')
        .single();

      if (!analyticsErr && analyticsData) {
        setAnalytics(analyticsData as BetaAnalytics);
      }

      // Charger feedbacks récents
      const { data: feedbackData, error: feedbackErr } = await supabase
        .from('beta_feedback')
        .select('id, rating, comment, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!feedbackErr && feedbackData) {
        setFeedbacks(feedbackData as FeedbackItem[]);
        const ratings = (feedbackData as FeedbackItem[]).map(f => f.rating).filter(Boolean);
        if (ratings.length > 0) {
          setAvgRating(Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10);
        }
      }
    } catch (err) {
      console.warn('[Analytics] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  async function handleExport() {
    try {
      const lines: string[] = [
        'Lisaan Beta Analytics Export',
        `Generated: ${new Date().toISOString()}`,
        '',
        '=== KPIs ===',
        `Total Testers: ${analytics?.total_testers ?? 0}`,
        `Active J7: ${analytics?.active_j7 ?? 0}`,
        `Active J30: ${analytics?.active_j30 ?? 0}`,
        `Avg Streak: ${analytics?.avg_streak?.toFixed(1) ?? 'N/A'}`,
        `Max Streak: ${analytics?.max_streak ?? 0}`,
        '',
        '=== Recent Feedbacks ===',
        ...feedbacks.map(f =>
          `[${f.created_at?.split('T')[0] ?? ''}] ${f.rating}/5: ${f.comment ?? '(no comment)'}`
        ),
      ];

      await Share.share({
        message: lines.join('\n'),
        title: 'Lisaan Beta Analytics',
      });
    } catch (err) {
      console.warn('[Analytics] Export error:', err);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </SafeAreaView>
    );
  }

  const total = analytics?.total_testers ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <View>
            <Text style={{
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.h1,
              color: colors.text.primary,
            }}>
              📊 Dashboard Bêta
            </Text>
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.small,
              color: colors.text.secondary,
              marginTop: 2,
            }}>
              Métriques J7 / J30
            </Text>
          </View>
          <Pressable
            onPress={handleExport}
            style={{
              backgroundColor: colors.brand.light,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.brand.primary} />
          </Pressable>
        </View>

        {/* KPI Grid */}
        <View style={{ flexDirection: 'row', gap: spacing.base, marginBottom: spacing.xl }}>
          <KPICard
            title="Testeurs"
            value={total}
            icon="👥"
            color={colors.brand.primary}
          />
          <KPICard
            title="Actifs J7"
            value={analytics?.active_j7 ?? 0}
            subtitle={`sur ${total} total`}
            icon="📅"
            color="#16A34A"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.base, marginBottom: spacing.xl }}>
          <KPICard
            title="Note moy."
            value={avgRating !== null ? `${avgRating}/5` : 'N/A'}
            icon="⭐"
            color="#D4AF37"
          />
          <KPICard
            title="Feedbacks"
            value={feedbacks.length}
            icon="💬"
            color="#1565C0"
          />
        </View>

        {/* Rétention */}
        <View style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.lg,
          padding: spacing.base,
          marginBottom: spacing.xl,
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h2,
            color: colors.text.primary,
            marginBottom: spacing.base,
          }}>
            Rétention
          </Text>
          <RetentionBar
            label="J7"
            count={analytics?.active_j7 ?? 0}
            total={total}
            color="#16A34A"
          />
          <RetentionBar
            label="J30"
            count={analytics?.active_j30 ?? 0}
            total={total}
            color={colors.brand.primary}
          />
          <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm }}>
            <View>
              <Text style={{
                fontFamily: typography.family.uiMedium,
                fontSize: typography.size.tiny,
                color: colors.text.secondary,
              }}>
                Streak moy.
              </Text>
              <Text style={{
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.body,
                color: colors.text.primary,
              }}>
                {analytics?.avg_streak != null ? `${analytics.avg_streak.toFixed(1)}j` : 'N/A'}
              </Text>
            </View>
            <View>
              <Text style={{
                fontFamily: typography.family.uiMedium,
                fontSize: typography.size.tiny,
                color: colors.text.secondary,
              }}>
                Streak max
              </Text>
              <Text style={{
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.body,
                color: colors.accent.gold,
              }}>
                {analytics?.max_streak ?? 0}j
              </Text>
            </View>
          </View>
        </View>

        {/* Feedbacks récents */}
        <View style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.lg,
          padding: spacing.base,
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h2,
            color: colors.text.primary,
            marginBottom: spacing.base,
          }}>
            Feedbacks récents
          </Text>
          {feedbacks.length === 0 ? (
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.body,
              color: colors.text.secondary,
              fontStyle: 'italic',
            }}>
              Aucun feedback pour le moment.
            </Text>
          ) : (
            feedbacks.slice(0, 5).map((f) => (
              <View key={f.id} style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.border.subtle,
                paddingVertical: spacing.sm,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <StarRating rating={f.rating} />
                  <Text style={{
                    fontFamily: typography.family.ui,
                    fontSize: typography.size.tiny,
                    color: colors.text.secondary,
                  }}>
                    {f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : ''}
                  </Text>
                </View>
                <Text style={{
                  fontFamily: typography.family.ui,
                  fontSize: typography.size.small,
                  color: colors.text.secondary,
                }}>
                  {f.comment || '(sans commentaire)'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
