import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Tournament } from "./domain";
import { cloudUpdatedAt, prepareCloudPayload, readCloudBackup } from "./cloud-payload";

export type CloudUser = { id: string; email: string };
export type CloudSession = { user: CloudUser };
const endpoint = process.env.EXPO_PUBLIC_ARENA_API_URL?.trim();
export const cloudConfigured = !!endpoint && /^https:\/\//.test(endpoint);
const sessionKey = "arena.neon.session.v1";

async function request(action: string, body?: unknown): Promise<Record<string, unknown>> {
  if (!cloudConfigured) throw new Error("O backup online ainda não está configurado.");
  const native = Platform.OS !== "web";
  const token = native ? await SecureStore.getItemAsync(sessionKey) : null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${endpoint}?action=${action}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: native ? "omit" : "include",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(native ? { "X-Arena-Client": "native" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      if (native && response.status === 401) await SecureStore.deleteItemAsync(sessionKey);
      throw new Error(typeof data.error === "string" ? data.error : "Não foi possível concluir. Tente novamente.");
    }
    if (native && typeof data.token === "string") await SecureStore.setItemAsync(sessionKey, data.token);
    return data;
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw new Error("O serviço demorou para responder. Verifique a conexão e tente novamente.");
    if (cause instanceof TypeError) throw new Error("Não foi possível conectar. Seus campeonatos continuam salvos neste aparelho.");
    throw cause;
  } finally { clearTimeout(timeout); }
}

function sessionFrom(data: Record<string, unknown>): CloudSession | null {
  const user = data.user as CloudUser | null;
  if (!user) return null;
  if (typeof user.id !== "string" || typeof user.email !== "string") throw new Error("Resposta de sessão inválida.");
  return { user };
}

export async function getCloudSession(): Promise<CloudSession | null> {
  const session = sessionFrom(await request("session"));
  if (!session && Platform.OS !== "web") await SecureStore.deleteItemAsync(sessionKey);
  return session;
}

export async function authenticateCloud(email: string, password: string, create: boolean): Promise<CloudSession> {
  const session = sessionFrom(await request(create ? "signup" : "signin", { email, password }));
  if (!session) throw new Error("Não foi possível iniciar a sessão. Tente entrar novamente.");
  return session;
}

export async function signOutCloud(): Promise<void> {
  await request("signout", {});
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(sessionKey);
}

export async function saveCloudBackup(tournaments: Tournament[]): Promise<{ updatedAt: string; count: number }> {
  const payload = prepareCloudPayload(tournaments);
  const result = await request("backup", { payload });
  return { updatedAt: cloudUpdatedAt(result.updatedAt), count: payload.length };
}

export async function loadCloudBackup(): Promise<{ tournaments: Tournament[]; updatedAt: string } | null> {
  const result = await request("backup");
  return result.backup === null ? null : readCloudBackup(result.backup);
}
