import {
  addParticipant,
  checkIn,
  newTournament,
  recordResult,
  startTournament,
} from "./domain.ts";
import type { Tournament } from "./domain.ts";

/** Cria uma cópia demonstrativa independente, sem alterar campeonatos reais. */
export function createDemoTournament(
  id: string,
  now: Date = new Date(),
): Tournament {
  let tournament = newTournament(
    {
      name: "Copa Arena • Demo",
      game: "EA FC",
      location: "Arena Campus",
      startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    id,
  );
  const names = [
    "Lucas Silva",
    "Mariana Santos",
    "Pedro Oliveira",
    "Ana Costa",
    "Gabriel Lima",
    "Beatriz Souza",
    "Rafael Alves",
    "Juliana Pereira",
  ];
  names.forEach((name, index) => {
    const participantId = `${id}:p${index + 1}`;
    tournament = addParticipant(tournament, name, participantId);
    tournament = checkIn(tournament, participantId);
  });
  tournament = startTournament(tournament, () => 0.5);
  tournament = recordResult(tournament, tournament.matches[0].id, 3, 1);
  tournament = recordResult(tournament, tournament.matches[1].id, 1, 2);
  return tournament;
}
