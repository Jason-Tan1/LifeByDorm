/**
 * One-time migration: replace every hotlinked (external) Dorm.imageUrl with a
 * self-hosted copy on our own S3 bucket.
 *
 * Usage:
 *   npm run migrate:dorm-images            # dry-run
 *   npm run migrate:dorm-images -- --apply # actually write changes
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import net from 'net';
import dns from 'dns/promises';
import { Dorm } from '../src/models/dorm';
import { uploadBufferToS3 } from '../src/s3';

dotenv.config();

const MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = 'LifeByDormImageMigrator/1.0';

const apply = process.argv.includes('--apply');

function ownS3HostPattern(): RegExp | null {
  const bucket = (process.env.AWS_BUCKET_NAME || '').trim();
  const region = (process.env.AWS_REGION || '').trim();
  if (!bucket || !region) return null;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https:\\/\\/${esc(bucket)}\\.s3\\.${esc(region)}\\.amazonaws\\.com\\/`);
}

function isPrivateIp(ip: string): boolean {
  if (net.isIP(ip) === 0) return false;
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
  }
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

async function assertSafeHostname(url: URL): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`unsupported protocol: ${url.protocol}`);
  }
  const hostname = url.hostname;
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error(`refusing to fetch private IP: ${hostname}`);
  }
  try {
    const addrs = await dns.lookup(hostname, { all: true });
    for (const a of addrs) {
      if (isPrivateIp(a.address)) {
        throw new Error(`${hostname} resolves to private IP: ${a.address}`);
      }
    }
  } catch (err) {
    throw new Error(`DNS lookup failed for ${hostname}: ${(err as Error).message}`);
  }
}

async function downloadImage(rawUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  const url = new URL(rawUrl);
  await assertSafeHostname(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType) throw new Error('no Content-Type header');

    const declaredLen = parseInt(res.headers.get('content-length') || '0', 10);
    if (declaredLen > MAX_BYTES) {
      throw new Error(`Content-Length ${declaredLen} exceeds 10MB cap`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('no response body');

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_BYTES) {
          await reader.cancel();
          throw new Error(`response exceeds 10MB cap`);
        }
        chunks.push(value);
      }
    }

    return { buffer: Buffer.concat(chunks), contentType };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  const ownS3 = ownS3HostPattern();
  if (!ownS3) {
    console.error('AWS_BUCKET_NAME / AWS_REGION must be set to identify our own S3 URLs');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected. Mode: ${apply ? 'APPLY (writing DB changes)' : 'DRY-RUN (no DB writes, pass --apply)'}`);

  const dorms = await Dorm.find({
    imageUrl: { $exists: true, $ne: null, $nin: ['', null] }
  });

  const externalDorms = dorms.filter((d) => d.imageUrl && !ownS3.test(d.imageUrl));
  console.log(`Total dorms with imageUrl: ${dorms.length}`);
  console.log(`Already on our S3:        ${dorms.length - externalDorms.length}`);
  console.log(`To migrate (external):    ${externalDorms.length}`);
  console.log('');

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const dorm of externalDorms) {
    const label = `${dorm.universitySlug}/${dorm.slug}`;
    const original = dorm.imageUrl as string;
    try {
      const { buffer, contentType } = await downloadImage(original);
      // uploadBufferToS3 runs MIME allowlist + magic byte + size validation
      const newUrl = await uploadBufferToS3(buffer, contentType, 'dorms');
      console.log(`✓ ${label}: ${original.slice(0, 60)}... -> ${newUrl}`);
      if (apply) {
        dorm.imageUrl = newUrl;
        await dorm.save();
      }
      migrated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`✗ ${label}: ${msg} (${original})`);
      if (apply) {
        // Clear the broken/rejected hotlink so the client falls back to the default image
        dorm.imageUrl = null as any;
        await dorm.save();
        skipped++;
      } else {
        failed++;
      }
    }
  }

  console.log('');
  console.log(`Done. migrated=${migrated} cleared=${skipped} failed=${failed}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
