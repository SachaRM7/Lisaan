/**
 * notification-service.ts — service de notifications push pour Lisaan.
 *
 * Stratégie : scheduling LOCAL uniquement (pas de serveur push au MVP).
 * - Rappel révision quotidienne : heure configurable par l'utilisateur
 * - Rappel défi quotidien : 23h30 si défi non complété
 * - Aucune notification si l'utilisateur a déjà ouvert l'app aujourd'hui
 *
 * Règles de respect :
 * - Max 1 notification de révision par jour
 * - Max 1 notification de défi par jour
 * - L'utilisateur peut désactiver chaque type indépendamment
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type NotificationType = 'daily_review' | 'daily_challenge' | 'streak_risk';

// Configuration du handler (affichage en foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false; // simulateur : skip

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lisaan-reminders', {
      name: 'Rappels Lisaan',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A96E',
    });
  }

  return finalStatus === 'granted';
}

export async function scheduleReviewNotification(
  hour: number,
  minute: number
): Promise<string | null> {
  await cancelNotificationsByType('daily_review');

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'لِسَان — Révision du jour',
      body: getReviewNotificationBody(),
      data: { type: 'daily_review' as NotificationType },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

export async function scheduleChallengeReminder(): Promise<string | null> {
  await cancelNotificationsByType('daily_challenge');

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'لِسَان — Défi du jour',
      body: "Ton défi quotidien t'attend. 2 minutes suffisent.",
      data: { type: 'daily_challenge' as NotificationType },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 23,
      minute: 30,
    },
  });

  return id;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotificationsByType(type: NotificationType): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

const REVIEW_MESSAGES = [
  'Tu as des cartes à réviser. 3 minutes pour rester au top.',
  'Quelques mots arabes t\'attendent. N\'oublie pas ta progression.',
  'Révision du jour disponible. Ton cerveau est prêt.',
  'المراجعة — Une session rapide pour consolider tes acquis.',
  'Tes lettres arabes méritent 5 minutes de ton attention.',
];

function getReviewNotificationBody(): string {
  return REVIEW_MESSAGES[Math.floor(Math.random() * REVIEW_MESSAGES.length)];
}
