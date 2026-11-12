import type { Tournament } from './domain.ts';

/** Persist first: a failed local write must leave existing reminders untouched. */
export async function restoreBackup(
  tournaments: Tournament[],
  previous: Tournament[],
  persist: (value: Tournament[]) => Promise<void>,
  cancel: (id: string) => Promise<void>,
): Promise<number> {
  await persist(tournaments);
  const ids = [...new Set(previous.flatMap(item => item.notificationId ? [item.notificationId] : []))];
  const results = await Promise.allSettled(ids.map(id => cancel(id)));
  return results.filter(result => result.status === 'rejected').length;
}
