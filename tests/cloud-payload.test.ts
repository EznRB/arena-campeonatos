import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoTournament } from "../src/demo.ts";
import {
  CLOUD_SCHEMA_VERSION,
  MAX_CLOUD_PAYLOAD_BYTES,
  prepareCloudPayload,
  readCloudBackup,
  utf8ByteLength,
} from "../src/cloud-payload.ts";

test("cloud snapshot roundtrip keeps independent valid tournaments", () => {
  const original = [createDemoTournament("demo-backup")];
  const payload = prepareCloudPayload(original);
  assert.deepEqual(payload, original);
  assert.notEqual(payload, original);
  assert.notEqual(payload[0], original[0]);
  const updatedAt = "2026-11-12T15:00:00.000Z";
  assert.deepEqual(
    readCloudBackup({
      payload,
      schema_version: CLOUD_SCHEMA_VERSION,
      updated_at: updatedAt,
    }),
    { tournaments: original, updatedAt },
  );
  assert.deepEqual(prepareCloudPayload([]), []);
});

test("native notification IDs are removed on save and legacy restore without mutating input", () => {
  const tournament = {
    ...createDemoTournament("demo-notification"),
    notificationId: "native-device-id",
  };
  const input = [tournament];
  const payload = prepareCloudPayload(input);
  assert.equal(Object.hasOwn(payload[0], "notificationId"), false);
  assert.equal(tournament.notificationId, "native-device-id");
  const legacy = {
    payload: input,
    schema_version: 1,
    updated_at: "2026-11-12T15:00:00Z",
  };
  assert.equal(
    Object.hasOwn(readCloudBackup(legacy).tournaments[0], "notificationId"),
    false,
  );
  assert.equal(legacy.payload[0].notificationId, "native-device-id");
});

test("invalid schema, timestamp and corrupt tournament snapshots are rejected", () => {
  const row = {
    payload: [],
    schema_version: 1,
    updated_at: "2026-11-12T15:00:00Z",
  };
  for (const value of [
    null,
    [],
    {},
    { ...row, schema_version: 2 },
    { ...row, updated_at: "bad" },
    { ...row, payload: [{}] },
    { ...row, payload: "[]" },
  ]) {
    assert.throws(() => readCloudBackup(value));
  }
  for (const payload of [null, {}, [null], [{ id: "broken" }]])
    assert.throws(() => prepareCloudPayload(payload));
});

test("UTF-8 size handles accents and emoji and rejects snapshots larger than 2 MiB", () => {
  for (const text of ["ASCII", "ação", "🏆", "\ud800"])
    assert.equal(utf8ByteLength(text), Buffer.byteLength(text, "utf8"));
  assert.equal(MAX_CLOUD_PAYLOAD_BYTES, 2 * 1024 * 1024);
  const tournament = {
    ...createDemoTournament("demo-large"),
    extra: "🏆".repeat(MAX_CLOUD_PAYLOAD_BYTES / 4),
  };
  assert.throws(() => prepareCloudPayload([tournament]), /2 MB/);
});
