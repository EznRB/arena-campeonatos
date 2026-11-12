import { Tabs } from "expo-router";
import { Platform, useWindowDimensions } from "react-native";
import { colors } from "../../components/ui";
import { Icon } from "../../components/icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width >= 1000;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerShown: !desktop,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 76 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 7,
          display: desktop ? "none" : "flex",
        },
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          lineHeight: 16,
          marginTop: 4,
        },
        tabBarIconStyle: { width: 24, height: 24 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Arena",
          tabBarLabel: "Campeonatos",
          tabBarIcon: ({ color }) => (
            <Icon
              name="dashboard"
              color={typeof color === "string" ? color : colors.muted}
              size={21}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Galeria de campeões",
          tabBarLabel: "Histórico",
          tabBarIcon: ({ color }) => (
            <Icon
              name="trophy"
              color={typeof color === "string" ? color : colors.muted}
              size={21}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "Como jogar",
          tabBarLabel: "Guia",
          tabBarIcon: ({ color }) => (
            <Icon
              name="help"
              color={typeof color === "string" ? color : colors.muted}
              size={21}
            />
          ),
        }}
      />
    </Tabs>
  );
}
