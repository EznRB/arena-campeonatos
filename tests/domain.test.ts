import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newTournament,
  addParticipant,
  renameParticipant,
  removeParticipant,
  checkIn,
  startTournament,
  recordResult,
  champion,
  parseTournaments,
  qrPayload,
  parseQr,
} from "../src/domain.ts";
function draft(n = 4) {
  let t = newTournament(
    {
      name: " Copa ",
      game: "FC",
      location: "Campus",
      startsAt: "2026-12-07T18:00:00.000Z",
    },
    "cup",
  );
  for (let i = 0; i < n; i++) {
    t = addParticipant(t, `Player ${i}`, `p${i}`);
    t = checkIn(t, `p${i}`);
  }
  return t;
}
test("all sizes 4–16 reach exactly one champion with fair byes and immutable input", () => {
  for (let n = 4; n <= 16; n++) {
    const d = draft(n);
    let t = startTournament(d, () => 0.5);
    assert.equal(d.status, "draft");
    assert.equal(
      t.matches
        .filter((m) => m.round === 0)
        .flatMap((m) => [m.a, m.b])
        .filter(Boolean).length,
      n,
    );
    assert.ok(t.matches.filter((m) => m.round === 0).every((m) => m.a || m.b));
    let played = 0;
    while (!champion(t)) {
      const m = t.matches.find((m) => m.a && m.b && !m.winnerId);
      assert.ok(m);
      if (!m) throw new Error("Nenhuma partida disponível antes da final.");
      t = recordResult(t, m.id, 2, 1);
      played++;
    }
    assert.equal(played, n - 1);
    assert.equal(t.status, "finished");
    assert.equal(parseTournaments(JSON.stringify([t]))[0].id, t.id);
  }
});
test("rename preserves identity and attendance, validates names, and requires draft", () => {
  const original = draft();
  const renamed = renameParticipant(original, "p0", "  Novo nome  ");
  assert.deepEqual(renamed.participants[0], {
    id: "p0",
    name: "Novo nome",
    checkedIn: true,
  });
  assert.equal(original.participants[0].name, "Player 0");
  assert.equal(
    renameParticipant(original, "p0", "PLAYER 0").participants[0].name,
    "PLAYER 0",
  );
  assert.throws(() => renameParticipant(original, "p0", " player 1 "));
  assert.throws(() => renameParticipant(original, "p0", " "));
  assert.throws(() => renameParticipant(original, "p0", "x".repeat(61)));
  assert.throws(() => renameParticipant(original, "missing", "Nome"));
  assert.throws(() =>
    renameParticipant(startTournament(original), "p0", "Nome"),
  );
});
test("names, draft editing, count and IDs validated", () => {
  let t = draft();
  assert.equal(t.name, "Copa");
  assert.throws(() => addParticipant(t, " player 0 ", "x"));
  assert.throws(() => addParticipant(t, "x", "p0"));
  assert.throws(() => addParticipant(t, " ".repeat(2), "x"));
  assert.throws(() => addParticipant(t, "x".repeat(61), "x"));
  assert.equal(removeParticipant(t, "p0").participants.length, 3);
  assert.throws(() => startTournament(draft(3)));
  assert.throws(() => startTournament(draft(17)));
  t = checkIn(t, "p0");
  assert.equal(t.participants[0].checkedIn, true);
  t = startTournament(t);
  assert.throws(() => addParticipant(t, "new", "x"));
  assert.throws(() => removeParticipant(t, "p0"));
});
test("scores, ties, correction and descendant lock", () => {
  let t = startTournament(draft(), () => 0.5);
  const first = t.matches[0];
  assert.throws(() => recordResult(t, first.id, -1, 0));
  assert.throws(() => recordResult(t, first.id, 1.2, 0));
  assert.throws(() => recordResult(t, first.id, 1000, 0));
  assert.throws(() => recordResult(t, first.id, 1, 1));
  t = recordResult(t, first.id, 1, 1, first.a!);
  t = recordResult(t, first.id, 0, 1);
  assert.equal(t.matches[2].a, first.b);
  t = recordResult(t, t.matches[1].id, 2, 0);
  t = recordResult(t, t.matches[2].id, 2, 0);
  assert.throws(() => recordResult(t, first.id, 2, 0));
});
test("persisted malformed and inconsistent data rejected", () => {
  assert.deepEqual(parseTournaments(null), []);
  for (const raw of [
    "oops",
    "{}",
    "[null]",
    JSON.stringify([{ ...draft(), status: "active" }]),
  ])
    assert.throws(() => parseTournaments(raw));
  const t = startTournament(draft());
  t.matches[0].winnerId = "ghost";
  assert.throws(() => parseTournaments(JSON.stringify([t])));
  const bad = draft();
  bad.participants[0].checkedIn = "yes" as any;
  assert.throws(() => parseTournaments(JSON.stringify([bad])));
});
test("QR is versioned and scoped", () => {
  assert.equal(parseQr(qrPayload("cup", "p0"), "cup"), "p0");
  for (const raw of [
    "bad",
    qrPayload("other", "p0"),
    '{"v":2,"tournamentId":"cup","participantId":"p0"}',
  ])
    assert.throws(() => parseQr(raw, "cup"));
});
test("start requires check-in, location is optional up to 120 characters, QR bounded", () => {
  let t = draft();
  t.participants[0].checkedIn = false;
  assert.throws(() => startTournament(t), /presença/);
  for (const location of ["", "x".repeat(120)]) {
    const d = newTournament(
      { name: "Copa", game: "FC", location, startsAt: "2026-12-07" },
      "local",
    );
    assert.equal(parseTournaments(JSON.stringify([d]))[0].location, location);
  }
  assert.throws(() =>
    newTournament(
      {
        name: "Copa",
        game: "FC",
        location: "x".repeat(121),
        startsAt: "2026-12-07",
      },
      "local",
    ),
  );
  assert.throws(() =>
    parseQr(" ".repeat(4096) + qrPayload("cup", "p0"), "cup"),
  );
});
test("automatic byes do not block correction and incomplete matches cannot be scored", () => {
  let t = startTournament(draft(5), () => 0.5);
  assert.throws(() => recordResult(t, t.matches.at(-1)!.id, 1, 0));
  const m = t.matches.find((m) => m.round === 0 && !m.bye)!;
  t = recordResult(t, m.id, 2, 0);
  t = recordResult(t, m.id, 0, 2);
  assert.equal(
    t.matches.find(
      (p) => p.round === 1 && p.index === Math.floor(m.index / 2),
    )![m.index % 2 === 0 ? "a" : "b"],
    m.b,
  );
  assert.equal(parseTournaments(JSON.stringify([t])).length, 1);
});
