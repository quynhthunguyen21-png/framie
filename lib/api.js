import crypto from 'node:crypto';
import { pool, ensureSchema } from './db.js';
import { saveUpload } from './storage.js';

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
const encryptSecret = value => { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv); const enc = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]); const tag = cipher.getAuthTag(); return [iv, tag, enc].map(x => x.toString('base64url')).join('.'); };
const decryptSecret = value => { try { const [ivB, tagB, dataB] = String(value || '').split('.'); if (!ivB || !tagB || !dataB) return ''; const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, Buffer.from(ivB, 'base64url')); decipher.setAuthTag(Buffer.from(tagB, 'base64url')); return Buffer.concat([decipher.update(Buffer.from(dataB, 'base64url')), decipher.final()]).toString('utf8'); } catch { return ''; } };
const sanitizeNfc = (incoming = {}, existing = {}) => { const n = { ...(existing || {}), ...(incoming || {}) }; const supplied = Object.prototype.hasOwnProperty.call(incoming, 'password') ? String(incoming.password || '') : ''; if (!n.passwordEnabled) { delete n.password; delete n.passwordHash; delete n.passwordCipher; } else if (supplied) { n.passwordHash = hash(supplied); n.passwordCipher = encryptSecret(supplied); delete n.password; } else { delete n.password; } return n; };
const sign = payload => hash(payload + (process.env.JWT_SECRET || 'framie-local-secret')).slice(0, 48);
const token = u => { const payload = JSON.stringify({ id: u.id, email: u.email, iat: Date.now() }); return Buffer.from(payload).toString('base64url') + '.' + sign(payload); };
const safeUser = u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', address: u.address || '', createdAt: u.createdAt });
const DIACRITICS_RE = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');
const slugify = s => String(s || 'post').toLowerCase().normalize('NFD').replace(DIACRITICS_RE, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const rowToUser = r => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, address: r.address, password: r.password, createdAt: r.created_at });
const rowToDesign = r => ({ id: r.id, userId: r.user_id, name: r.name, config: r.config, nfc: r.nfc, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at });
const rowToOrder = r => ({ id: r.id, code: r.code, userId: r.user_id, designId: r.design_id, items: r.items, total: r.total, coupon: r.coupon, paymentMethod: r.payment_method, paymentStatus: r.payment_status, orderStatus: r.order_status, shipping: r.shipping, createdAt: r.created_at });
const rowToPost = r => ({ id: r.id, slug: r.slug, title: r.title, category: r.category, excerpt: r.excerpt, body: r.body, createdAt: r.created_at });

async function who(req) {
  try {
    const h = req.headers.authorization || ''; if (!h.startsWith('Bearer ')) return null;
    const [b, s] = h.slice(7).split('.'); const payload = Buffer.from(b, 'base64url').toString();
    if (sign(payload) !== s) return null;
    const p = JSON.parse(payload);
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1 AND email=$2', [p.id, p.email]);
    return rows[0] ? rowToUser(rows[0]) : null;
  } catch { return null; }
}
const auth = (res, u) => u ? true : (json(res, 401, { message: 'Vui lòng đăng nhập để tiếp tục.' }), false);

function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  return `${proto}://${host}`;
}

