import { useRef, useState, type ComponentRef } from "react";
import { Platform, Share, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { champion, startTournament } from "../../domain";
import { replaceTournament } from "../../store";
import { useTournament } from "../../use-tournament";
import { cancelReminder, feedback, scheduleReminder } from "../../native";
import {
  Button,
  Card,
  colors,
  confirmAction,
  dateLabel,
  Heading,
  runAction,
  Screen,
  styles,
} from "../../components/ui";
import { Icon } from "../../components/icon";
import { TournamentState } from "../../components/tournament-state";

export default function TournamentDetail() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const { tournament: t, id, loading, error, update, saving } = useTournament();
  const [busy, setBusy] = useState(false);
  const podium = useRef<ComponentRef<typeof View>>(null);
  if (!t) return <TournamentState loading={loading} error={error} />;
  const winner = champion(t);
  const checked = t.participants.filter((p) => p.checkedIn).length;
  const played = t.matches.filter((m) => m.scoreA !== undefined).length;
  async function remind() {
    if (busy || !t) return;
    setBusy(true);
    await runAction(async () => {
      const notificationId = await scheduleReminder(t);
      try {
        await update((items) =>
          replaceTournament(items, id, (item) => ({ ...item, notificationId })),
        );
      } catch (cause) {
        await cancelReminder(notificationId);
        throw cause;
      }
      if (t.notificationId) await cancelReminder(t.notificationId);
      feedback();
    });
    setBusy(false);
  }
  async function share() {
    if (!t) return;
    await runAction(async () => {
      const message = winner
        ? `🏆 ${winner.name} venceu ${t.name}!\n${t.game} · Arena`
        : `Você está convidado para ${t.name}!\n${t.game}\n${dateLabel(t.startsAt)}\n${t.location || "Local a combinar"}\nFale com o organizador para se inscrever.`;
      if (
        winner &&
        Platform.OS !== "web" &&
        (await Sharing.isAvailableAsync())
      ) {
        const uri = await captureRef(podium, { format: "png", quality: 1 });
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Compartilhar campeão",
        });
      } else if (Platform.OS === "web") {
        if (navigator.share) await navigator.share({ text: message });
        else {
          await navigator.clipboard.writeText(message);
          window.alert("Texto copiado para compartilhar.");
        }
      } else {
        await Share.share({ message });
      }
    });
  }
  function start() {
    confirmAction(
      "Iniciar e sortear?",
      "A lista de participantes será fechada. O sorteio será salvo e todos os inscritos precisam ter presença confirmada.",
      () =>
        void runAction(async () => {
          await update((items) =>
            replaceTournament(items, id, startTournament),
          );
          feedback();
          router.push({ pathname: "/bracket/[id]", params: { id } });
        }),
    );
  }
  function remove() {
    if (!t) return;
    confirmAction(
      "Excluir campeonato?",
      "O torneio e todos os resultados serão removidos deste aparelho. Esta ação não pode ser desfeita.",
      () =>
        void runAction(async () => {
          if (t.notificationId) await cancelReminder(t.notificationId);
          await update((items) => items.filter((item) => item.id !== id));
          router.replace("/");
        }),
    );
  }
  const nextMatch = t.matches.find((m) => m.a && m.b && !m.winnerId);
  const participantName = (pid: string | null) =>
    t.participants.find((p) => p.id === pid)?.name ?? "A definir";
  return (
    <Screen>
      <Heading
        eyebrow={`${t.game.toUpperCase()} · ${t.id.startsWith("demo-") ? "DEMONSTRAÇÃO" : "CENTRAL DO CAMPEONATO"}`}
        title={t.name}
        description={`${dateLabel(t.startsAt)} · ${t.location || "Local a combinar"}`}
      />
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        <View
          style={{
            flex: wide ? 2 : undefined,
            width: wide ? undefined : "100%",
            gap: 20,
          }}
        >
          {winner && (
            <View
              ref={podium}
              collapsable={false}
              style={{
                backgroundColor: "#2D221C",
                borderRadius: 16,
                padding: 38,
                gap: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#72513E",
              }}
            >
              <Text style={styles.label}>ARENA · CAMPEÃO</Text>
              <Icon name="trophy" size={60} color={colors.lime} />
              <Text
                style={[
                  styles.title,
                  { textAlign: "center", color: colors.lime, fontSize: 60 },
                ]}
              >
                {winner.name}
              </Text>
              <Text style={styles.heading}>{t.name}</Text>
              <Text style={styles.small}>
                {t.game} · {played} partidas disputadas
              </Text>
            </View>
          )}
          <Card>
            <View style={styles.row}>
              <View style={{ gap: 9 }}>
                <Text style={styles.label}>STATUS DO TORNEIO</Text>
                <Text style={styles.heading}>
                  {t.status === "draft"
                    ? "Inscrições abertas"
                    : t.status === "active"
                      ? "A disputa está acontecendo"
                      : "Campeonato encerrado"}
                </Text>
              </View>
              <Icon
                name={winner ? "trophy" : "swords"}
                size={28}
                color={colors.lime}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                borderTopWidth: 1,
                borderTopColor: colors.border,
                marginTop: 8,
                paddingTop: 20,
                gap: 22,
                flexWrap: "wrap",
              }}
            >
              {[
                [String(t.participants.length), "participantes"],
                [String(checked), "presenças"],
                [String(played), "partidas disputadas"],
              ].map(([value, label]) => (
                <View key={label} style={{ flex: 1, minWidth: 90, gap: 5 }}>
                  <Text
                    style={{
                      fontFamily: "BarlowCondensed_700Bold",
                      color: colors.text,
                      fontSize: 38,
                    }}
                  >
                    {value.padStart(2, "0")}
                  </Text>
                  <Text style={styles.small}>{label}</Text>
                </View>
              ))}
            </View>
          </Card>
          {nextMatch && (
            <Card>
              <Text style={styles.label}>PRONTA PARA ENTRAR EM JOGO</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 15,
                  paddingVertical: 20,
                }}
              >
                <Text
                  style={[styles.heading, { flex: 1, textAlign: "center" }]}
                >
                  {participantName(nextMatch.a)}
                </Text>
                <Text
                  style={{
                    fontFamily: "BarlowCondensed_700Bold",
                    fontSize: 30,
                    color: "#747D91",
                  }}
                >
                  VS
                </Text>
                <Text
                  style={[styles.heading, { flex: 1, textAlign: "center" }]}
                >
                  {participantName(nextMatch.b)}
                </Text>
              </View>
              <Button
                title="Registrar próxima partida"
                icon="swords"
                onPress={() =>
                  router.push({
                    pathname: "/match/[id]",
                    params: { id, matchId: nextMatch.id },
                  })
                }
              />
            </Card>
          )}
          {t.status === "draft" && (
            <Card>
              <Text style={styles.heading}>Prepare a sua disputa</Text>
              <Text style={styles.subtitle}>
                Cadastre de 4 a 16 jogadores ou equipes e confirme as presenças.
                Quando todos estiverem prontos, sorteie os confrontos.
              </Text>
              <View
                style={{
                  backgroundColor: colors.elevated,
                  height: 4,
                  overflow: "hidden",
                  borderRadius: 3,
                  marginVertical: 8,
                }}
              >
                <View
                  style={{
                    height: 4,
                    width: `${t.participants.length ? (checked / t.participants.length) * 100 : 0}%`,
                    backgroundColor: colors.lime,
                  }}
                />
              </View>
              <Text style={styles.small}>
                O sorteio fecha as inscrições. Os resultados ficam salvos no
                aparelho.
              </Text>
            </Card>
          )}
          {t.id.startsWith("demo-") && (
            <Text style={styles.small}>
              Demonstração editável com dados de exemplo. Seus campeonatos reais
              ficam separados.
            </Text>
          )}
        </View>
        <View
          style={{
            flex: wide ? 1 : undefined,
            width: wide ? undefined : "100%",
            gap: 18,
          }}
        >
          <Card>
            <Text style={styles.label}>CENTRAL DE CONTROLE</Text>
            <Button
              title={
                t.status === "draft"
                  ? "Gerenciar participantes"
                  : "Ver participantes"
              }
              icon="users"
              disabled={saving}
              onPress={() =>
                router.push({ pathname: "/participants/[id]", params: { id } })
              }
            />
            {t.status === "draft" ? (
              <Button
                title="Sortear confrontos e iniciar"
                icon="swords"
                secondary
                disabled={
                  saving ||
                  t.participants.length < 4 ||
                  checked !== t.participants.length
                }
                onPress={start}
              />
            ) : (
              <Button
                title="Abrir chaveamento"
                icon="swords"
                secondary
                onPress={() =>
                  router.push({ pathname: "/bracket/[id]", params: { id } })
                }
              />
            )}
            {t.status === "draft" &&
              (t.participants.length < 4 ||
                checked !== t.participants.length) && (
                <Text style={styles.small}>
                  Para iniciar: cadastre pelo menos 4 participantes e confirme a
                  presença de todos.
                </Text>
              )}
          </Card>
          <Card>
            <Text style={styles.label}>FORA DAS QUATRO LINHAS</Text>
            <Button
              title={winner ? "Compartilhar campeão" : "Compartilhar convite"}
              icon={winner ? "trophy" : "arrowRight"}
              secondary
              onPress={() => void share()}
            />
            {t.status !== "finished" && (
              <>
                <Button
                  title={
                    busy
                      ? "Agendando…"
                      : t.notificationId
                        ? "Reagendar lembrete de início"
                        : "Lembrar no horário de início"
                  }
                  icon="bell"
                  secondary
                  disabled={busy || saving}
                  onPress={() => void remind()}
                />
                {t.notificationId && (
                  <Text style={styles.small}>
                    Lembrete agendado neste aparelho. A entrega depende das
                    permissões do sistema.
                  </Text>
                )}
              </>
            )}
          </Card>
          <View style={{ flexDirection: "row", gap: 9, paddingHorizontal: 4 }}>
            <Icon name="shield" size={16} color={colors.muted} />
            <Text style={[styles.small, { flex: 1 }]}>
              Eliminação simples. Uma pessoa organiza. Tudo salvo neste
              dispositivo.
            </Text>
          </View>
          <Button
            title="Excluir campeonato"
            danger
            disabled={saving || busy}
            onPress={remove}
          />
        </View>
      </View>
    </Screen>
  );
}
