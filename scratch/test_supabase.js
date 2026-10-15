import fetch from 'node-fetch';

const supabaseUrl = 'https://wrfsbsxigcaapvjityjv.supabase.co';
const supabaseKey = 'sb_publishable_PWrcWPSGFr0XpNgr62qDvQ_TDEPnYMX';

async function testRpc(params) {
  const url = `${supabaseUrl}/rest/v1/rpc/get_player_stats_period`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    const status = res.status;
    const data = await res.json();
    console.log(`--- RPC get_player_stats_period (Status: ${status}) ---`);
    console.log('Response:', data);
  } catch (err) {
    console.error('Failed to run RPC:', err);
  }
}

async function run() {
  console.log('Testing RPC call with invalid date June 31...');
  await testRpc({ p_start_date: '2026-06-22', p_end_date: '2026-06-31', p_season_id: null });
}

run();
