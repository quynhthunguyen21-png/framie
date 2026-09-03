import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(root, 'public');
const dataDir = path.join(root, 'data');
const store = path.join(root, 'storage');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(store, { recursive: true });

const dbFile = path.join(dataDir, 'db.json');
const seed = {
  users: [], designs: [], orders: [], contacts: [], scans: [],
  posts: [
    { id: 1, slug: 'qua-tot-nghiep', title: 'Một món quà để nhớ về ngày mình đã lớn', category: 'Quà tặng', excerpt: 'Giữ một ngày quan trọng lại trong ảnh, lời nhắn và một lần chạm.', body: 'Từ một bức ảnh tốt nghiệp đến lời chúc bằng chính giọng nói của bạn, Framie biến một món quà nhỏ thành một câu chuyện nhiều lớp.' },
    { id: 2, slug: 'nfc-la-gi', title: 'NFC là gì và vì sao một lần chạm có thể kể cả câu chuyện?', category: 'Công nghệ', excerpt: 'Hiểu NFC theo cách đơn giản và gần gũi.', body: 'NFC là lớp kết nối giúp điện thoại mở một địa chỉ web gắn với sản phẩm mà không cần ứng dụng riêng. Người nhận chỉ cần đưa điện thoại lại gần vùng NFC để mở trang ký ức.' },
    { id: 3, slug: 'y-tuong-qua-tang', title: '7 ý tưởng Framie cho những người bạn yêu quý', category: 'Cảm hứng', excerpt: 'Sinh nhật, tốt nghiệp, yêu xa, gia đình và những ngày rất riêng.', body: 'Hãy bắt đầu từ một khoảnh khắc, một câu nói hoặc một kỷ niệm. Sau đó xây trải nghiệm quanh điều đó bằng ảnh, video, âm thanh và lời nhắn.' },
    { id: 4, slug: 'thiet-ke-mot-framie', title: 'Bắt đầu thiết kế Framie từ đâu?', category: 'Cẩm nang', excerpt: 'Một checklist nhỏ để món quà trông đẹp và kể đúng câu chuyện.', body: 'Chọn ảnh chính trước, rồi thêm một câu thật ngắn. Với NFC, hãy dùng giọng nói hoặc video cho những điều khó nói bằng chữ.' },
    { id: 5, slug: 'qua-tang-cam-xuc', title: 'Vì sao những món quà có câu chuyện thường được nhớ lâu hơn?', category: 'Lifestyle', excerpt: 'Không cần cầu kỳ, chỉ cần đủ riêng tư và đúng người.', body: 'Giá trị của món quà không chỉ nằm ở vật thể. Một lớp ký ức số giúp người nhận quay lại khoảnh khắc ấy nhiều lần, theo cách nhẹ nhàng.' }
  ]
};

let db;
try { db = JSON.parse(fs.readFileSync(dbFile, 'utf8')); }
catch { db = seed; fs.writeFileSync(dbFile, JSON.stringify(db, null, 2)); }
for (const k of Object.keys(seed)) db[k] ??= [];
const save = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

const catalog = {
  plans: [
    { code: 'basic', number: '01', name: 'Framie Basic', price: 99000, description: 'Khung tranh NFC tinh gọn cho một kỷ niệm thật đẹp.', features: ['Tối đa 1 ảnh', 'Text mặt khung', 'NFC landing cơ bản'] },
    { code: 'memory', number: '02', name: 'Framie Memory', price: 199000, description: 'Không gian cho ảnh, âm thanh và một câu chuyện nhiều lớp.', features: ['Tối đa 5 ảnh', 'File thu âm / audio', 'NFC landing nâng cao'], popular: true },
    { code: 'standard', number: '03', name: 'Framie Standard', price: 299000, description: 'Trải nghiệm custom trọn vẹn cho món quà đặc biệt.', features: ['Thiết kế riêng không giới hạn', 'Album ảnh số', 'Audio + video đa tầng', 'Quản trị bảo mật cao cấp'] }
  ],
  frames: [{ code: 'portrait', name: 'Khung đứng' }, { code: 'landscape', name: 'Khung ngang' }],
  colors: [
    { code: 'cream', name: 'Trắng kem', hex: '#FFF8F8' },
    { code: 'wood', name: 'Gỗ sáng', hex: '#D9B89A' },
    { code: 'black', name: 'Đen', hex: '#2F2527' },
    { code: 'beige', name: 'Beige', hex: '#E8D4D2' },
    { code: 'pink', name: 'Hồng pastel', hex: '#FFD3D6' },
    { code: 'deep-red', name: 'Đỏ trầm', hex: '#8F352D' }
  ],
  sizes: ['10 x 15 cm', '13 x 18 cm', '15 x 21 cm', '20 x 30 cm']
};

