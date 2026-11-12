import { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { recordResult } from "../../domain";
import { replaceTournament } from "../../store";
import { useTournament } from "../../use-tournament";
import { feedback } from "../../native";
import {
  Button,
  Card,
  colors,
  confirmAction,
  Empty,
  Field,
  Heading,
  runAction,
  Screen,
  styles,
} from "../../components/ui";
import { TournamentState } from "../../components/tournament-state";

export default function MatchScreen() {
  const { tournament: t, id, loading, error, saving, update } = useTournament();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const match = t?.matches.find((item) => item.id === matchId);
  const [scoreA, setScoreA] = useState<string | null>(null);
  const [scoreB, setScoreB] = useState<string | null>(null);
  const [tieWinner, setTieWinner] = useState("");
  if (!t) return <TournamentState loading={loading} error={error} />;
  if (!match?.a || !match.b || match.bye)
    return (
      <Screen>
        <Empty
          title="Partida indisponível"
          message="Aguarde os resultados anteriores ou volte ao chaveamento."
        />
      </Screen>
    );
  const a = t.participants.find((p) => p.id === match.a)!;
  const b = t.participants.find((p) => p.id === match.b)!;
  const matchKey = match.id;
  const left = scoreA ?? String(match.scoreA ?? "");
  const right = scoreB ?? String(match.scoreB ?? "");
  const tie = left !== "" && right !== "" && Number(left) === Number(right);
  const selectedWinner =
    tieWinner || (match.scoreA === match.scoreB ? match.winnerId : "") || "";
  function save() {
    if (!/^\d{1,3}$/.test(left) || !/^\d{1,3}$/.test(right)) {
      void runAction(async () => {
        throw new Error(
          "Preencha os dois placares com números inteiros de 0 a 999.",
        );
      });
      return;
    }
    confirmAction(
      "Confirmar resultado?",
      `${a.name} ${left} × ${right} ${b.name}${tie ? "\nO vencedor do desempate precisa estar selecionado." : ""}`,
      () =>
        void runAction(async () => {
          await update((items) =>
            replaceTournament(items, id, (item) =>
              recordResult(
                item,
                matchKey,
                Number(left),
                Number(right),
                selectedWinner || undefined,
              ),
            ),
          );
          feedback();
          router.back();
        }),
    );
  }
  return (
    <Screen maxWidth={680}>
      <Heading
        eyebrow={`RODADA ${match.round + 1} · PARTIDA ${match.index + 1}`}
        title="Quem levou\na melhor?"
        description="Confira o placar antes de confirmar. O vencedor avança automaticamente."
      />
      <Card>
        <Text style={styles.label}>CONFRONTO</Text>
        <Text style={styles.heading}>{a.name}</Text>
        <Field
          label={`Placar de ${a.name}`}
          value={left}
          onChangeText={setScoreA}
          keyboardType="number-pad"
          maxLength={3}
          placeholder="0"
        />
        <Text
          style={[styles.heading, { textAlign: "center", color: colors.muted }]}
        >
          ×
        </Text>
        <Text style={styles.heading}>{b.name}</Text>
        <Field
          label={`Placar de ${b.name}`}
          value={right}
          onChangeText={setScoreB}
          keyboardType="number-pad"
          maxLength={3}
          placeholder="0"
        />
      </Card>
      {tie && (
        <Card>
          <Text style={styles.heading}>Quem venceu o desempate?</Text>
          <Text style={styles.subtitle}>
            Use a regra da modalidade: pênaltis, tempo extra ou outro critério
            combinado.
          </Text>
          {[a, b].map((p) => (
            <View key={p.id}>
              <Button
                title={`${selectedWinner === p.id ? "✓ " : ""}${p.name}`}
                secondary={selectedWinner !== p.id}
                onPress={() => setTieWinner(p.id)}
              />
            </View>
          ))}
        </Card>
      )}
      <Text style={styles.small}>
        Correções ficam bloqueadas se uma partida dependente já tiver resultado
        registrado.
      </Text>
      <Button
        title={
          saving
            ? "Salvando…"
            : match.winnerId
              ? "Confirmar correção"
              : "Confirmar resultado"
        }
        disabled={saving}
        onPress={save}
      />
    </Screen>
  );
}
