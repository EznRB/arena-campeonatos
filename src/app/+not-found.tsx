import { router } from "expo-router";
import { Button, Empty, Screen } from "../components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Empty
        title="Essa arena não existe"
        message="Volte ao início para encontrar seus campeonatos."
        action={
          <Button title="Ir ao início" onPress={() => router.replace("/")} />
        }
      />
    </Screen>
  );
}
