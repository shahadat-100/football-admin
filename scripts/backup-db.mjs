import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually without external dependencies
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      envVars[key] = val;
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'players',
  'matches',
  'competitions',
  'season',
  'teams',
  'news',
  'hall_of_frame',
  'match_entries',
  'player_role',
  'player_player_roles',
  'custom_tags',
  'player_custom_tags',
  'milestone_log',
  'player_season_stats',
  'club_rules',
  'club_ranks',
  'club_achievements',
  'friendly_matches'
];

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backup', `backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`Starting backup to directory: ${backupDir}`);
  const summary = {};
  const consolidated = {};

  for (const table of TABLES) {
    try {
      let allRows = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .range(from, to);

        if (error) {
          console.warn(`Table "${table}": Error (${error.message})`);
          summary[table] = { status: 'skipped/error', message: error.message };
          hasMore = false;
          break;
        }

        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      if (summary[table]?.status === 'skipped/error') continue;

      const rowCount = allRows.length;
      summary[table] = { status: 'success', rowCount };
      consolidated[table] = allRows;

      // Save individual JSON file
      fs.writeFileSync(
        path.join(backupDir, `${table}.json`),
        JSON.stringify(allRows, null, 2),
        'utf-8'
      );
      console.log(`✓ Table "${table}": ${rowCount} total rows backed up`);
    } catch (err) {
      console.error(`Error backing up table "${table}":`, err.message);
      summary[table] = { status: 'error', message: err.message };
    }
  }

  // Save consolidated backup
  fs.writeFileSync(
    path.join(backupDir, 'all_tables_consolidated.json'),
    JSON.stringify(consolidated, null, 2),
    'utf-8'
  );

  // Save backup metadata summary
  fs.writeFileSync(
    path.join(backupDir, 'backup_summary.json'),
    JSON.stringify({ timestamp, tables: summary }, null, 2),
    'utf-8'
  );

  console.log('\nBackup completed successfully!');
  console.log(`Summary:`, JSON.stringify(summary, null, 2));
}

runBackup().catch((err) => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
