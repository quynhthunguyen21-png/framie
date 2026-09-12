import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const EXT_MAP = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'framie-uploads';

const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// Local fallback (used automatically when Supabase Storage env vars are not
// set, e.g. local dev) — mirrors the previous disk-based behavior.
let localStore = null;
function getLocalStore() {
  if (!localStore) {
    const root = process.cwd();
    localStore = path.join(root, 'storage');
    fs.mkdirSync(localStore, { recursive: true });
  }
  return localStore;
}

export function isCloudStorageEnabled() {
  return cloudEnabled;
}

export async function saveUpload(base64Payload, mime) {
  const ext = EXT_MAP[mime] || 'bin';
  const file = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const buffer = Buffer.from(base64Payload, 'base64');

  if (cloudEnabled) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${file}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': mime || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: buffer,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Không thể tải tệp lên Supabase Storage (${res.status}): ${detail.slice(0, 200)}`);
    }
    return { url: `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${file}`, mime };
  }

  fs.writeFileSync(path.join(getLocalStore(), file), buffer);
  return { url: '/storage/' + file, mime };
}

export function readLocalFile(requestedPath) {
  const store = getLocalStore();
  const filePath = path.join(store, requestedPath);
  if (!filePath.startsWith(store) || !fs.existsSync(filePath)) return null;
  return filePath;
}
