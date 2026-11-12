import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import {
  addParticipant,
  checkIn,
  removeParticipant,
  renameParticipant,
} from "../../domain";
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
import { Icon } from "../../components/icon";
import { TournamentState } from "../../components/tournament-state";

export default function Participants() {
  const { tournament: t, id, loading, error, saving, update } = useTournament();
  const { width } = useWindowDimensions();
  const wide = Platform.OS === "web" && width >= 1000;
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  if (!t) return <TournamentState loading={loading} error={error} />;
  async function add() {
    await runAction(async () => {
      await update((items) =>
        replaceTournament(items, id, (item) =>
          addParticipant(item, name, Crypto.randomUUID()),
        ),
      );
      setName("");
      feedback();
    });
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll={false}>
        <FlatList
          data={t.participants}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={{ gap: 20, marginBottom: 8 }}>
              <Heading
                eyebrow="QUEM VAI ENTRAR EM JOGO"
                title="Participantes"
                description={`${t.participants.length}/16 inscritos · ${t.participants.filter((p) => p.checkedIn).length} confirmados`}
              />
              {t.status === "draft" && (
                <Card>
                  <View
                    style={[
                      layout.registration,
                      wide && layout.registrationWide,
                    ]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Field
                        label="Nome do jogador ou equipe"
                        value={name}
                        onChangeText={setName}
                        maxLength={60}
                        placeholder="Quem vai disputar?"
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (!saving) void add();
                        }}
                      />
                    </View>
                    <View style={wide ? { width: 230 } : undefined}>
                      <Button
                        icon="plus"
                        title="Adicionar participante"
                        disabled={
                          saving || !name.trim() || t.participants.length >= 16
                        }
                        onPress={() => void add()}
                      />
                    </View>
                  </View>
                  <Text style={styles.small}>
                    Inscreva de 4 a 16 jogadores ou equipes para iniciar o
                    torneio.
                  </Text>
                </Card>
              )}
              {t.status === "draft" && (
                <View style={layout.toolbar}>
                  <Button
                    icon="qr"
                    title="Ler QR Code de inscrição"
                    secondary
                    onPress={() =>
                      router.push({ pathname: "/scanner/[id]", params: { id } })
                    }
                  />
                  <Text style={styles.small}>
                    Confira a presença pelo cartão de inscrição ou pela lista
                    abaixo.
                  </Text>
                </View>
              )}
              {t.status !== "draft" && (
                <Text style={styles.small}>
                  As inscrições estão fechadas. O sorteio já foi realizado.
                </Text>
              )}
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          ListEmptyComponent={
            <Empty
              title="Quem vai disputar o título?"
              message="Adicione os jogadores ou equipes. Você precisa de pelo menos quatro para começar."
            />
          }
          renderItem={({ item, index }) => (
            <Card style={{ padding: 18, gap: 16 }}>
              <View
                style={[
                  layout.participantTop,
                  wide && layout.participantTopWide,
                ]}
              >
                <View style={layout.identity}>
                  <View style={layout.number}>
                    <Text style={layout.numberText}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 7, minWidth: 0 }}>
                    <Text style={[styles.heading, { fontSize: 16 }]}>
                      {item.name}
                    </Text>
                    <View
                      style={[
                        layout.badge,
                        item.checkedIn && layout.badgePresent,
                      ]}
                    >
                      <Icon
                        name={item.checkedIn ? "check" : "users"}
                        size={12}
                        color={item.checkedIn ? colors.lime : colors.muted}
                      />
                      <Text
                        style={{
                          color: item.checkedIn ? colors.lime : colors.muted,
                          fontSize: 11,
                          fontFamily: "Inter_600SemiBold",
                        }}
                      >
                        {item.checkedIn ? "Presente" : "A confirmar"}
                      </Text>
                    </View>
                  </View>
                </View>
                {t.status === "draft" && (
                  <View style={[layout.actions, wide && layout.actionsWide]}>
                    {editing === item.id ? (
                      <View style={layout.editing}>
                        <Field
                          label="Novo nome do participante"
                          value={editedName}
                          onChangeText={setEditedName}
                          maxLength={60}
                        />
                        <View style={layout.editButtons}>
                          <Button
                            title="Salvar nome"
                            disabled={saving || !editedName.trim()}
                            onPress={() =>
                              void runAction(async () => {
                                await update((items) =>
                                  replaceTournament(items, id, (current) =>
                                    renameParticipant(
                                      current,
                                      item.id,
                                      editedName,
                                    ),
                                  ),
                                );
                                setEditing(null);
                              })
                            }
                          />
                          <Button
                            title="Cancelar edição"
                            secondary
                            onPress={() => setEditing(null)}
                          />
                        </View>
                      </View>
                    ) : (
                      <Button
                        title="Editar nome"
                        secondary
                        onPress={() => {
                          setEditing(item.id);
                          setEditedName(item.name);
                        }}
                      />
                    )}
                    {!item.checkedIn && (
                      <Button
                        title="Confirmar presença"
                        icon="check"
                        disabled={saving}
                        onPress={() =>
                          void runAction(async () => {
                            await update((items) =>
                              replaceTournament(items, id, (current) =>
                                checkIn(current, item.id),
                              ),
                            );
                            feedback();
                          })
                        }
                      />
                    )}
                    <Button
                      title="Abrir cartão QR"
                      icon="qr"
                      secondary
                      onPress={() =>
                        router.push({
                          pathname: "/ticket/[id]",
                          params: { id, participantId: item.id },
                        })
                      }
                    />
                    <Button
                      title="Remover participante"
                      icon="close"
                      secondary
                      disabled={saving}
                      onPress={() =>
                        confirmAction(
                          "Remover participante?",
                          `${item.name} sairá da lista de inscritos.`,
                          () =>
                            void runAction(async () => {
                              await update((items) =>
                                replaceTournament(items, id, (current) =>
                                  removeParticipant(current, item.id),
                                ),
                              );
                            }),
                        )
                      }
                    />
                  </View>
                )}
              </View>
            </Card>
          )}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const layout = StyleSheet.create({
  registration: { gap: 16 },
  registrationWide: { flexDirection: "row", alignItems: "flex-end" },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 16,
  },
  participantTop: { gap: 16 },
  participantTopWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: 160,
  },
  number: {
    width: 42,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    color: colors.muted,
    fontSize: 20,
    fontFamily: "BarlowCondensed_700Bold",
  },
  badge: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.elevated,
  },
  badgePresent: { backgroundColor: "#352A28" },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  actionsWide: { justifyContent: "flex-end", flex: 2 },
  editing: { width: "100%", gap: 10 },
  editButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
