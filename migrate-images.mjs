import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load env vars
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
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateTable(tableName, idCol, imageCol) {
  console.log(`Migrating ${tableName}...`);
  // Get all rows that have an image value
  const { data, error } = await supabase
    .from(tableName)
    .select(`${idCol}, ${imageCol}`)
    .not(imageCol, 'is', null)
    .neq(imageCol, '');

  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return;
  }

  let count = 0;
  for (const row of data) {
    const val = row[imageCol];
    if (typeof val === 'string' && val.startsWith('data:image/')) {
      // It's a base64 string
      const match = val.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) continue;

      const ext = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      console.log(`Uploading image for ${tableName} id ${row[idCol]}...`);
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, {
          contentType: `image/${ext}`,
          upsert: false
        });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      console.log(`Updating DB for ${tableName} id ${row[idCol]} to ${publicUrl}`);
      const { error: updateErr } = await supabase
        .from(tableName)
        .update({ [imageCol]: publicUrl })
        .eq(idCol, row[idCol]);

      if (updateErr) {
        console.error("Update error:", updateErr);
      } else {
        count++;
      }
    }
  }
  console.log(`Migrated ${count} rows in ${tableName}.`);
}

async function run() {
  await migrateTable('players', 'id', 'profileimageurl');
  await migrateTable('news', 'id', 'image');
  await migrateTable('club_ranks', 'id', 'image_url');
  await migrateTable('club_achievements', 'id', 'image_url');
  console.log("Migration complete.");
}

run().catch(console.error);
