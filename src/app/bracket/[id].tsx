import { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import type { Match } from "../../domain";
import { useTournament } from "../../use-tournament";
import {
  Button,
  colors,
  Empty,
  Heading,
  Screen,
  styles,
} from "../../components/ui";
import { TournamentState } from "../../components/tournament-state";

const CARD_HEIGHT = 184;
const SLOT_HEIGHT = 212;
const COLUMN_WIDTH = 252;
const CONNECTOR_WIDTH = 36;

export default function Bracket() {
  const { tournament: t, id, loading, error } = useTournament();
  const [round, setRound] = useState(0);
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width >= 1000;
  if (!t) return <TournamentState loading={loading} error={error} />;

  const lastRound = t.matches.at(-1)?.round ?? 0;
  const rounds = Array.from({ length: lastRound + 1 }, (_, r) => r);
  const firstRound = t.matches.filter((match) => match.round === 0);
  const bracketHeight = firstRound.length * SLOT_HEIGHT;
  const seed = (pid: string | null) => {
    const index = firstRound
      .flatMap((match) => [match.a, match.b])
      .filter(Boolean)
      .indexOf(pid);
    return index >= 0 ? String(index + 1).padStart(2, "0") : "—";
  };
  const name = (pid: string | null) =>
    t.participants.find((participant) => participant.id === pid)?.name ??
    "Aguardando vencedor";
  const roundName = (r: number) =>
    r === lastRound
      ? "Final"
      : r === lastRound - 1
        ? "Semifinal"
        : r === lastRound - 2
          ? "Quartas de final"
          : "Oitavas de final";
  const empty = (
    <Empty
      title="O sorteio ainda não aconteceu"
      message="Confirme os participantes e inicie o campeonato na central."
      action={<Button title="Voltar à central" onPress={() => router.back()} />}
    />
  );

  function matchCard(match: Match) {
    const playable = !match.bye && !!match.a && !!match.b;
    const status = match.bye
      ? "AVANÇO AUTOMÁTICO"
      : match.winnerId
        ? "ENCERRADA"
        : playable
          ? "PRONTA PARA JOGAR"
          : "AGUARDANDO";
    return (
      <View
        style={[
          local.card,
          desktop && { height: CARD_HEIGHT },
          match.winnerId ? { borderColor: colors.muted } : undefined,
        ]}
      >
        <View style={local.cardHeader}>
          <Text style={local.matchNumber}>
            JOGO {String(match.index + 1).padStart(2, "0")}
          </Text>
          <Text
            style={[
              local.status,
              playable && !match.winnerId && { color: colors.lime },
            ]}
          >
            {status}
          </Text>
        </View>
        {[
          { pid: match.a, score: match.scoreA },
          { pid: match.b, score: match.scoreB },
        ].map(({ pid, score }, index) => {
          const won = !!pid && match.winnerId === pid;
          const label = match.bye && index === 1 ? "Sem adversário" : name(pid);
          return (
            <View
              key={index}
              style={[
                local.player,
                index === 0 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={local.seed}>{seed(pid)}</Text>
              <Text
                numberOfLines={1}
                accessibilityLabel={`${label}${won ? ", vencedor" : ""}`}
                style={[local.playerName, won && { color: colors.lime }]}
              >
                {label}
              </Text>
              <Text style={[local.score, won && { color: colors.lime }]}>
                {score ?? (won ? "✓" : "—")}
              </Text>
            </View>
          );
        })}
        {playable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${match.winnerId ? "Ver ou corrigir resultado" : "Registrar resultado"}: ${name(match.a)} contra ${name(match.b)}`}
            onPress={() =>
              router.push({
                pathname: "/match/[id]",
                params: { id, matchId: match.id },
              })
            }
            style={({ pressed }) => [
              local.action,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Text style={local.actionText}>
              {match.winnerId
                ? "Ver ou corrigir resultado"
                : "Registrar resultado"}
            </Text>
            <Text style={{ color: colors.lime }}>→</Text>
          </Pressable>
        ) : (
          <View style={local.action}>
            <Text style={local.pending}>
              {match.bye
                ? "Classificado para a próxima fase"
                : "Aguardando partidas anteriores"}
            </Text>
          </View>
        )}
      </View>
    );
  }

  const heading = (
    <Heading
      eyebrow="CAMINHO ATÉ O TÍTULO"
      title="O chaveamento."
      description={`${t.name} · ${t.participants.length} participantes · Eliminação simples`}
    />
  );
  if (desktop) {
    return (
      <Screen>
        {heading}
        <View style={local.legend}>
          <View style={local.dot} />
          <Text style={styles.small}>Vencedores em destaque</Text>
          <Text style={styles.small}>
            O sorteio permanece salvo neste aparelho.
          </Text>
        </View>
        {!t.matches.length ? (
          empty
        ) : (
          <ScrollView
            horizontal
            contentContainerStyle={{ paddingRight: 20, paddingBottom: 12 }}
          >
            <View style={{ flexDirection: "row", gap: CONNECTOR_WIDTH }}>
              {rounds.map((r) => (
                <View key={r} style={{ width: COLUMN_WIDTH }}>
                  <View style={local.roundHeader}>
                    <Text style={local.roundTitle}>{roundName(r)}</Text>
                    <Text style={styles.small}>
                      {t.matches.filter((match) => match.round === r).length}{" "}
                      jogo(s)
                    </Text>
                  </View>
                  <View style={{ height: bracketHeight }}>
                    {t.matches
                      .filter((match) => match.round === r)
                      .map((match) => {
                        const slot = SLOT_HEIGHT * 2 ** r;
                        const center = slot * (match.index + 0.5);
                        return (
                          <View
                            key={match.id}
                            style={{
                              position: "absolute",
                              top: center - CARD_HEIGHT / 2,
                              width: COLUMN_WIDTH,
                            }}
                          >
                            {r > 0 && (
                              <View
                                pointerEvents="none"
                                style={[
                                  local.connector,
                                  {
                                    left: -CONNECTOR_WIDTH / 2,
                                    top: CARD_HEIGHT / 2,
                                    width: CONNECTOR_WIDTH / 2,
                                    borderTopWidth: 1,
                                  },
                                ]}
                              />
                            )}
                            {r < lastRound && (
                              <>
                                <View
                                  pointerEvents="none"
                                  style={[
                                    local.connector,
                                    {
                                      right: -CONNECTOR_WIDTH / 2,
                                      top: CARD_HEIGHT / 2,
                                      width: CONNECTOR_WIDTH / 2,
                                      borderTopWidth: 1,
                                    },
                                  ]}
                                />
                                <View
                                  pointerEvents="none"
                                  style={[
                                    local.connector,
                                    {
                                      right: -CONNECTOR_WIDTH / 2,
                                      top:
                                        match.index % 2 === 0
                                          ? CARD_HEIGHT / 2
                                          : CARD_HEIGHT / 2 - slot / 2,
                                      height: slot / 2,
                                      borderRightWidth: 1,
                                    },
                                  ]}
                                />
                              </>
                            )}
                            {matchCard(match)}
                          </View>
                        );
                      })}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={t.matches.filter((match) => match.round === round)}
        keyExtractor={(match) => match.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            {heading}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            >
              {rounds.map((r) => (
                <Pressable
                  key={r}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: r === round }}
                  onPress={() => setRound(r)}
                  style={[
                    local.tab,
                    {
                      backgroundColor:
                        r === round ? colors.lime : colors.elevated,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: r === round ? colors.bg : colors.text,
                    }}
                  >
                    {roundName(r)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={empty}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item }) => matchCard(item)}
      />
    </Screen>
  );
}

const local = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  matchNumber: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.6,
  },
  status: { fontSize: 9, fontWeight: "700", color: colors.muted },
  player: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  seed: {
    color: colors.muted,
    fontSize: 10,
    width: 18,
    fontVariant: ["tabular-nums"],
  },
  playerName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
  score: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18,
    minWidth: 28,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  action: {
    minHeight: 50,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    gap: 6,
  },
  actionText: { color: colors.lime, fontSize: 11, fontWeight: "700" },
  pending: { color: colors.muted, fontSize: 10 },
  roundHeader: {
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 5,
    marginBottom: 14,
  },
  roundTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  connector: { position: "absolute", borderColor: colors.border },
  legend: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lime },
  tab: { padding: 13, borderRadius: 8 },
});
