import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// Configuration de l'affichage si une notification arrive lorsque l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useJuryNotificationDemo() {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const scheduledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // 1. Demande de permission et création du canal haute priorité Android
    async function configureNotifications() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[JuryDemo] Permission de notification refusée.');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('urgent-alerts', {
          name: 'Alertes Municipales Urgentes',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4AF37',
        });
      }
    }

    configureNotifications();

    // 2. Surveillance du passage en arrière-plan (AppState)
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      const isGoingToBackground =
        appState.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive');

      const isReturningToForeground =
        (appState.current === 'background' || appState.current === 'inactive') &&
        nextAppState === 'active';

      if (isGoingToBackground) {
        // Nettoyage préventif d'une éventuelle notification déjà en file d'attente
        if (scheduledIdRef.current) {
          await Notifications.cancelScheduledNotificationAsync(scheduledIdRef.current);
        }

        // Programmation de la notification factice à T+5 secondes pour la soutenance
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 Nouvelle alerte : Fermeture du centre-ville',
            body: 'Collectif Châlonnais · Circulation interrompue Place Foch ce samedi de 8h à 18h.',
            data: { articleId: '1', tenant: 'collectif-chalonnais' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5,
            repeats: false,
          },
        });

        scheduledIdRef.current = id;
      } else if (isReturningToForeground && scheduledIdRef.current) {
        // Si l'utilisateur rouvre l'app avant les 5s, on annule l'envoi différé
        await Notifications.cancelScheduledNotificationAsync(scheduledIdRef.current);
        scheduledIdRef.current = null;
      }

      appState.current = nextAppState;
    });

    // 3. Deep-linking : clic du jury sur la notification -> ouverture de l'article
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const articleId = response.notification.request.content.data?.articleId;
        if (articleId) {
          router.push(`/articles/${articleId}`);
        }
      }
    );

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);
}
