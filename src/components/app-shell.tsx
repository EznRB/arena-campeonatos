import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

const accent = "#FF8055";
const nav: {
  label: string;
  path: "/" | "/history" | "/about" | "/cloud";
  icon: IconName;
}[] = [
  { label: "Visão geral", path: "/", icon: "dashboard" },
  { label: "Hall da fama", path: "/history", icon: "trophy" },
  { label: "Conta e backup", path: "/cloud", icon: "shield" },
  { label: "Manual da arena", path: "/about", icon: "help" },
];
export function AppShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const desktop = Platform.OS === "web" && width >= 1000;
  if (!desktop) return children;
  const root = ["/", "/history", "/about", "/cloud"].includes(pathname);
  const title =
    pathname === "/history"
      ? "Hall da fama"
      : pathname === "/about"
        ? "Manual da arena"
        : pathname === "/cloud"
          ? "Conta e backup"
          : pathname === "/create"
          ? "Novo campeonato"
          : pathname === "/"
            ? "Visão geral"
            : "Central do campeonato";
  return (
    <View style={s.frame}>
      <View style={s.sidebar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Arena — início"
          onPress={() => router.push("/")}
          style={s.brand}
        >
          <View style={s.mark}>
            <Icon name="swords" size={24} color="#101114" />
          </View>
          <Text style={s.wordmark}>
            ARENA<Text style={{ color: accent }}>.</Text>
          </Text>
        </Pressable>
        <Text style={s.section}>SEU ESPAÇO DE JOGO</Text>
        {nav.map((item) => {
          const active =
            item.path === "/"
              ? !["/history", "/about", "/cloud"].includes(pathname)
              : pathname === item.path;
          return (
            <Pressable
              key={item.path}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              onPress={() => router.push(item.path)}
              style={({ pressed }) => [
                s.nav,
                (active || pressed) && {
                  backgroundColor: active ? "#2B211E" : "#1B1D22",
                },
              ]}
            >
              <Icon name={item.icon} color={active ? accent : "#8B8E99"} />
              <Text style={[s.navText, active && { color: accent }]}>
                {item.label}
              </Text>
              {active && <View style={s.dot} />}
            </Pressable>
          );
        })}
        <View style={{ flex: 1 }} />
        <View style={s.localCard}>
          <Icon name="shield" size={23} color={accent} />
          <Text style={s.localTitle}>O jogo continua offline.</Text>
          <Text style={s.localText}>
            Seus torneios ficam salvos neste dispositivo. Sem conta, sem
            complicação.
          </Text>
        </View>
        <View style={s.profile}>
          <View style={s.avatar}>
            <Icon name="flag" color="#D9D9E0" size={20} />
          </View>
          <View>
            <Text
              style={{
                color: "#E7E7EC",
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
              }}
            >
              Organizador local
            </Text>
            <Text style={{ color: "#7E818E", fontSize: 11, marginTop: 4 }}>
              Seu espaço pessoal
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.topbar}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            {!root && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                onPress={() =>
                  router.canGoBack() ? router.back() : router.push("/")
                }
              >
                <Icon name="arrowLeft" size={19} />
              </Pressable>
            )}
            <Text style={s.breadcrumb}>Meu espaço</Text>
            <Icon name="chevron" size={14} color="#50545F" />
            <Text style={s.current}>{title}</Text>
          </View>
          <View style={s.offline}>
            <View style={[s.dot, { backgroundColor: "#81C9A1" }]} />
            <Text style={s.offlineText}>Armazenamento local</Text>
          </View>
        </View>
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  frame: { flex: 1, flexDirection: "row", backgroundColor: "#13151A" },
  sidebar: {
    width: 230,
    padding: 22,
    paddingTop: 32,
    backgroundColor: "#101115",
    borderRightWidth: 1,
    borderRightColor: "#27292F",
    gap: 8,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 48,
  },
  mark: {
    width: 37,
    height: 39,
    backgroundColor: accent,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  wordmark: {
    fontFamily: "BarlowCondensed_700Bold",
    color: "#F4F3F5",
    letterSpacing: 2,
    fontSize: 36,
  },
  section: {
    fontFamily: "Inter_600SemiBold",
    color: "#6D707D",
    letterSpacing: 1.5,
    fontSize: 9,
    marginBottom: 12,
    paddingLeft: 10,
  },
  nav: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  navText: {
    color: "#A6A8B2",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  dot: { height: 6, width: 6, borderRadius: 3, backgroundColor: accent },
  localCard: {
    backgroundColor: "#191B20",
    borderRadius: 12,
    padding: 17,
    gap: 11,
    borderWidth: 1,
    borderColor: "#292B33",
    marginBottom: 14,
  },
  localTitle: {
    color: "#DDDEE5",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 19,
  },
  localText: {
    color: "#828694",
    fontSize: 11,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  profile: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#27292F",
    paddingTop: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2B2E36",
    alignItems: "center",
    justifyContent: "center",
  },
  topbar: {
    height: 74,
    paddingHorizontal: 36,
    borderBottomWidth: 1,
    borderBottomColor: "#262830",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breadcrumb: {
    color: "#80838F",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  current: { color: "#DEDFE7", fontSize: 12, fontFamily: "Inter_500Medium" },
  offline: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#1B2421",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },
  offlineText: {
    color: "#9BC5AD",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
});