const json = (res, code, obj, extra = {}) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...extra
  });
  res.end(JSON.stringify(obj));
};
const body = req => new Promise((resolve, reject) => {
  let s = '';
  req.on('data', c => { s += c; if (s.length > 50e6) req.destroy(); });
  req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
});
const hash = p => crypto.createHash('sha256').update(p).digest('hex');
const secretKey = crypto.createHash('sha256').update(process.env.NFC_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'framie-local-secret').digest();
const encryptSecret = value => { const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm',secretKey,iv); const enc=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]); const tag=cipher.getAuthTag(); return [iv,tag,enc].map(x=>x.toString('base64url')).join('.'); };
const decryptSecret = value => { try { const [ivB,tagB,dataB]=String(value||'').split('.'); if(!ivB||!tagB||!dataB)return ''; const decipher=crypto.createDecipheriv('aes-256-gcm',secretKey,Buffer.from(ivB,'base64url')); decipher.setAuthTag(Buffer.from(tagB,'base64url')); return Buffer.concat([decipher.update(Buffer.from(dataB,'base64url')),decipher.final()]).toString('utf8'); } catch { return ''; } };
const sanitizeNfc = (incoming={}, existing={}) => { const n={...(existing||{}),...(incoming||{})}; const supplied=Object.prototype.hasOwnProperty.call(incoming,'password') ? String(incoming.password||'') : ''; if(!n.passwordEnabled){ delete n.password; delete n.passwordHash; delete n.passwordCipher; } else if(supplied){ n.passwordHash=hash(supplied); n.passwordCipher=encryptSecret(supplied); delete n.password; } else { delete n.password; } return n; };
const sign = payload => hash(payload + (process.env.JWT_SECRET || 'framie-local-secret')).slice(0, 48);
const token = u => { const payload = JSON.stringify({ id: u.id, email: u.email, iat: Date.now() }); return Buffer.from(payload).toString('base64url') + '.' + sign(payload); };
const who = req => {
  try {
    const h = req.headers.authorization || ''; if (!h.startsWith('Bearer ')) return null;
    const [b, s] = h.slice(7).split('.'); const payload = Buffer.from(b, 'base64url').toString();
    if (sign(payload) !== s) return null;
    const p = JSON.parse(payload); return db.users.find(u => u.id === p.id && u.email === p.email) || null;
  } catch { return null; }
};
const auth = (res, u) => u ? true : (json(res, 401, { message: 'Vui lòng đăng nhập để tiếp tục.' }), false);
const safeUser = u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', address: u.address || '', createdAt: u.createdAt });
const slugify = s => String(s || 'post').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function api(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' }); return res.end(); }
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;
  if (p === '/api/health') return json(res, 200, { ok: true, app: 'Framie', time: new Date().toISOString() });
  if (p === '/api/catalog') return json(res, 200, catalog);

  if (p === '/api/auth/register' && req.method === 'POST') {
    const b = await body(req); const name = String(b.name || '').trim(); const email = String(b.email || '').trim().toLowerCase();
    if (!name || !email || !b.password || String(b.password).length < 6) return json(res, 400, { message: 'Vui lòng nhập đủ thông tin. Mật khẩu tối thiểu 6 ký tự.' });
    if (db.users.some(x => x.email === email)) return json(res, 409, { message: 'Email đã tồn tại.' });
    const user = { id: Date.now(), name, email, phone: String(b.phone || '').trim(), address: '', password: hash(String(b.password)), createdAt: new Date().toISOString() };
    db.users.push(user); save(); return json(res, 201, { user: safeUser(user), token: token(user) });
  }
  if (p === '/api/auth/login' && req.method === 'POST') {
    const b = await body(req); const identity = String(b.identity || b.email || '').trim().toLowerCase();
    const user = db.users.find(x => (x.email.toLowerCase() === identity || (x.phone || '').toLowerCase() === identity) && x.password === hash(String(b.password || '')));
    if (!user) return json(res, 401, { message: 'Email / số điện thoại hoặc mật khẩu không đúng.' });
    return json(res, 200, { user: safeUser(user), token: token(user) });
  }
  if (p === '/api/auth/forgot' && req.method === 'POST') return json(res, 200, { ok: true, message: 'Nếu tài khoản tồn tại, hướng dẫn khôi phục sẽ được gửi.' });
  if (p === '/api/auth/google/start' && req.method === 'GET') {
    if (!process.env.GOOGLE_CLIENT_ID) return json(res, 501, { message: 'Google Sign-In cần cấu hình GOOGLE_CLIENT_ID trong .env.' });
    const redirect = `${u.origin}/api/auth/google/callback`, q = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: 'openid email profile' });
    res.writeHead(302, { Location: 'https://accounts.google.com/o/oauth2/v2/auth?' + q.toString() }); return res.end();
  }
  if (p === '/api/auth/me') { const user = who(req); return auth(res, user) && json(res, 200, { user: safeUser(user) }); }
  if (p === '/api/auth/profile' && req.method === 'PUT') {
    const user = who(req); if (!auth(res, user)) return; const b = await body(req);
    if (b.name !== undefined) user.name = String(b.name).trim(); if (b.phone !== undefined) user.phone = String(b.phone).trim(); if (b.address !== undefined) user.address = String(b.address).trim();
    save(); return json(res, 200, { user: safeUser(user) });
  }
  if (p === '/api/auth/password' && req.method === 'PUT') {
    const user = who(req); if (!auth(res, user)) return; const b = await body(req);
    if (!b.current || !b.next || String(b.next).length < 6 || user.password !== hash(String(b.current))) return json(res, 400, { message: 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới chưa hợp lệ.' });
    user.password = hash(String(b.next)); save(); return json(res, 200, { ok: true });
  }

  if (p === '/api/upload' && req.method === 'POST') {
    const user = who(req); if (!auth(res, user)) return; const b = await body(req);
    const data = String(b.data || ''); if (!data.includes(';base64,')) return json(res, 400, { message: 'Tệp không hợp lệ.' });
    const [head, payload] = data.split(';base64,'); const mime = head.replace('data:', '') || b.mime || 'application/octet-stream';
    if (payload.length > 35e6) return json(res, 413, { message: 'Tệp quá lớn (giới hạn local 25 MB).' });
    const extMap = { 'image/png':'png','image/jpeg':'jpg','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','audio/webm':'webm','audio/mpeg':'mp3','audio/wav':'wav' };
    const ext = extMap[mime] || 'bin'; const file = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(store, file), Buffer.from(payload, 'base64')); return json(res, 201, { url: '/storage/' + file, mime });
  }

  if (p.startsWith('/api/designs/') && p.endsWith('/nfc-password') && req.method === 'GET') {
    const user = who(req); if (!auth(res, user)) return; const parts = p.split('/').filter(Boolean); const id = Number(parts[2]);
    const d = db.designs.find(x => x.id === id && x.userId === user.id); if (!d) return json(res, 404, { message: 'Không tìm thấy thiết kế.' });
    return json(res, 200, { enabled: !!d.nfc?.passwordEnabled, password: d.nfc?.passwordCipher ? decryptSecret(d.nfc.passwordCipher) : null });
  }
  if (p.startsWith('/api/designs/') && p.endsWith('/nfc-password') && (req.method === 'PUT' || req.method === 'POST')) {
    const user = who(req); if (!auth(res, user)) return;
    const parts = p.split('/').filter(Boolean); const id = Number(parts[2]);
    const d = db.designs.find(x => x.id === id && x.userId === user.id); if (!d) return json(res, 404, { message: 'Không tìm thấy thiết kế.' });
    const b = await body(req);
    if (!d.nfc) d.nfc = {};
    if (!b.enabled) { d.nfc.passwordEnabled = false; d.nfc.passwordHash = ''; delete d.nfc.password; delete d.nfc.passwordCipher; }
    else {
      const password = String(b.password || '');
      if (password.length < 4) return json(res, 400, { message: 'Mật khẩu NFC tối thiểu 4 ký tự.' });
      d.nfc.passwordEnabled = true; d.nfc.passwordHash = hash(password); d.nfc.passwordCipher = encryptSecret(password); delete d.nfc.password;
    }
    d.updatedAt = new Date().toISOString(); save(); return json(res, 200, { ok: true, passwordEnabled: !!d.nfc.passwordEnabled });
  }

  if (p.startsWith('/api/designs')) {
    const user = who(req); if (!auth(res, user)) return; const parts = p.split('/').filter(Boolean); const id = Number(parts[2]);
    if (req.method === 'GET' && parts.length === 2) return json(res, 200, db.designs.filter(x => x.userId === user.id));
    if (req.method === 'GET' && id) { const d = db.designs.find(x => x.id === id && x.userId === user.id); return d ? json(res, 200, d) : json(res, 404, { message: 'Không tìm thấy thiết kế.' }); }
    if (req.method === 'POST') {
      const b = await body(req); const d = { id: Date.now(), userId: user.id, name: b.name || 'Framie custom', config: b.config || {}, nfc: sanitizeNfc(b.nfc || {}, {}), status: b.status || 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.designs.push(d); save(); return json(res, 201, d);
    }
    if (req.method === 'PUT' && id) {
      const d = db.designs.find(x => x.id === id && x.userId === user.id); if (!d) return json(res, 404, { message: 'Không tìm thấy thiết kế.' });
      const b = await body(req); Object.assign(d, { config: b.config ?? d.config, nfc: b.nfc !== undefined ? sanitizeNfc(b.nfc, d.nfc || {}) : d.nfc, name: b.name || d.name, status: b.status || d.status, updatedAt: new Date().toISOString() }); save(); return json(res, 200, d);
    }
  }

  if (p === '/api/checkout' && req.method === 'POST') {
    const user = who(req); if (!auth(res, user)) return; const b = await body(req);
    const items = Array.isArray(b.items) ? b.items : []; const total = Number(b.total || 0);
    const id = db.orders.length ? Math.max(...db.orders.map(x => x.id)) + 1 : 1;
    const order = { id, code: `FR${String(id).padStart(6, '0')}`, userId: user.id, designId: b.designId || null, items, total, coupon: b.coupon || null, paymentMethod: b.paymentMethod || 'bank', paymentStatus: b.paymentMethod === 'cod' ? 'pending' : 'prototype_pending', orderStatus: 'pending', shipping: b.shipping || {}, createdAt: new Date().toISOString() };
    db.orders.push(order); save(); return json(res, 201, { orderId: order.id, orderCode: order.code, message: `Đơn hàng ${order.code} đã được tạo thành công.` });
  }
  if (p === '/api/orders' && req.method === 'GET') { const user = who(req); if (!auth(res, user)) return; return json(res, 200, db.orders.filter(x => x.userId === user.id).sort((a,b)=>b.id-a.id)); }

  if (p.startsWith('/api/nfc/')) {
    const parts = p.split('/').filter(Boolean); const id = Number(parts[2]); const d = db.designs.find(x => x.id === id && x.status !== 'draft');
    if (!d) return json(res, 404, { message: 'Không tìm thấy trang NFC.' });
    if (parts[3] === 'scan' && req.method === 'POST') { db.scans.push({ id: Date.now(), designId: id, at: new Date().toISOString() }); save(); return json(res, 200, { ok: true }); }
    if (parts[3] === 'unlock' && req.method === 'POST') {
      const b = await body(req); const supplied = String(b.password || '');
      const publicNfc = () => { const n = JSON.parse(JSON.stringify(d.nfc || {})); delete n.passwordHash; delete n.password; delete n.passwordCipher; return n; };
      if (!d.nfc?.passwordEnabled) return json(res, 200, { id: d.id, name: d.name, config: d.config, nfc: publicNfc(), scans: db.scans.filter(x => x.designId === id).length });
      if (!supplied || hash(supplied) !== d.nfc.passwordHash) return json(res, 401, { message: 'Mật khẩu không đúng.' });
      return json(res, 200, { id: d.id, name: d.name, config: d.config, nfc: publicNfc(), scans: db.scans.filter(x => x.designId === id).length });
    }
    const scans = db.scans.filter(x => x.designId === id).length;
    const publicNfc = () => { const n = JSON.parse(JSON.stringify(d.nfc || {})); delete n.passwordHash; delete n.password; delete n.passwordCipher; return n; };
    if (d.nfc?.passwordEnabled) return json(res, 200, { id: d.id, name: d.name, config: d.config, protected: true, scans });
    return json(res, 200, { id: d.id, name: d.name, config: d.config, nfc: publicNfc(), scans });
  }
  if (p === '/api/analytics' && req.method === 'GET') { const user = who(req); if (!auth(res, user)) return; const designs = db.designs.filter(x=>x.userId===user.id); return json(res,200,{ totalScans: designs.reduce((a,d)=>a+db.scans.filter(s=>s.designId===d.id).length,0), byDesign: designs.map(d=>({id:d.id,name:d.name,scans:db.scans.filter(s=>s.designId===d.id).length})) }); }

  if (p === '/api/posts' && req.method === 'GET') return json(res, 200, [...db.posts].sort((a,b)=>b.id-a.id));
  if (p.startsWith('/api/posts/') && req.method === 'GET') { const slug = p.split('/')[3]; const post = db.posts.find(x => x.slug === slug); return post ? json(res, 200, post) : json(res, 404, { message: 'Không tìm thấy bài viết.' }); }
  if (p === '/api/posts' && req.method === 'POST') { const user = who(req); if (!auth(res,user)) return; const b=await body(req); const post={id:Date.now(),slug:slugify(b.title),title:b.title||'Bài viết mới',category:b.category||'Cảm hứng',excerpt:b.excerpt||'',body:b.body||'',createdAt:new Date().toISOString()}; db.posts.unshift(post); save(); return json(res,201,post); }
  if (p === '/api/contact' && req.method === 'POST') { const b = await body(req); db.contacts.push({ id: Date.now(), ...b, createdAt: new Date().toISOString() }); save(); return json(res, 201, { ok: true, message: 'Framie đã nhận được yêu cầu liên hệ.' }); }
  if (p === '/api/coupon' && req.method === 'POST') {
    const b = await body(req); const code = String(b.code || '').trim().toUpperCase(); const coupons = { FRAMIE10: .10, MEMORY20: .20, WELCOME50: .50 };
    return coupons[code] ? json(res,200,{valid:true,code,discount:coupons[code],message:`Đã áp dụng mã ${code}.`}) : json(res,400,{valid:false,message:'Mã giảm giá không hợp lệ.'});
  }
  return json(res, 404, { message: 'Not found' });
}

function staticFile(req, res) {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname.startsWith('/storage/')) {
    const requested = decodeURIComponent(u.pathname.slice(9)); const filePath = path.join(store, requested);
    if (!filePath.startsWith(store) || !fs.existsSync(filePath)) return json(res,404,{message:'Not found'});
    const mime = { '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.webm':'video/webm','.mp4':'video/mp4','.mp3':'audio/mpeg','.wav':'audio/wav' }[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {'Content-Type':mime,'Cache-Control':'public, max-age=31536000, immutable'}); return fs.createReadStream(filePath).pipe(res);
  }
  let reqPath = decodeURIComponent(u.pathname); if (reqPath === '/' || !reqPath.includes('.')) reqPath = '/index.html';
  const f = path.join(pub, reqPath); if (!f.startsWith(pub) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return json(res,404,{message:'Not found'});
  const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml' }[path.extname(f).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {'Content-Type':mime}); fs.createReadStream(f).pipe(res);
}

const server = http.createServer((req,res)=> (req.url?.startsWith('/api/') ? api(req,res).catch(e=>json(res,500,{message:'Server error',detail:e.message})) : staticFile(req,res)));
server.listen(process.env.PORT || 5173, ()=>console.log(`Framie running at http://localhost:${process.env.PORT || 5173}`));
