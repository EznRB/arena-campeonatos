import { router } from "expo-router";
import { Button, Empty, Loading, Screen } from "./ui";

export function TournamentState({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  return (
    <Screen>
      {loading ? (
        <Loading />
      ) : (
        <Empty
          title={error ? "Falha no armazenamento" : "Campeonato não encontrado"}
          message={error ?? "Este registro não está disponível neste aparelho."}
          action={
            <Button
              title="Voltar ao início"
              onPress={() => router.replace("/")}
            />
          }
        />
      )}
    </Screen>
  );
}
