import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('match_entries').select('*').limit(1);
  console.log("match_entries:", data);
  const { data: pData } = await supabase.from('player_season_stats').select('*').limit(1);
  console.log("player_season_stats:", pData);
}
run();
