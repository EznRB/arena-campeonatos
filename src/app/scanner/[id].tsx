import { useRef, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "expo-router/react-navigation";
import { checkIn, parseQr } from "../../domain";
import { replaceTournament } from "../../store";
import { useTournament } from "../../use-tournament";
import { feedback } from "../../native";
import {
  Button,
  Card,
  Empty,
  Heading,
  Loading,
  runAction,
  Screen,
  showError,
  styles,
} from "../../components/ui";
import { TournamentState } from "../../components/tournament-state";

export default function Scanner() {
  const { tournament: t, id, loading, error, update } = useTournament();
  const [permission, request] = useCameraPermissions();
  const focused = useIsFocused();
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  async function scan(raw: string) {
    if (lock.current || !t) return;
    lock.current = true;
    await runAction(async () => {
      const pid = parseQr(raw, id);
      const participant = t.participants.find((p) => p.id === pid);
      if (!participant) throw new Error("Este participante não está inscrito.");
      await update((items) =>
        replaceTournament(items, id, (current) => checkIn(current, pid)),
      );
      setMessage(`${participant.name}: presença confirmada.`);
      feedback();
    });
    setMessage(
      (current) =>
        current ||
        "Leitura concluída. Se houve erro, confira o cartão e tente novamente.",
    );
  }
  if (!t) return <TournamentState loading={loading} error={error} />;
  if (t.status !== "draft")
    return (
      <Screen>
        <Empty
          title="Check-in encerrado"
          message="O campeonato já começou. Volte à central para acompanhar os confrontos."
        />
      </Screen>
    );
  return (
    <Screen>
      <Heading
        eyebrow="PRESENÇA CONFIRMADA"
        title="Aponte. Leia.\nEntre em jogo."
        description="Use o QR do cartão de inscrição deste campeonato."
      />
      {!permission ? (
        <Loading />
      ) : !permission.granted ? (
        <Card>
          <Text style={styles.subtitle}>
            Precisamos de acesso à câmera para ler o cartão. Você também pode
            confirmar a presença manualmente na lista.
          </Text>
          <Button
            title={
              permission.canAskAgain ? "Permitir câmera" : "Abrir configurações"
            }
            onPress={() =>
              void runAction(async () => {
                if (permission.canAskAgain) await request();
                else if (Platform.OS !== "web") await Linking.openSettings();
                else
                  throw new Error(
                    "Permita a câmera nas configurações do navegador.",
                  );
              })
            }
          />
        </Card>
      ) : cameraError ? (
        <Empty title="Câmera indisponível" message={cameraError} />
      ) : (
        focused && (
          <View style={{ height: 320, borderRadius: 20, overflow: "hidden" }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={
                message ? undefined : ({ data }) => void scan(data)
              }
              onMountError={({ message: details }) => {
                setCameraError(
                  `Não foi possível iniciar a câmera: ${details}. Use o check-in manual.`,
                );
                showError(new Error(details));
              }}
            />
          </View>
        )
      )}
      {message && (
        <Card>
          <Text accessibilityLiveRegion="polite" style={styles.heading}>
            {message}
          </Text>
          <Button
            title="Ler próximo cartão"
            onPress={() => {
              lock.current = false;
              setMessage("");
            }}
          />
        </Card>
      )}
      <Text style={styles.small}>
        O QR confirma a inscrição, não a identidade. A câmera desliga quando
        você sai desta tela.
      </Text>
    </Screen>
  );
}
