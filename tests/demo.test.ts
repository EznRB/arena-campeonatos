import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoTournament } from "../src/demo.ts";
import { parseTournaments, recordResult } from "../src/domain.ts";

test("demo is explicit, valid, deterministic and ready to continue", () => {
  const now = new Date("2026-11-11T15:00:00.000Z");
  const t = createDemoTournament("demo-one", now);
  assert.equal(t.id, "demo-one");
  assert.equal(t.name, "Copa Arena • Demo");
  assert.equal(t.game, "EA FC");
  assert.equal(t.location, "Arena Campus");
  assert.equal(t.startsAt, "2026-11-13T15:00:00.000Z");
  assert.equal(now.toISOString(), "2026-11-11T15:00:00.000Z");
  assert.equal(t.status, "active");
  assert.equal(t.participants.length, 8);
  assert.ok(t.participants.every((p) => p.checkedIn && p.id.startsWith(t.id)));
  assert.equal(t.matches.filter((m) => m.round === 0 && m.winnerId).length, 2);
  assert.equal(t.matches.filter((m) => m.round === 0 && !m.winnerId && m.a && m.b).length, 2);
  assert.deepEqual(parseTournaments(JSON.stringify([t])), [t]);
  assert.deepEqual(createDemoTournament(t.id, now).matches, t.matches);
  const snapshot = JSON.stringify(t);
  const pending = t.matches.find((m) => m.round === 0 && !m.winnerId)!;
  const continued = recordResult(t, pending.id, 3, 1);
  assert.equal(JSON.stringify(t), snapshot);
  assert.notDeepEqual(continued.matches, t.matches);
});

test("demo participant IDs are unique across tournaments", () => {
  const a = createDemoTournament("demo-a");
  const b = createDemoTournament("demo-b");
  assert.equal(new Set([...a.participants, ...b.participants].map((p) => p.id)).size, 16);
  assert.equal(parseTournaments(JSON.stringify([a, b])).length, 2);
});
