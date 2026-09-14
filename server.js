import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from './lib/api.js';
import { readLocalFile, isCloudStorageEnabled } from './lib/storage.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(root, 'public');

function staticFile(req, res) {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname.startsWith('/storage/')) {
    if (isCloudStorageEnabled()) return json(res, 404, { message: 'Not found (uploads are served from Supabase Storage now).' });
    const requested = decodeURIComponent(u.pathname.slice(9));
    const filePath = readLocalFile(requested);
    if (!filePath) return json(res, 404, { message: 'Not found' });
    const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.webm': 'video/webm', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' }[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' }); return fs.createReadStream(filePath).pipe(res);
  }
  let reqPath = decodeURIComponent(u.pathname); if (reqPath === '/' || !reqPath.includes('.')) reqPath = '/index.html';
  const f = path.join(pub, reqPath); if (!f.startsWith(pub) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return json(res, 404, { message: 'Not found' });
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mov': 'video/quicktime' }[path.extname(f).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime }); fs.createReadStream(f).pipe(res);
}
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

const server = http.createServer((req, res) => (req.url?.startsWith('/api/') ? api(req, res).catch(e => json(res, 500, { message: 'Server error', detail: e.message })) : staticFile(req, res)));
server.listen(process.env.PORT || 5173, () => console.log(`Framie running at http://localhost:${process.env.PORT || 5173}`));
