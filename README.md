# framie — Full-stack NFC custom frame web app

Framie is a full-stack web app for custom NFC picture frames. It includes a public storefront, authentication, dashboard, cart, checkout, design editor, NFC content editor, public NFC pages, scan analytics, blog CMS and contact flow.

Data lives in Postgres (Supabase) and uploaded photos/videos/audio are stored in Supabase Storage — both work locally and on Vercel (see **Backend** below).

## Run local

Requirements: Node.js 20+, a Postgres database.

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (Supabase → Project Settings → Database → Connection string, transaction pooler / port 6543). Everything else is optional for local dev.
3. `npm run dev`

Open: http://localhost:5173

The first request after starting the server (or after a fresh serverless cold start on Vercel) takes a couple of seconds while it connects to Postgres and creates tables if they don't exist yet — this is normal, not a bug.

## Main routes

- `/` — Home
- `#/about` — Về Framie
- `#/blog` and `#/blog/:slug` — Blog
- `#/shop` — Cửa hàng
- `#/setup` — Trạm thiết lập, 5 bước hiển thị (chính sách bảo mật là lớp xác nhận giữa Chọn khung và Thiết kế vật lý)
- `#/cart` — Giỏ hàng
- `#/checkout` — Checkout
- `#/dashboard` — Dashboard
- `#/login`, `#/register`, `#/forgot` — Authentication
- `#/contact` — Contact + Google Maps
- `#/policy` — Chính sách
- `#/m/:designId` — Public NFC landing page

## Implemented

- Premium / minimal / warm / emotional Framie UI based on the supplied reference.
- Exact supplied Framie logo asset.
- Couple-focused brand positioning, value proposition, mission, vision and core values.
- Supplied couple photos integrated into Home / About / Shop demo visuals.
- Responsive desktop / tablet / mobile layouts.
- Three plans: Basic 149.000đ, Memory 249.000đ, Standard 349.000đ.
- Frame orientation, 6 frame colors and 4 sizes.
- Physical frame editor: image upload, text, stickers, drag, resize, rotate, crop, zoom, font and layer order.
- First uploaded image automatically becomes a full-frame background layer.
- NFC editor: ảnh, video, âm thanh, ghi âm, Spotify, văn bản, sticker; kéo thả, đổi vị trí X/Y, zoom, crop, xoay, đổi rộng/cao và layer order.
- Real microphone recording through `MediaRecorder` + server upload.
- File uploads persisted in Supabase Storage (local `storage/` folder as a local-dev fallback).
- Privacy gate before content editing.
- Final review mirrors the custom frame and NFC preview.
- Cart with quantity controls, coupon codes and shipping estimate.
- Checkout with COD / bank transfer architecture and persistent orders.
- Dashboard with designs, order history, account profile/password and NFC scan counts.
- Public NFC route hỗ trợ khóa bằng mật khẩu do khách hàng đặt; mật khẩu được băm trước khi lưu, có thể đổi/tắt trong Dashboard. Khi mở trang NFC, người nhận phải nhập đúng mật khẩu để xem nội dung; lượt quét được ghi nhận sau khi truy cập.
- Blog list/search/detail and dashboard post creation.
- Contact form and Google Maps embed for 279 Nguyễn Tri Phương, Phường Diên Hồng, TP. Hồ Chí Minh; Plus Code 7P28QM69+C9.
- Google sign-in entry point ready for OAuth credentials.

## Demo coupon codes

- `FRAMIE10` — 10%
- `MEMORY20` — 20%
- `WELCOME50` — 50%

## Backend

All data (users, designs, orders, scans, blog posts, contact messages) lives in Postgres, accessed through `lib/db.js` / `lib/api.js`. Uploaded photos/videos/audio go to **Supabase Storage** when configured (required on Vercel, since serverless functions cannot write to local disk); without Storage env vars, uploads fall back to the local `storage/` folder for local dev only.

Two entry points share the same `lib/api.js` request handler:
- `server.js` — a plain Node server for local dev (`npm run dev`), also serves the static frontend and (in local-storage fallback mode) `/storage/*`.
- `api/[...path].js` — a Vercel serverless function that Vercel routes every `/api/*` request to.

### Env vars

See `.env.example`. Required:
- `DATABASE_URL` — Supabase Postgres connection string (transaction pooler, port 6543).
- `JWT_SECRET`, `NFC_ENCRYPTION_SECRET` — any long random strings in production.

Required only for Vercel (uploads need somewhere writable to go):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API. Use the **service role** key, not `anon`, since uploads happen server-side and must bypass Storage RLS policies.
- `SUPABASE_STORAGE_BUCKET` — a **public** bucket (default name `framie-uploads`), created once in Supabase → Storage.

## Deploying to Vercel

1. Create the Supabase Storage bucket above (Storage → New bucket → public).
2. `vercel link` this project, then set the env vars above in the Vercel dashboard (Project → Settings → Environment Variables) for Production (and Preview, if used).
3. `vercel.json` sets `outputDirectory: "public"` so the static frontend is served from `/`, while anything under `api/` is auto-detected as serverless functions — no other config is needed.
4. Deploy (`vercel --prod` or push to the connected Git branch).

## Other deployment targets

`public/config.js` contains `window.FRAME_API = '/api'`. For a separate frontend/backend split (e.g. a static host in front of a Node server elsewhere), change it to your API origin, e.g. `window.FRAME_API = 'https://your-backend.example.com/api'`. `netlify.toml` is included for SPA routing if you go that route; `server.js` can also run as a normal long-lived Node process on any host that supports one (Render, Railway, a VPS, …) — same `lib/api.js`, same Postgres/Storage setup as above.

## Important production notes

The app now runs on real, persistent infrastructure (Postgres + Supabase Storage) suitable for Vercel, but is still a prototype in a few ways: passwords are hashed with SHA-256 rather than bcrypt/argon2, auth tokens are a hand-rolled signed payload rather than a vetted JWT library, and there's no rate limiting, CSRF protection, formal DB migration tooling, or email delivery. Real payment gateways, Google OAuth credentials, production media optimization/transcoding and formal privacy/retention policies also still need work before public launch.

## vNext update
- Canva-style editor refinements: drag positioning, zoom, crop X/Y, rotation, width/height, centering and layer controls.
- NFC Spotify Embed support: paste an `open.spotify.com` track/album/playlist/episode URL; the saved Embed is rendered in Custom NFC, Preview, Dashboard review and the public NFC page.
- NFC phone previews use a much longer internal scroll canvas for Custom / Preview / Dashboard / Public NFC.
- Responsive refinements for desktop/tablet/mobile, including a mobile-first public NFC page.
- Primary action buttons use `#CD747A`.
- About Framie page redesigned with brand story, mission/vision and core values.

Spotify playback is provided through Spotify's official Embed player. Playback starts from user interaction and can be subject to browser/Spotify playback policies. See Spotify's official Embed documentation.
