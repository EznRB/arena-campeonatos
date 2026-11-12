import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import type { Tournament } from "./domain";

export function feedback() {
  if (Platform.OS !== "web") {
    // Tactile feedback is optional and must not undo a persisted result.
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => undefined);
  }
}

export async function scheduleReminder(
  tournament: Tournament,
): Promise<string> {
  if (Platform.OS === "web")
    throw new Error(
      "Lembretes locais estão disponíveis no aplicativo Android/iOS.",
    );
  const date = new Date(tournament.startsAt);
  if (date.getTime() <= Date.now())
    throw new Error("Escolha um campeonato com início no futuro.");
  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("tournaments", {
      name: "Campeonatos",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const permission = await Notifications.requestPermissionsAsync();
  if (
    !permission.granted &&
    permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    throw new Error(
      "Notificações não autorizadas. Você pode permitir nas configurações do aparelho.",
    );
  }
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Está na hora de entrar na Arena",
      body: `${tournament.name} começa agora.`,
      data: { tournamentId: tournament.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: "tournaments",
    },
  });
}

export async function cancelReminder(id: string) {
  if (Platform.OS !== "web") {
    const Notifications = await import("expo-notifications");
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}
