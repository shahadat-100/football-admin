import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// 1. Load Supabase credentials from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1350; // 4:5 ratio
const HEADROOM_FACTOR = 0.05; // 5% safe top margin so head is never cut

async function processPlayerCover(player, index, total) {
  const { id, name, coverimageurl } = player;
  console.log(`\n[${index + 1}/${total}] Processing ${name}...`);
  console.log(`  Current URL: ${coverimageurl}`);

  try {
    // Download image
    const res = await fetch(coverimageurl);
    if (!res.ok) {
      console.error(`  ⚠️ Failed to fetch image (HTTP ${res.status}): ${coverimageurl}`);
      return false;
    }

    const inputBuffer = Buffer.from(await res.arrayBuffer());
    const inputSharp = sharp(inputBuffer);
    const meta = await inputSharp.metadata();

    if (!meta.width || !meta.height) {
      console.error(`  ⚠️ Could not determine image dimensions for ${name}`);
      return false;
    }

    console.log(`  Original size: ${meta.width}x${meta.height}`);

    // If already exactly 1080x1350, skip
    if (meta.width === TARGET_WIDTH && meta.height === TARGET_HEIGHT) {
      console.log(`  ✅ Already 1080x1350 4:5, skipping.`);
      return true;
    }

    // Calculate fit-contain dimensions with headroom
    const availableH = Math.round(TARGET_HEIGHT * (1 - HEADROOM_FACTOR));
    const availableW = TARGET_WIDTH;

    const scale = Math.min(availableW / meta.width, availableH / meta.height);
    const scaledW = Math.round(meta.width * scale);
    const scaledH = Math.round(meta.height * scale);

    const left = Math.round((TARGET_WIDTH - scaledW) / 2);
    const top = Math.round(TARGET_HEIGHT - scaledH); // Bottom-align

    console.log(`  Resizing to: ${scaledW}x${scaledH}, placed at top-left: (${left}, ${top})`);

    // Resize player cutout
    const resizedBuffer = await inputSharp
      .resize(scaledW, scaledH, { fit: 'contain' })
      .toBuffer();

    // Composite onto transparent 1080x1350 canvas
    const finalBuffer = await sharp({
      create: {
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resizedBuffer, left, top }])
      .png({ quality: 90, compressionLevel: 8 })
      .toBuffer();

    // Upload to Supabase 'covers' bucket
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const { error: uploadErr } = await supabase.storage
      .from('covers')
      .upload(fileName, finalBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadErr) {
      console.error(`  ❌ Supabase storage upload error:`, uploadErr.message);
      return false;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('covers')
      .getPublicUrl(fileName);

    // Update database
    const { error: dbErr } = await supabase
      .from('players')
      .update({ coverimageurl: publicUrl })
      .eq('id', id);

    if (dbErr) {
      console.error(`  ❌ Database update error:`, dbErr.message);
      return false;
    }

    console.log(`  ✨ Successfully converted to 1080x1350 4:5!`);
    console.log(`  New URL: ${publicUrl}`);
    return true;
  } catch (err) {
    console.error(`  ❌ Error processing ${name}:`, err.message);
    return false;
  }
}

async function run() {
  console.log("=========================================");
  console.log("🚀 Starting 4:5 Cover Image Normalization");
  console.log(`Target: ${TARGET_WIDTH}x${TARGET_HEIGHT} (4:5) | Bucket: 'covers'`);
  console.log("=========================================");

  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, coverimageurl')
    .not('coverimageurl', 'is', null)
    .neq('coverimageurl', '');

  if (error) {
    console.error("❌ Failed to query players:", error);
    process.exit(1);
  }

  console.log(`Found ${players.length} players with cover images.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < players.length; i++) {
    const success = await processPlayerCover(players[i], i, players.length);
    if (success) successCount++;
    else failCount++;
  }

  console.log("\n=========================================");
  console.log(`🎉 Migration Finished!`);
  console.log(`  Total: ${players.length}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log("=========================================");
}

run().catch(console.error);
