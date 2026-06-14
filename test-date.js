import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let env = '';
try { env = fs.readFileSync('.env', 'utf-8'); } catch(e) {}
if (!env) try { env = fs.readFileSync('.env.development', 'utf-8'); } catch(e) {}

const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('match_entries').select('*, matches(date)').limit(5);
  console.log(JSON.stringify(data, null, 2));
}
run();
