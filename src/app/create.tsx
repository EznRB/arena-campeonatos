import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Icon } from "../components/icon";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { newTournament } from "../domain";
import { useTournaments } from "../store";
import {
  Button,
  Card,
  Field,
  Heading,
  runAction,
  Screen,
  styles,
} from "../components/ui";

export default function Create() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const { update, loading, saving, error } = useTournaments();
  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) return;
    setBusy(true);
    await runAction(async () => {
      const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
      const clock = /^(\d{2}):(\d{2})$/.exec(time);
      if (!parts || !clock)
        throw new Error("Use data DD/MM/AAAA e horário HH:MM.");
      const [, day, month, year] = parts.map(Number);
      const [, hour, minute] = clock.map(Number);
      const starts = new Date(year, month - 1, day, hour, minute);
      if (
        year < 2026 ||
        starts.getFullYear() !== year ||
        starts.getMonth() !== month - 1 ||
        starts.getDate() !== day ||
        hour > 23 ||
        minute > 59
      )
        throw new Error(
          "Informe uma data e um horário válidos, a partir de 2026.",
        );
      const item = newTournament(
        { name, game, location, startsAt: starts.toISOString() },
        Crypto.randomUUID(),
      );
      await update((items) => [item, ...items]);
      router.replace({ pathname: "/tournament/[id]", params: { id: item.id } });
    });
    setBusy(false);
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <Heading
          eyebrow="NOVA DISPUTA"
          title="Prepare a arena."
          description="Comece pelo encontro. Os participantes entram na próxima etapa."
        />
        <View
          style={{
            flexDirection: wide ? "row" : "column",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          <View
            style={{
              flex: wide ? 2 : undefined,
              width: wide ? undefined : "100%",
            }}
          >
            <Card>
              <Text style={styles.label}>01 · SOBRE O ENCONTRO</Text>
              <Field
                label="Nome do campeonato"
                placeholder="Copa da República"
                value={name}
                onChangeText={setName}
                maxLength={60}
              />
              <Field
                label="Modalidade ou jogo"
                placeholder="EA FC, tênis de mesa, xadrez…"
                value={game}
                onChangeText={setGame}
                maxLength={60}
              />
              <Field
                label="Local (opcional)"
                placeholder="Sala de jogos do campus"
                value={location}
                onChangeText={setLocation}
                maxLength={120}
              />
              <View style={{ flexDirection: "row", gap: 14 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Data · DD/MM/AAAA"
                    placeholder="07/12/2026"
                    value={date}
                    onChangeText={setDate}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Horário local · HH:MM"
                    placeholder="18:30"
                    value={time}
                    onChangeText={setTime}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              </View>
              <View style={{ marginTop: 10 }}>
                <Button
                  title={busy ? "Criando…" : "Criar campeonato"}
                  icon="arrowRight"
                  disabled={busy || loading || saving || !!error}
                  onPress={() => void submit()}
                />
              </View>
            </Card>
          </View>
          <View
            style={{
              flex: wide ? 1 : undefined,
              width: wide ? undefined : "100%",
              gap: 18,
            }}
          >
            <Card>
              <Icon name="swords" size={29} color="#FF8055" />
              <Text style={styles.heading}>Mata-mata, sem complicação</Text>
              <Text style={styles.subtitle}>
                4 a 16 participantes. Uma derrota elimina. Havendo empate, você
                informa quem venceu o desempate.
              </Text>
            </Card>
            <Card>
              <Text style={styles.label}>O CAMINHO ATÉ O TÍTULO</Text>
              {[
                ["01", "Prepare o encontro"],
                ["02", "Convide os participantes"],
                ["03", "Sorteie os confrontos"],
                ["04", "Celebre o campeão"],
              ].map(([number, text]) => (
                <View
                  key={number}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#FF8055",
                      fontFamily: "BarlowCondensed_700Bold",
                      fontSize: 23,
                    }}
                  >
                    {number}
                  </Text>
                  <Text style={styles.text}>{text}</Text>
                </View>
              ))}
            </Card>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
