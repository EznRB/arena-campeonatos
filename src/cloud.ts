import 'react-native-url-polyfill/auto';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tournament } from "./domain";
import {
  CLOUD_SCHEMA_VERSION,
  cloudUpdatedAt,
  prepareCloudPayload,
  readCloudBackup,
} from "./cloud-payload";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

function optionalClient(): SupabaseClient | null {
  if (!url || !publishableKey) return null;
  try {
    return createClient(url, publishableKey, {
      auth: {
        storage: AsyncStorage,
        storageKey: "@arena/cloud-auth/v1",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch {
    // Configuração ausente ou inválida não impede o uso local do Arena.
    return null;
  }
}

export const cloudClient: SupabaseClient | null = optionalClient();
export const cloudConfigured = cloudClient !== null;

async function authenticatedClient(): Promise<{
  client: SupabaseClient;
  userId: string;
}> {
  if (!cloudClient) throw new Error("O backup na nuvem não está configurado.");
  const { data, error } = await cloudClient.auth.getUser();
  if (error || !data.user)
    throw new Error("Entre na sua conta para acessar o backup na nuvem.");
  return { client: cloudClient, userId: data.user.id };
}

/** Snapshot manual: o servidor aplica RLS e fornece a data de atualização. */
export async function saveCloudBackup(
  tournaments: Tournament[],
): Promise<{ updatedAt: string; count: number }> {
  const payload = prepareCloudPayload(tournaments);
  const { client, userId } = await authenticatedClient();
  const { data, error } = await client
    .from("arena_backups")
    .upsert(
      { user_id: userId, payload, schema_version: CLOUD_SCHEMA_VERSION },
      { onConflict: "user_id" },
    )
    .select("updated_at")
    .single();
  if (error)
    throw new Error(
      "Não foi possível salvar o backup na nuvem. Tente novamente.",
    );
  return { updatedAt: cloudUpdatedAt(data?.updated_at), count: payload.length };
}

export async function loadCloudBackup(): Promise<{
  tournaments: Tournament[];
  updatedAt: string;
} | null> {
  const { client, userId } = await authenticatedClient();
  const { data, error } = await client
    .from("arena_backups")
    .select("payload,schema_version,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error(
      "Não foi possível carregar o backup na nuvem. Tente novamente.",
    );
  return data === null ? null : readCloudBackup(data);
}
