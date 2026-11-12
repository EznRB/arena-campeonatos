import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import { AppShell } from "./app-shell";
import { Icon, type IconName } from "./icon";

export const colors = {
  bg: "#13151A",
  surface: "#1B1E25",
  elevated: "#272B34",
  text: "#F0F0F4",
  muted: "#9DA1B0",
  lime: "#FF8055",
  border: "#30333E",
  red: "#FF969F",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: 28,
    gap: 22,
    paddingBottom: 48,
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
  },
  title: {
    fontSize: 46,
    fontFamily: "BarlowCondensed_700Bold",
    color: colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 23,
    fontFamily: "Inter_400Regular",
  },
  label: {
    color: colors.lime,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  heading: {
    fontSize: 18,
    color: colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 23,
    fontFamily: "Inter_400Regular",
  },
  small: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
});

export function Screen({
  children,
  scroll = true,
  maxWidth = 1240,
}: PropsWithChildren<{ scroll?: boolean; maxWidth?: number }>) {
  return (
    <AppShell>
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.page}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, { maxWidth }]}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </SafeAreaView>
    </AppShell>
  );
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {eyebrow && <Text style={styles.label}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description && <Text style={styles.subtitle}>{description}</Text>}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        minHeight: 50,
        borderRadius: 9,
        paddingHorizontal: 18,
        paddingVertical: 13,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 9,
        borderWidth: 1,
        borderColor: secondary ? colors.border : "transparent",
        backgroundColor: secondary
          ? colors.elevated
          : danger
            ? "#702E39"
            : colors.lime,
        opacity: disabled ? 0.45 : pressed ? 0.75 : hovered ? 0.88 : 1,
      })}
    >
      {icon && (
        <Icon
          name={icon}
          size={17}
          color={secondary || danger ? colors.text : colors.bg}
        />
      )}
      <Text
        style={{
          color: secondary || danger ? colors.text : colors.bg,
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.text}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[
          {
            minHeight: 52,
            borderWidth: 1,
            borderColor: focused ? colors.lime : colors.border,
            borderRadius: 12,
            paddingHorizontal: 15,
            paddingVertical: 12,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: 14,
            fontFamily: "Inter_400Regular",
          },
          props.style,
        ]}
      />
    </View>
  );
}
export function Empty({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <Icon name="flag" size={28} color={colors.lime} />
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subtitle}>{message}</Text>
      {action}
    </Card>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 40 }}>
      <ActivityIndicator
        color={colors.lime}
        accessibilityLabel="Carregando campeonatos"
      />
    </View>
  );
}
export function showError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Não foi possível concluir. Tente novamente.";
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Confira esta ação", message);
}
export async function runAction(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    showError(error);
  }
}
export function confirmAction(
  title: string,
  message: string,
  action: () => void,
) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) action();
  } else
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: action },
    ]);
}
export function dateLabel(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