export async function api(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' }); return res.end(); }
  await ensureSchema();
  const origin = getOrigin(req);
  const u = new URL(req.url, origin);
  const p = u.pathname;
  if (p === '/api/health') return json(res, 200, { ok: true, app: 'Framie', time: new Date().toISOString() });
  if (p === '/api/catalog') return json(res, 200, catalog);

  if (p === '/api/auth/register' && req.method === 'POST') {
    const b = await body(req); const name = String(b.name || '').trim(); const email = String(b.email || '').trim().toLowerCase();
    if (!name || !email || !b.password || String(b.password).length < 6) return json(res, 400, { message: 'Vui lòng nhập đủ thông tin. Mật khẩu tối thiểu 6 ký tự.' });
    const exists = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (exists.rowCount) return json(res, 409, { message: 'Email đã tồn tại.' });
    const id = Date.now();
    const phone = String(b.phone || '').trim();
    const { rows } = await pool.query('INSERT INTO users (id,name,email,phone,address,password) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [id, name, email, phone, '', hash(String(b.password))]);
    const user = rowToUser(rows[0]);
    return json(res, 201, { user: safeUser(user), token: token(user) });
  }
  if (p === '/api/auth/login' && req.method === 'POST') {
    const b = await body(req); const identity = String(b.identity || b.email || '').trim().toLowerCase();
    const { rows } = await pool.query('SELECT * FROM users WHERE (lower(email)=$1 OR lower(phone)=$1) AND password=$2', [identity, hash(String(b.password || ''))]);
    if (!rows[0]) return json(res, 401, { message: 'Email / số điện thoại hoặc mật khẩu không đúng.' });
    const user = rowToUser(rows[0]);
    return json(res, 200, { user: safeUser(user), token: token(user) });
  }
  if (p === '/api/auth/forgot' && req.method === 'POST') return json(res, 200, { ok: true, message: 'Nếu tài khoản tồn tại, hướng dẫn khôi phục sẽ được gửi.' });
  if (p === '/api/auth/google/start' && req.method === 'GET') {
    if (!process.env.GOOGLE_CLIENT_ID) return json(res, 501, { message: 'Google Sign-In cần cấu hình GOOGLE_CLIENT_ID trong .env.' });
    const redirect = `${origin}/api/auth/google/callback`, q = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: 'openid email profile' });
    res.writeHead(302, { Location: 'https://accounts.google.com/o/oauth2/v2/auth?' + q.toString() }); return res.end();
  }
  if (p === '/api/auth/google/callback' && req.method === 'GET') {
    const code = u.searchParams.get('code');
    const fail = () => { res.writeHead(302, { Location: '/login?error=google' }); return res.end(); };
    if (!code || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return fail();
    try {
      const redirect = `${origin}/api/auth/google/callback`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirect, grant_type: 'authorization_code' })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) return fail();
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
      const profile = await profileRes.json();
      const email = String(profile.email || '').trim().toLowerCase();
      if (!email) return fail();
      const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
      let userRow = rows[0];
      if (!userRow) {
        const id = Date.now();
        const name = String(profile.name || email.split('@')[0]);
        const inserted = await pool.query('INSERT INTO users (id,name,email,phone,address,password) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [id, name, email, '', '', hash(crypto.randomBytes(24).toString('hex'))]);
        userRow = inserted.rows[0];
      }
      const user = rowToUser(userRow);
      const payload = Buffer.from(JSON.stringify({ user: safeUser(user), token: token(user) })).toString('base64url');
      res.writeHead(302, { Location: `/auth/google/complete?data=${payload}` }); return res.end();
    } catch { return fail(); }
  }
  if (p === '/api/auth/me') { const user = await who(req); return auth(res, user) && json(res, 200, { user: safeUser(user) }); }
  if (p === '/api/auth/profile' && req.method === 'PUT') {
    const user = await who(req); if (!auth(res, user)) return; const b = await body(req);
    const name = b.name !== undefined ? String(b.name).trim() : user.name;
    const phone = b.phone !== undefined ? String(b.phone).trim() : user.phone;
    const address = b.address !== undefined ? String(b.address).trim() : user.address;
    const { rows } = await pool.query('UPDATE users SET name=$1,phone=$2,address=$3 WHERE id=$4 RETURNING *', [name, phone, address, user.id]);
    return json(res, 200, { user: safeUser(rowToUser(rows[0])) });
  }
  if (p === '/api/auth/password' && req.method === 'PUT') {
    const user = await who(req); if (!auth(res, user)) return; const b = await body(req);
    if (!b.current || !b.next || String(b.next).length < 6 || user.password !== hash(String(b.current))) return json(res, 400, { message: 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới chưa hợp lệ.' });
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash(String(b.next)), user.id]);
    return json(res, 200, { ok: true });
  }

  if (p === '/api/upload' && req.method === 'POST') {
    const user = await who(req); if (!auth(res, user)) return; const b = await body(req);
    const data = String(b.data || ''); if (!data.includes(';base64,')) return json(res, 400, { message: 'Tệp không hợp lệ.' });
    const [head, payload] = data.split(';base64,'); const mime = head.replace('data:', '') || b.mime || 'application/octet-stream';
    if (payload.length > 35e6) return json(res, 413, { message: 'Tệp quá lớn (giới hạn 25 MB).' });
    try {
      const result = await saveUpload(payload, mime);
      return json(res, 201, result);
    } catch (e) { return json(res, 500, { message: e.message }); }
  }

  if (p.startsWith('/api/designs/') && p.endsWith('/nfc-password') && req.method === 'GET') {
    const user = await who(req); if (!auth(res, user)) return; const parts = p.split('/').filter(Boolean); const id = Number(parts[2]);
    const { rows } = await pool.query('SELECT * FROM designs WHERE id=$1 AND user_id=$2', [id, user.id]);
    if (!rows[0]) return json(res, 404, { message: 'Không tìm thấy thiết kế.' });
    const d = rowToDesign(rows[0]);
    return json(res, 200, { enabled: !!d.nfc?.passwordEnabled, password: d.nfc?.passwordCipher ? decryptSecret(d.nfc.passwordCipher) : null });
  }
  if (p.startsWith('/api/designs/') && p.endsWith('/nfc-password') && (req.method === 'PUT' || req.method === 'POST')) {
    const user = await who(req); if (!auth(res, user)) return;
    const parts = p.split('/').filter(Boolean); const id = Number(parts[2]);
    const { rows } = await pool.query('SELECT * FROM designs WHERE id=$1 AND user_id=$2', [id, user.id]);
    if (!rows[0]) return json(res, 404, { message: 'Không tìm thấy thiết kế.' });
    const d = rowToDesign(rows[0]);
    const b = await body(req);
    let nfc = d.nfc || {};
    if (!b.enabled) { nfc = { ...nfc, passwordEnabled: false, passwordHash: '' }; delete nfc.password; delete nfc.passwordCipher; }
    else {
      const password = String(b.password || '');
      if (password.length < 4) return json(res, 400, { message: 'Mật khẩu NFC tối thiểu 4 ký tự.' });
      nfc = { ...nfc, passwordEnabled: true, passwordHash: hash(password), passwordCipher: encryptSecret(password) }; delete nfc.password;
    }
    await pool.query('UPDATE designs SET nfc=$1, updated_at=now() WHERE id=$2', [JSON.stringify(nfc), id]);
    return json(res, 200, { ok: true, passwordEnabled: !!nfc.passwordEnabled });
  }

  if (p.startsWith('/api/designs')) {
    const user = await who(req); if (!auth(res, user)) return; const parts = p.split('/').filter(Boolean); const id = Number(parts[2]);
    if (req.method === 'GET' && parts.length === 2) {
      const { rows } = await pool.query('SELECT * FROM designs WHERE user_id=$1 ORDER BY id DESC', [user.id]);
      return json(res, 200, rows.map(rowToDesign));
    }
    if (req.method === 'GET' && id) {
      const { rows } = await pool.query('SELECT * FROM designs WHERE id=$1 AND user_id=$2', [id, user.id]);
      return rows[0] ? json(res, 200, rowToDesign(rows[0])) : json(res, 404, { message: 'Không tìm thấy thiết kế.' });
    }
    if (req.method === 'POST') {
      const b = await body(req);
      const newId = Date.now();
      const { rows } = await pool.query(
        'INSERT INTO designs (id,user_id,name,config,nfc,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [newId, user.id, b.name || 'Framie custom', JSON.stringify(b.config || {}), JSON.stringify(sanitizeNfc(b.nfc || {}, {})), b.status || 'draft']
      );
      return json(res, 201, rowToDesign(rows[0]));
    }
    if (req.method === 'PUT' && id) {
      const existing = await pool.query('SELECT * FROM designs WHERE id=$1 AND user_id=$2', [id, user.id]);
      if (!existing.rows[0]) return json(res, 404, { message: 'Không tìm thấy thiết kế.' });
      const d = rowToDesign(existing.rows[0]);
      const b = await body(req);
      const config = b.config ?? d.config;
      const nfc = b.nfc !== undefined ? sanitizeNfc(b.nfc, d.nfc || {}) : d.nfc;
      const name = b.name || d.name;
      const status = b.status || d.status;
      const { rows } = await pool.query('UPDATE designs SET config=$1,nfc=$2,name=$3,status=$4,updated_at=now() WHERE id=$5 RETURNING *', [JSON.stringify(config), JSON.stringify(nfc), name, status, id]);
      return json(res, 200, rowToDesign(rows[0]));
    }
  }

  if (p === '/api/checkout' && req.method === 'POST') {
    const user = await who(req); if (!auth(res, user)) return; const b = await body(req);
    const items = Array.isArray(b.items) ? b.items : []; const total = Number(b.total || 0);
    const { rows } = await pool.query(
      `INSERT INTO orders (code,user_id,design_id,items,total,coupon,payment_method,payment_status,order_status,shipping)
       VALUES ('PENDING',$1,$2,$3,$4,$5,$6,$7,'pending',$8) RETURNING id`,
      [user.id, b.designId || null, JSON.stringify(items), total, b.coupon ? JSON.stringify(b.coupon) : null, b.paymentMethod || 'bank', b.paymentMethod === 'cod' ? 'pending' : 'prototype_pending', JSON.stringify(b.shipping || {})]
    );
    const id = rows[0].id;
    const code = `FR${String(id).padStart(6, '0')}`;
    await pool.query('UPDATE orders SET code=$1 WHERE id=$2', [code, id]);
    return json(res, 201, { orderId: id, orderCode: code, message: `Đơn hàng ${code} đã được tạo thành công.` });
  }
  if (p === '/api/orders' && req.method === 'GET') {
    const user = await who(req); if (!auth(res, user)) return;
    const { rows } = await pool.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY id DESC', [user.id]);
    return json(res, 200, rows.map(rowToOrder));
  }

  if (p.startsWith('/api/nfc/')) {
    const parts = p.split('/').filter(Boolean); const id = Number(parts[2]);
    const { rows } = await pool.query("SELECT * FROM designs WHERE id=$1 AND status != 'draft'", [id]);
    if (!rows[0]) return json(res, 404, { message: 'Không tìm thấy trang NFC.' });
    const d = rowToDesign(rows[0]);
    if (parts[3] === 'scan' && req.method === 'POST') {
      await pool.query('INSERT INTO scans (id, design_id) VALUES ($1,$2)', [Date.now(), id]);
      return json(res, 200, { ok: true });
    }
    const scanCount = await pool.query('SELECT count(*)::int AS n FROM scans WHERE design_id=$1', [id]);
    const scans = scanCount.rows[0].n;
    const publicNfc = () => { const n = JSON.parse(JSON.stringify(d.nfc || {})); delete n.passwordHash; delete n.password; delete n.passwordCipher; return n; };
    if (parts[3] === 'unlock' && req.method === 'POST') {
      const b = await body(req); const supplied = String(b.password || '');
      if (!d.nfc?.passwordEnabled) return json(res, 200, { id: d.id, name: d.name, config: d.config, nfc: publicNfc(), scans });
      if (!supplied || hash(supplied) !== d.nfc.passwordHash) return json(res, 401, { message: 'Mật khẩu không đúng.' });
      return json(res, 200, { id: d.id, name: d.name, config: d.config, nfc: publicNfc(), scans });
    }
    if (d.nfc?.passwordEnabled) return json(res, 200, { id: d.id, name: d.name, config: d.config, protected: true, scans });
    return json(res, 200, { id: d.id, name: d.name, config: d.config, nfc: publicNfc(), scans });
  }
  if (p === '/api/analytics' && req.method === 'GET') {
    const user = await who(req); if (!auth(res, user)) return;
    const { rows } = await pool.query(
      `SELECT d.id, d.name, COUNT(s.id)::int AS scans
       FROM designs d LEFT JOIN scans s ON s.design_id = d.id
       WHERE d.user_id = $1 GROUP BY d.id, d.name ORDER BY d.id DESC`,
      [user.id]
    );
    const totalScans = rows.reduce((a, r) => a + r.scans, 0);
    return json(res, 200, { totalScans, byDesign: rows });
  }

  if (p === '/api/posts' && req.method === 'GET') {
    const { rows } = await pool.query('SELECT * FROM posts ORDER BY id DESC');
    return json(res, 200, rows.map(rowToPost));
  }
  if (p.startsWith('/api/posts/') && req.method === 'GET') {
    const slug = p.split('/')[3];
    const { rows } = await pool.query('SELECT * FROM posts WHERE slug=$1', [slug]);
    return rows[0] ? json(res, 200, rowToPost(rows[0])) : json(res, 404, { message: 'Không tìm thấy bài viết.' });
  }
  if (p === '/api/posts' && req.method === 'POST') {
    const user = await who(req); if (!auth(res, user)) return; const b = await body(req);
    const { rows } = await pool.query(
      'INSERT INTO posts (id,slug,title,category,excerpt,body) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [Date.now(), slugify(b.title), b.title || 'Bài viết mới', b.category || 'Cảm hứng', b.excerpt || '', b.body || '']
    );
    return json(res, 201, rowToPost(rows[0]));
  }
  if (p === '/api/contact' && req.method === 'POST') {
    const b = await body(req);
    await pool.query('INSERT INTO contacts (id,name,email,phone,message) VALUES ($1,$2,$3,$4,$5)', [Date.now(), b.name || null, b.email || null, b.phone || null, b.message || null]);
    return json(res, 201, { ok: true, message: 'Framie đã nhận được yêu cầu liên hệ.' });
  }
  if (p === '/api/coupon' && req.method === 'POST') {
    const b = await body(req); const code = String(b.code || '').trim().toUpperCase(); const coupons = { FRAMIE10: .10, MEMORY20: .20, WELCOME50: .50 };
    return coupons[code] ? json(res, 200, { valid: true, code, discount: coupons[code], message: `Đã áp dụng mã ${code}.` }) : json(res, 400, { valid: false, message: 'Mã giảm giá không hợp lệ.' });
  }
  return json(res, 404, { message: 'Not found' });
}
