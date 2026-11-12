import { useLocalSearchParams } from "expo-router";
import { useTournaments } from "./store";

export function useTournament() {
  const params = useLocalSearchParams<{ id: string }>();
  const store = useTournaments();
  const id = typeof params.id === "string" ? params.id : "";
  return {
    ...store,
    id,
    tournament: store.tournaments.find((item) => item.id === id),
  };
}
