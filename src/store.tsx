import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { parseTournaments, type Tournament } from "./domain";

const KEY = "@arena/tournaments/v1";
type Store = {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  reload: () => Promise<void>;
  update: (change: (current: Tournament[]) => Tournament[]) => Promise<void>;
};
const Context = createContext<Store | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const current = useRef<Tournament[]>([]);
  const ready = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);

  const reload = useCallback(async () => {
    ready.current = false;
    await queue.current;
    setLoading(true);
    setError(null);
    try {
      const data = parseTournaments(await AsyncStorage.getItem(KEY));
      current.current = data;
      setTournaments(data);
      ready.current = true;
    } catch (cause) {
      setError(
        `Não foi possível abrir seus campeonatos. Os dados foram preservados. ${cause instanceof Error ? cause.message : ""}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!active) return;
        const data = parseTournaments(raw);
        current.current = data;
        setTournaments(data);
        ready.current = true;
      })
      .catch((cause) => {
        if (active)
          setError(
            `Não foi possível abrir seus campeonatos. Os dados foram preservados. ${cause instanceof Error ? cause.message : ""}`,
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback((change: (data: Tournament[]) => Tournament[]) => {
    pending.current += 1;
    setSaving(true);
    const task = queue.current.then(async () => {
      if (!ready.current)
        throw new Error(
          "Aguarde o carregamento ou recupere o armazenamento antes de editar.",
        );
      const next = change(current.current);
      // Validate the exact snapshot before writing; publish state only after storage succeeds.
      parseTournaments(JSON.stringify(next));
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      current.current = next;
      setTournaments(next);
    });
    queue.current = task.catch(() => undefined);
    return task.finally(() => {
      pending.current -= 1;
      if (!pending.current) setSaving(false);
    });
  }, []);

  return (
    <Context.Provider
      value={{ tournaments, loading, error, saving, reload, update }}
    >
      {children}
    </Context.Provider>
  );
}

export function useTournaments() {
  const value = useContext(Context);
  if (!value) throw new Error("useTournaments precisa de TournamentProvider.");
  return value;
}

export function replaceTournament(
  items: Tournament[],
  id: string,
  change: (item: Tournament) => Tournament,
) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Campeonato não encontrado.");
  return items.map((item, i) => (i === index ? change(item) : item));
}
