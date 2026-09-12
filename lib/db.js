import pg from 'pg';

const { Pool } = pg;

// node-postgres returns BIGINT (OID 20) as a string by default, to avoid
// silent precision loss beyond Number.MAX_SAFE_INTEGER. Every id in this
// app is a Date.now() millisecond timestamp (or a small serial), which is
// always well within that safe range, and the frontend compares/parses ids
// as numbers — so parse BIGINT as a JS number here instead.
pg.types.setTypeParser(20, val => (val === null ? null : Number(val)));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in (see README).');
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
});

let schemaReady = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS designs (
        id BIGINT PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT 'Framie custom',
        config JSONB NOT NULL DEFAULT '{}'::jsonb,
        nfc JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS designs_user_id_idx ON designs(user_id);
      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        design_id BIGINT,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        total INTEGER NOT NULL DEFAULT 0,
        coupon JSONB,
        payment_method TEXT,
        payment_status TEXT,
        order_status TEXT,
        shipping JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
      CREATE TABLE IF NOT EXISTS scans (
        id BIGINT PRIMARY KEY,
        design_id BIGINT NOT NULL,
        at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS scans_design_id_idx ON scans(design_id);
      CREATE TABLE IF NOT EXISTS posts (
        id BIGINT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        excerpt TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS contacts (
        id BIGINT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `).then(async () => {
      const { rows } = await pool.query('SELECT count(*)::int AS n FROM posts');
      if (rows[0].n === 0) {
        const seedPosts = [
          [1, 'qua-tot-nghiep', 'Một món quà để nhớ về ngày mình đã lớn', 'Quà tặng', 'Giữ một ngày quan trọng lại trong ảnh, lời nhắn và một lần chạm.', 'Từ một bức ảnh tốt nghiệp đến lời chúc bằng chính giọng nói của bạn, Framie biến một món quà nhỏ thành một câu chuyện nhiều lớp.'],
          [2, 'nfc-la-gi', 'NFC là gì và vì sao một lần chạm có thể kể cả câu chuyện?', 'Công nghệ', 'Hiểu NFC theo cách đơn giản và gần gũi.', 'NFC là lớp kết nối giúp điện thoại mở một địa chỉ web gắn với sản phẩm mà không cần ứng dụng riêng. Người nhận chỉ cần đưa điện thoại lại gần vùng NFC để mở trang ký ức.'],
          [3, 'y-tuong-qua-tang', '7 ý tưởng Framie cho những người bạn yêu quý', 'Cảm hứng', 'Sinh nhật, tốt nghiệp, yêu xa, gia đình và những ngày rất riêng.', 'Hãy bắt đầu từ một khoảnh khắc, một câu nói hoặc một kỷ niệm. Sau đó xây trải nghiệm quanh điều đó bằng ảnh, video, âm thanh và lời nhắn.'],
          [4, 'thiet-ke-mot-framie', 'Bắt đầu thiết kế Framie từ đâu?', 'Cẩm nang', 'Một checklist nhỏ để món quà trông đẹp và kể đúng câu chuyện.', 'Chọn ảnh chính trước, rồi thêm một câu thật ngắn. Với NFC, hãy dùng giọng nói hoặc video cho những điều khó nói bằng chữ.'],
          [5, 'qua-tang-cam-xuc', 'Vì sao những món quà có câu chuyện thường được nhớ lâu hơn?', 'Lifestyle', 'Không cần cầu kỳ, chỉ cần đủ riêng tư và đúng người.', 'Giá trị của món quà không chỉ nằm ở vật thể. Một lớp ký ức số giúp người nhận quay lại khoảnh khắc ấy nhiều lần, theo cách nhẹ nhàng.'],
        ];
        for (const [id, slug, title, category, excerpt, body] of seedPosts) {
          await pool.query(
            'INSERT INTO posts (id, slug, title, category, excerpt, body) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
            [id, slug, title, category, excerpt, body]
          );
        }
      }
    });
  }
  return schemaReady;
}
