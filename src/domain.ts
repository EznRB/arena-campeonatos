export interface Participant {
  id: string;
  name: string;
  checkedIn: boolean;
}
export interface Match {
  id: string;
  round: number;
  index: number;
  a: string | null;
  b: string | null;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  bye: boolean;
}
export interface Tournament {
  id: string;
  name: string;
  game: string;
  location: string;
  startsAt: string;
  createdAt: string;
  participants: Participant[];
  matches: Match[];
  status: "draft" | "active" | "finished";
  notificationId?: string;
}
function fail(message: string): never {
  throw new Error(message);
}
function label(value: unknown, field = "Nome"): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 60)
    fail(`${field} deve ter de 1 a 60 caracteres.`);
  return value.trim();
}
function place(value: unknown): string {
  if (typeof value !== "string" || value.trim().length > 120)
    fail("Local deve ter até 120 caracteres.");
  return value.trim();
}
function identifier(value: unknown): asserts value is string {
  if (typeof value !== "string" || !value.trim() || value.length > 200)
    fail("Identificador inválido.");
}
function date(value: unknown): asserts value is string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    fail("Data inválida.");
}
const copy = (t: Tournament): Tournament => ({
  ...t,
  participants: t.participants.map((p) => ({ ...p })),
  matches: t.matches.map((m) => ({ ...m })),
});
function editable(t: Tournament) {
  if (t.status !== "draft")
    fail("Participantes só podem ser alterados antes do início.");
}
export function newTournament(
  input: { name: string; game: string; location: string; startsAt: string },
  id: string,
): Tournament {
  identifier(id);
  date(input.startsAt);
  return {
    id,
    name: label(input.name),
    game: label(input.game, "Modalidade"),
    location: place(input.location),
    startsAt: input.startsAt,
    createdAt: new Date().toISOString(),
    participants: [],
    matches: [],
    status: "draft",
  };
}
export function addParticipant(
  t: Tournament,
  name: string,
  id: string,
): Tournament {
  editable(t);
  identifier(id);
  name = label(name);
  if (
    t.participants.some(
      (p) =>
        p.id === id || p.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
  )
    fail("Participante já cadastrado.");
  if (t.participants.length >= 16) fail("Máximo de 16 participantes.");
  const next = copy(t);
  next.participants.push({ id, name, checkedIn: false });
  return next;
}
export function renameParticipant(
  t: Tournament,
  id: string,
  name: string,
): Tournament {
  editable(t);
  if (!t.participants.some((p) => p.id === id))
    fail("Participante não encontrado.");
  name = label(name);
  if (
    t.participants.some(
      (p) =>
        p.id !== id && p.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
  )
    fail("Participante já cadastrado.");
  const next = copy(t);
  next.participants.find((p) => p.id === id)!.name = name;
  return next;
}
export function removeParticipant(t: Tournament, id: string): Tournament {
  editable(t);
  if (!t.participants.some((p) => p.id === id))
    fail("Participante não encontrado.");
  return {
    ...copy(t),
    participants: t.participants
      .filter((p) => p.id !== id)
      .map((p) => ({ ...p })),
  };
}
export function checkIn(t: Tournament, id: string): Tournament {
  if (!t.participants.some((p) => p.id === id))
    fail("Participante não encontrado.");
  const next = copy(t);
  next.participants.find((p) => p.id === id)!.checkedIn = true;
  return next;
}
function propagate(t: Tournament): Tournament {
  for (const m of t.matches) {
    if (m.round > 0) {
      const previous = t.matches.filter((p) => p.round === m.round - 1);
      m.a = previous[m.index * 2].winnerId ?? null;
      m.b = previous[m.index * 2 + 1].winnerId ?? null;
    }
  }
  t.status = t.matches.at(-1)?.winnerId ? "finished" : "active";
  return t;
}
export function startTournament(
  t: Tournament,
  random: () => number = Math.random,
): Tournament {
  editable(t);
  const count = t.participants.length;
  if (count < 4 || count > 16)
    fail("O campeonato precisa de 4 a 16 participantes.");
  if (t.participants.some((p) => !p.checkedIn))
    fail("Confirme a presença de todos os participantes antes de iniciar.");
  const ids = t.participants.map((p) => p.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const r = random();
    if (!Number.isFinite(r) || r < 0 || r >= 1) fail("Sorteio inválido.");
    const j = Math.floor(r * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const next = copy(t);
  next.matches = [];
  const size = 2 ** Math.ceil(Math.log2(count));
  let cursor = 0;
  const byes = size - count;
  for (let round = 0, width = size / 2; width >= 1; round++, width /= 2) {
    for (let index = 0; index < width; index++) {
      const bye = round === 0 && index < byes;
      const a = round === 0 ? ids[cursor++] : null;
      const b = round === 0 && !bye ? ids[cursor++] : null;
      next.matches.push({
        id: `${t.id}:r${round}:m${index}`,
        round,
        index,
        a,
        b,
        bye,
        ...(bye ? { winnerId: a! } : {}),
      });
    }
  }
  return propagate(next);
}
export function recordResult(
  t: Tournament,
  matchId: string,
  scoreA: number,
  scoreB: number,
  tieWinnerId?: string,
): Tournament {
  if (t.status === "draft") fail("Inicie o campeonato primeiro.");
  const next = copy(t);
  const m = next.matches.find((m) => m.id === matchId);
  if (!m || !m.a || !m.b || m.bye) fail("Partida indisponível.");
  if (![scoreA, scoreB].every((s) => Number.isInteger(s) && s >= 0 && s <= 999))
    fail("Placar deve ser inteiro entre 0 e 999.");
  if (scoreA === scoreB && tieWinnerId !== m.a && tieWinnerId !== m.b)
    fail("Escolha o vencedor do desempate.");
  let index = m.index;
  for (let round = m.round + 1; round <= next.matches.at(-1)!.round; round++) {
    index = Math.floor(index / 2);
    const descendant = next.matches.find(
      (p) => p.round === round && p.index === index,
    )!;
    if (descendant.scoreA !== undefined)
      fail("Uma partida seguinte já tem resultado.");
    delete descendant.winnerId;
    delete descendant.scoreA;
    delete descendant.scoreB;
  }
  m.scoreA = scoreA;
  m.scoreB = scoreB;
  m.winnerId = scoreA === scoreB ? tieWinnerId : scoreA > scoreB ? m.a : m.b;
  return propagate(next);
}
export function champion(t: Tournament): Participant | undefined {
  return t.status === "finished"
    ? t.participants.find((p) => p.id === t.matches.at(-1)?.winnerId)
    : undefined;
}
export function qrPayload(tournamentId: string, participantId: string): string {
  identifier(tournamentId);
  identifier(participantId);
  return JSON.stringify({ v: 1, tournamentId, participantId });
}
export function parseQr(raw: string, tournamentId: string): string {
  try {
    if (raw.length > 4096) fail("QR Code muito extenso.");
    const data = JSON.parse(raw);
    if (data.v !== 1 || data.tournamentId !== tournamentId)
      fail("QR de outro campeonato ou versão inválida.");
    identifier(data.participantId);
    return data.participantId;
  } catch {
    fail("QR Code inválido para este campeonato.");
  }
}
export function parseTournaments(raw: string | null): Tournament[] {
  if (raw === null) return [];
  try {
    const values = JSON.parse(raw);
    if (!Array.isArray(values)) fail("Formato inválido.");
    const ids = new Set<string>();
    for (const t of values) {
      if (!t || typeof t !== "object") fail("Campeonato inválido.");
      identifier(t.id);
      if (ids.has(t.id)) fail("ID duplicado.");
      ids.add(t.id);
      for (const key of ["name", "game"])
        if (label(t[key]) !== t[key]) fail("Texto inválido.");
      if (place(t.location) !== t.location) fail("Local inválido.");
      date(t.startsAt);
      date(t.createdAt);
      if (t.notificationId !== undefined) identifier(t.notificationId);
      if (
        !Array.isArray(t.participants) ||
        t.participants.length > 16 ||
        !Array.isArray(t.matches)
      )
        fail("Dados inválidos.");
      const pids = new Set<string>(),
        names = new Set<string>();
      for (const p of t.participants) {
        if (!p || typeof p !== "object") fail("Participante inválido.");
        identifier(p.id);
        const name = label(p.name);
        if (
          name !== p.name ||
          typeof p.checkedIn !== "boolean" ||
          pids.has(p.id) ||
          names.has(name.toLocaleLowerCase())
        )
          fail("Participante inválido.");
        pids.add(p.id);
        names.add(name.toLocaleLowerCase());
      }
      if (t.status === "draft") {
        if (t.matches.length) fail("Rascunho inconsistente.");
        continue;
      }
      if (t.status !== "active" && t.status !== "finished")
        fail("Estado inválido.");
      if (t.participants.length < 4) fail("Participantes insuficientes.");
      const size = 2 ** Math.ceil(Math.log2(t.participants.length));
      if (t.matches.length !== size - 1) fail("Chaveamento inválido.");
      let cursor = 0;
      const seen = new Set<string>();
      for (let round = 0, width = size / 2; width >= 1; round++, width /= 2) {
        for (let index = 0; index < width; index++) {
          const m = t.matches[cursor++];
          if (
            !m ||
            m.id !== `${t.id}:r${round}:m${index}` ||
            m.round !== round ||
            m.index !== index ||
            typeof m.bye !== "boolean"
          )
            fail("Partida inválida.");
          for (const p of [m.a, m.b])
            if (p !== null && !pids.has(p)) fail("Participante desconhecido.");
          if (round === 0) {
            if (!m.a || (!m.b && !m.bye) || (m.b && m.bye))
              fail("Bye inválido.");
            for (const p of [m.a, m.b])
              if (p) {
                if (seen.has(p)) fail("Participante repetido.");
                seen.add(p);
              }
          } else {
            const prev = t.matches.filter((p: Match) => p.round === round - 1);
            if (
              m.bye ||
              m.a !== (prev[index * 2].winnerId ?? null) ||
              m.b !== (prev[index * 2 + 1].winnerId ?? null)
            )
              fail("Progressão inválida.");
          }
          if (m.bye) {
            if (
              m.winnerId !== m.a ||
              m.scoreA !== undefined ||
              m.scoreB !== undefined
            )
              fail("Bye inválido.");
          } else if (m.scoreA !== undefined || m.scoreB !== undefined) {
            if (
              !m.a ||
              !m.b ||
              ![m.scoreA, m.scoreB].every(
                (s) => Number.isInteger(s) && s >= 0 && s <= 999,
              ) ||
              ![m.a, m.b].includes(m.winnerId) ||
              (m.scoreA > m.scoreB && m.winnerId !== m.a) ||
              (m.scoreB > m.scoreA && m.winnerId !== m.b)
            )
              fail("Resultado inválido.");
          } else if (m.winnerId !== undefined) fail("Vencedor sem placar.");
        }
      }
      if (
        seen.size !== t.participants.length ||
        (t.status === "finished") !== Boolean(t.matches.at(-1).winnerId)
      )
        fail("Campeonato inconsistente.");
    }
    return values;
  } catch {
    fail(
      "Não foi possível ler os dados salvos. Os dados foram preservados; tente recuperá-los antes de restaurar.",
    );
  }
}
