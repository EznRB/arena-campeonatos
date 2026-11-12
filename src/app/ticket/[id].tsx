import { useRef, type ComponentRef } from "react";
import { Platform, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { qrPayload } from "../../domain";
import { useTournament } from "../../use-tournament";
import {
  Button,
  colors,
  Empty,
  Heading,
  runAction,
  Screen,
  styles,
} from "../../components/ui";
import { TournamentState } from "../../components/tournament-state";

export default function Ticket() {
  const { tournament: t, loading, error } = useTournament();
  const { participantId } = useLocalSearchParams<{ participantId: string }>();
  const card = useRef<ComponentRef<typeof View>>(null);
  if (!t) return <TournamentState loading={loading} error={error} />;
  const participant = t.participants.find((p) => p.id === participantId);
  if (!participant)
    return (
      <Screen>
        <Empty
          title="Inscrição não encontrada"
          message="Volte à lista de participantes para gerar um cartão."
        />
      </Screen>
    );
  async function share() {
    await runAction(async () => {
      if (Platform.OS === "web") {
        window.print();
        return;
      }
      if (!(await Sharing.isAvailableAsync()))
        throw new Error(
          "Compartilhamento de imagens indisponível neste aparelho. Você pode mostrar o QR na tela.",
        );
      const uri = await captureRef(card, { format: "png", quality: 1 });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Cartão de inscrição Arena",
      });
    });
  }
  return (
    <Screen maxWidth={600}>
      <Heading
        eyebrow="SEU LUGAR NA DISPUTA"
        title="Passaporte\npara a arena."
        description="Envie o cartão ao participante. No encontro, leia o QR pelo celular do organizador."
      />
      <View
        ref={card}
        collapsable={false}
        style={{
          alignItems: "center",
          gap: 22,
          backgroundColor: colors.surface,
          padding: 28,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={styles.label}>ARENA · INSCRIÇÃO</Text>
        <Text style={[styles.title, { textAlign: "center" }]}>
          {participant.name}
        </Text>
        <Text style={[styles.subtitle, { textAlign: "center" }]}>{t.name}</Text>
        <View
          style={{ backgroundColor: "#FFFFFF", padding: 20, borderRadius: 14 }}
        >
          <QRCode value={qrPayload(t.id, participant.id)} size={210} />
        </View>
        <Text style={styles.small}>{t.game} · Apresente no check-in</Text>
      </View>
      <Button
        title={
          Platform.OS === "web"
            ? "Imprimir ou salvar cartão"
            : "Compartilhar cartão QR"
        }
        onPress={() => void share()}
      />
      <Text style={styles.small}>
        O cartão vale apenas para este campeonato no aparelho do organizador.
        Ele não comprova identidade e não transfere os dados do torneio.
      </Text>
    </Screen>
  );
}
