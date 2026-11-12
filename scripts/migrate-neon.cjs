const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const { neon } = require('@neondatabase/serverless');

// A dedicated override avoids accidentally using another project's DATABASE_URL
// inherited from the user's machine. Never print the connection string.
(async () => {
  const filename = path.resolve(__dirname, '../.env.local');
  const local = fs.existsSync(filename) ? parseEnv(fs.readFileSync(filename, 'utf8')) : {};
  const connection = process.env.ARENA_MIGRATION_DATABASE_URL || local.DATABASE_URL;
  if (!connection || !new URL(connection).hostname.endsWith('.neon.tech')) {
    throw new Error('Configure o banco Neon do Arena em .env.local ou ARENA_MIGRATION_DATABASE_URL.');
  }
  const sql = neon(connection);
  const file = path.resolve(__dirname, '../database/migrations/001_arena_backups.sql');
  // This initial migration contains only plain statements, one per line/block.
  const statements = fs.readFileSync(file, 'utf8').split(/;\s*(?:\r?\n|$)/).map(value => value.trim()).filter(Boolean);
  await sql.transaction(statements.map(statement => sql.query(statement)));
  const rows = await sql`SELECT relrowsecurity FROM pg_class WHERE oid = 'public.arena_backups'::regclass`;
  if (!rows[0]?.relrowsecurity) throw new Error('A verificação de RLS falhou.');
  console.log('Migração Arena aplicada em transação; RLS confirmado.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
