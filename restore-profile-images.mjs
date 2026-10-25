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

async function fixProfileImages() {
  console.log("Fetching all players to check profile images...");
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, jerseynumber, profileimageurl');

  if (error || !players) {
    console.error("Failed to fetch players:", error);
    process.exit(1);
  }

  console.log(`Checking ${players.length} players...`);
  let fixedCount = 0;

  for (const player of players) {
    if (!player.profileimageurl) continue;

    try {
      const res = await fetch(player.profileimageurl);
      if (!res.ok) continue;

      const inputBuffer = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(inputBuffer).metadata();

      // Only fix images that are 1080x1350 (4:5 padded gallery ratio with transparent top gap)
      if (meta.width === 1080 && meta.height === 1350) {
        console.log(`\n[Restoring] ${player.name} (#${player.jerseynumber})`);
        console.log(`  Current: 1080x1350 -> ${player.profileimageurl}`);

        // Trim the top 270px transparent gap added by fitImageForGallery
        const trimmedResult = await sharp(inputBuffer)
          .trim()
          .png({ quality: 95 })
          .toBuffer({ resolveWithObject: true });

        console.log(`  Restored dimensions: ${trimmedResult.info.width}x${trimmedResult.info.height} (offsetTop: ${trimmedResult.info.trimOffsetTop})`);

        // Upload restored image to 'images' bucket
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        const { error: uploadErr } = await supabase.storage
          .from('images')
          .upload(fileName, trimmedResult.data, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadErr) {
          console.error(`  ❌ Storage upload failed for ${player.name}:`, uploadErr.message);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        // Update database with restored URL
        const { error: updateErr } = await supabase
          .from('players')
          .update({ profileimageurl: publicUrl })
          .eq('id', player.id);

        if (updateErr) {
          console.error(`  ❌ Database update failed for ${player.name}:`, updateErr.message);
        } else {
          console.log(`  ✅ Successfully restored profile image to ${publicUrl}`);
          fixedCount++;
        }
      }
    } catch (err) {
      console.error(`  ❌ Error processing ${player.name}:`, err.message);
    }
  }

  console.log(`\n🎉 Done! Restored ${fixedCount} profile images to 1080x1080 square with zero gap.`);
}

fixProfileImages();
