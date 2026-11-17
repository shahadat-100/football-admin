import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

// ── 1. Load environment from .env.migrate ──────────────────────────
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const envFile = path.resolve(process.cwd(), '.env.migrate');
const env = loadEnv(envFile);

const OLD_URL = env.OLD_SUPABASE_URL || 'https://wrfsbsxigcaapvjityjv.supabase.co';
const NEW_URL = env.NEW_SUPABASE_URL || 'https://jwhjistshnelarinyzac.supabase.co';
const OLD_KEY = (process.env.OLD_SERVICE_KEY || env.OLD_SERVICE_KEY || '').replace(/\.$/, '');
const NEW_KEY = (process.env.NEW_SERVICE_KEY || env.NEW_SERVICE_KEY || '').replace(/\.$/, '');

if (!OLD_KEY || !NEW_KEY) {
  console.error('\n❌ ERROR: Missing OLD_SERVICE_KEY or NEW_SERVICE_KEY in .env.migrate');
  console.error('Please create .env.migrate with:');
  console.error('  OLD_SERVICE_KEY=...');
  console.error('  NEW_SERVICE_KEY=...\n');
  process.exit(1);
}

const oldSupabase = createClient(OLD_URL, OLD_KEY, {
  auth: { persistSession: false },
});

const newSupabase = createClient(NEW_URL, NEW_KEY, {
  auth: { persistSession: false },
});

const BUCKETS = ['images', 'covers', 'media'];
const BUCKET_MAX_WIDTH = {
  images: 800,
  covers: 1600,
  media: 1200,
};

// ── 2. Helper to recursively list all files ─────────────────────────
async function listAllFiles(client, bucket, prefix = '') {
  const files = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      if (item.name === '.emptyFolderPlaceholder') continue;

      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

      // Folders in Supabase Storage have id: null and metadata: null
      const isFolder = item.id === null && (!item.metadata || Object.keys(item.metadata).length === 0);

      if (isFolder) {
        const subFiles = await listAllFiles(client, bucket, itemPath);
        files.push(...subFiles);
      } else {
        files.push({
          name: item.name,
          path: itemPath,
          size: item.metadata?.size || 0,
        });
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}

// ── 3. Helper to ensure bucket exists and is public in NEW project ──
async function ensureBucket(bucketName) {
  const { data: buckets, error } = await newSupabase.storage.listBuckets();
  if (error) throw new Error(`Failed to list buckets on new project: ${error.message}`);

  const existing = buckets?.find((b) => b.name === bucketName);
  if (!existing) {
    console.log(`Creating bucket '${bucketName}' (public: true) in new project...`);
    const { error: createErr } = await newSupabase.storage.createBucket(bucketName, {
      public: true,
    });
    if (createErr) throw new Error(`Failed to create bucket '${bucketName}': ${createErr.message}`);
  } else if (!existing.public) {
    console.log(`Setting bucket '${bucketName}' to public: true...`);
    await newSupabase.storage.updateBucket(bucketName, { public: true });
  }
}

// ── 4. Retry wrapper ────────────────────────────────────────────────
async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
  let lastErr;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (err?.status === 402 || err?.status === 403 || err?.statusCode === 402 || err?.statusCode === 403) {
        throw err; // Do not retry restriction / forbidden errors
      }
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs * i));
      }
    }
  }
  throw lastErr;
}

