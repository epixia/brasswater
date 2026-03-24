import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');

// Supabase pooler in session mode (port 5432) - us-west-2 region
const client = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.ydsripcbdobrdnsxelve',
  password: 'hpkPtG2tnwTES429',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

try {
  console.log('Connecting to Supabase database (us-west-2 pooler, session mode)...');
  await client.connect();
  console.log('Connected.');

  console.log(`Running migration (${sql.length} bytes)...`);
  await client.query(sql);
  console.log('Migration complete!');

  // Verify tables exist
  const result = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  console.log('\nTables created:');
  for (const row of result.rows) {
    const countResult = await client.query(`SELECT COUNT(*) as cnt FROM "${row.table_name}"`);
    console.log(`  ${row.table_name}: ${countResult.rows[0].cnt} rows`);
  }

} catch (err) {
  console.error('Migration failed:', err.message);
  if (err.detail) console.error('Detail:', err.detail);
  if (err.where) console.error('Where:', err.where);
  process.exit(1);
} finally {
  await client.end();
}
