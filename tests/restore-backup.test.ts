import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreBackup } from '../src/restore-backup.ts';
import { createDemoTournament } from '../src/demo.ts';

test('failed restore persistence leaves all old reminders untouched', async () => {
  const old = [{ ...createDemoTournament('old'), notificationId: 'old-alarm' }];
  const cancelled: string[] = [];
  await assert.rejects(restoreBackup([], old, async () => { throw Error('disk full'); }, async id => { cancelled.push(id); }), /disk full/);
  assert.deepEqual(cancelled, []);
  assert.equal(old[0].notificationId, 'old-alarm');
});

test('restore persists before cleanup and reports failed cancellations separately', async () => {
  const order: string[] = [];
  const old = ['ok', 'fail', 'ok'].map((id, index) => ({ ...createDemoTournament('old-' + index), notificationId: id }));
  const failures = await restoreBackup([], old, async () => { order.push('persist'); }, async id => {
    order.push(id);
    if (id === 'fail') throw Error('notification unavailable');
  });
  assert.deepEqual(order, ['persist', 'ok', 'fail']);
  assert.equal(failures, 1);
});