// ── 5. Main migration loop ──────────────────────────────────────────
async function run() {
  console.log('====================================================');
  console.log('  SUPABASE STORAGE MIGRATION & WEBP COMPRESSION');
  console.log('====================================================');
  console.log(`Source: ${OLD_URL}`);
  console.log(`Target: ${NEW_URL}`);
  console.log('Buckets:', BUCKETS.join(', '));
  console.log('----------------------------------------------------\n');

  let grandTotalOldBytes = 0;
  let grandTotalNewBytes = 0;
  let grandTotalFilesProcessed = 0;
  let grandTotalFilesSkipped = 0;
  const allFailures = [];

  for (const bucket of BUCKETS) {
    console.log(`\n====================================================`);
    console.log(`📁 Processing Bucket: [${bucket}]`);
    console.log(`====================================================`);

    try {
      await ensureBucket(bucket);
    } catch (err) {
      console.error(`❌ Could not verify/create bucket '${bucket}':`, err.message);
      allFailures.push({ bucket, path: '*', error: err.message });
      continue;
    }

    // List all existing files in new project bucket for instant resume check
    console.log(`Scanning existing files in new bucket [${bucket}] for resume check...`);
    let existingInNew = new Set();
    try {
      const newFiles = await listAllFiles(newSupabase, bucket);
      existingInNew = new Set(newFiles.map((f) => f.path));
      console.log(`Found ${existingInNew.size} files already present in new bucket [${bucket}].`);
    } catch (err) {
      console.warn(`Could not list new bucket [${bucket}] (may be empty):`, err.message);
    }

    // List all files in old project bucket
    console.log(`Scanning files from old bucket [${bucket}]...`);
    let oldFiles = [];
    try {
      oldFiles = await listAllFiles(oldSupabase, bucket);
      console.log(`Found ${oldFiles.length} files in old bucket [${bucket}].\n`);
    } catch (err) {
      console.error(`❌ Failed to list files from old bucket [${bucket}]:`, err.message);
      if (err.status === 402 || err.status === 403) {
        console.error(`\n[FATAL] Old project restricted with HTTP ${err.status}!`);
        console.error(err);
        process.exit(1);
      }
      allFailures.push({ bucket, path: '*', error: err.message });
      continue;
    }

    const maxWidth = BUCKET_MAX_WIDTH[bucket] || 1200;

    for (const file of oldFiles) {
      const oldPath = file.path;
      // Change extension to .webp
      const newPath = oldPath.replace(/\.(png|jpe?g|webp|gif|bmp|tiff)$/i, '') + '.webp';

      // Resume check: if already in new bucket, skip
      if (existingInNew.has(newPath)) {
        grandTotalFilesSkipped++;
        console.log(`[SKIP] Already migrated: ${newPath}`);
        continue;
      }

      try {
        await withRetry(async () => {
          // 1. Download from old project
          const { data: blob, error: downloadError } = await oldSupabase.storage
            .from(bucket)
            .download(oldPath);

          if (downloadError) {
            if (downloadError.status === 402 || downloadError.status === 403) {
              console.error(`\n❌ [FATAL HTTP ${downloadError.status}] Old Supabase project download blocked:`);
              console.error(downloadError);
              process.exit(1);
            }
            throw new Error(`Download failed: ${downloadError.message}`);
          }

          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const oldKb = (buffer.length / 1024).toFixed(1);

          // 2. Compress & resize with sharp
          let image = sharp(buffer).rotate();
          const meta = await image.metadata();

          if (meta.width && meta.width > maxWidth) {
            image = image.resize({
              width: maxWidth,
              withoutEnlargement: true,
            });
          }

          const compressedBuffer = await image
            .webp({ quality: 80 })
            .toBuffer();

          const newKb = (compressedBuffer.length / 1024).toFixed(1);
          const reduction = (
            ((buffer.length - compressedBuffer.length) / buffer.length) * 100
          ).toFixed(1);

          // 3. Upload to new project
          const { error: uploadError } = await newSupabase.storage
            .from(bucket)
            .upload(newPath, compressedBuffer, {
              contentType: 'image/webp',
              cacheControl: '31536000',
              upsert: true,
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          grandTotalFilesProcessed++;
          grandTotalOldBytes += buffer.length;
          grandTotalNewBytes += compressedBuffer.length;

          console.log(
            `✔ [${bucket}] ${oldPath} -> ${newPath} | ${oldKb} KB -> ${newKb} KB (-${reduction}%)`
          );
        }, 3, 1500);
      } catch (err) {
        console.error(`✖ [FAIL] ${bucket}/${oldPath}: ${err.message}`);
        allFailures.push({ bucket, path: oldPath, error: err.message });
      }
    }
  }

  // ── 6. Final Summary Report ─────────────────────────────────────────
  console.log('\n====================================================');
  console.log('              MIGRATION FINAL SUMMARY');
  console.log('====================================================');
  console.log(`Files Processed: ${grandTotalFilesProcessed}`);
  console.log(`Files Skipped (Already Present): ${grandTotalFilesSkipped}`);
  console.log(`Total Failures:  ${allFailures.length}`);

  const totalOldMb = (grandTotalOldBytes / (1024 * 1024)).toFixed(2);
  const totalNewMb = (grandTotalNewBytes / (1024 * 1024)).toFixed(2);
  const totalSavings = grandTotalOldBytes > 0
    ? (((grandTotalOldBytes - grandTotalNewBytes) / grandTotalOldBytes) * 100).toFixed(1)
    : '0';

  console.log(`Total Old Size:  ${totalOldMb} MB`);
  console.log(`Total New Size:  ${totalNewMb} MB (-${totalSavings}%)`);

  if (allFailures.length > 0) {
    console.log('\nList of Failed Files:');
    allFailures.forEach((f) => {
      console.log(`  - [${f.bucket}] ${f.path}: ${f.error}`);
    });
  }
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Migration aborted with unhandled error:', err);
  process.exit(1);
});
