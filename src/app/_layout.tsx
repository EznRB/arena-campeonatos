import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { TournamentProvider } from "../store";
import { colors } from "../components/ui";
import { Platform, useWindowDimensions } from "react-native";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed/700Bold";

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const [loaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    BarlowCondensed_700Bold,
  });
  if (!loaded && !fontError) return null;
  return (
    <TournamentProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerShown: !(Platform.OS === "web" && width >= 1000),
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create" options={{ title: "Novo campeonato" }} />
        <Stack.Screen
          name="tournament/[id]"
          options={{ title: "Central do campeonato" }}
        />
        <Stack.Screen
          name="participants/[id]"
          options={{ title: "Participantes" }}
        />
        <Stack.Screen name="bracket/[id]" options={{ title: "Confrontos" }} />
        <Stack.Screen
          name="match/[id]"
          options={{ title: "Resultado da partida" }}
        />
        <Stack.Screen
          name="ticket/[id]"
          options={{ title: "Cartão de inscrição" }}
        />
        <Stack.Screen
          name="scanner/[id]"
          options={{ title: "Check-in por QR Code" }}
        />
      </Stack>
    </TournamentProvider>
  );
}
