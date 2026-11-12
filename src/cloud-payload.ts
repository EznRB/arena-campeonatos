import { parseTournaments } from "./domain.ts";
import type { Tournament } from "./domain.ts";

export const CLOUD_SCHEMA_VERSION = 1;
export const MAX_CLOUD_PAYLOAD_BYTES = 2 * 1024 * 1024;

/** Conta UTF-8 sem depender de TextEncoder, Buffer ou módulos nativos. */
export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (const character of text) {
    const point = character.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function prepareCloudPayload(value: unknown): Tournament[] {
  if (!Array.isArray(value))
    throw new Error("O backup deve conter uma lista de campeonatos.");
  const raw = JSON.stringify(value);
  if (utf8ByteLength(raw) > MAX_CLOUD_PAYLOAD_BYTES)
    throw new Error("O backup ultrapassa o limite de 2 MB.");
  // O parser também cria uma cópia: mudanças posteriores na UI não alteram o envio.
  const tournaments = parseTournaments(raw);
  // IDs de lembretes pertencem ao aparelho de origem, inclusive em backups antigos.
  for (const tournament of tournaments) delete tournament.notificationId;
  return tournaments;
}

export function cloudUpdatedAt(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error("O backup recebido não possui uma data válida.");
  return value;
}

export function readCloudBackup(value: unknown): {
  tournaments: Tournament[];
  updatedAt: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("O backup recebido é inválido.");
  const row = value as Record<string, unknown>;
  if (row.schema_version !== CLOUD_SCHEMA_VERSION)
    throw new Error("A versão deste backup não é compatível com o aplicativo.");
  return {
    tournaments: prepareCloudPayload(row.payload),
    updatedAt: cloudUpdatedAt(row.updated_at),
  };
}
