# framie — Full-stack NFC custom frame web app

Framie is a dependency-light full-stack web app for custom NFC picture frames. It includes a public storefront, authentication, dashboard, cart, checkout, design editor, NFC content editor, public NFC pages, scan analytics, blog CMS and contact flow.

## Run local

Requirements: Node.js 18+.

```bash
npm run dev
```

Open: http://localhost:5173

No package install is required for the local demo because the server uses only Node built-ins. `npm install` is only useful for a production host if required by the platform.

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
- Three plans: Basic 99.000đ, Memory 199.000đ, Standard 299.000đ.
- Frame orientation, 6 frame colors and 4 sizes.
- Physical frame editor: image upload, text, stickers, drag, resize, rotate, crop, zoom, font and layer order.
- First uploaded image automatically becomes a full-frame background layer.
- NFC editor: ảnh, video, âm thanh, ghi âm, Spotify, văn bản, sticker; kéo thả, đổi vị trí X/Y, zoom, crop, xoay, đổi rộng/cao và layer order.
- Real microphone recording through `MediaRecorder` + server upload.
- File uploads persisted in local `storage/` and served by the Node backend.
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

The local server uses a JSON database at `data/db.json` and local file storage at `storage/`. This keeps the demo easy to run without Docker or external services.

For production, replace the JSON repository and file storage with PostgreSQL/Supabase/another persistent database + object storage. Replace the demo auth token with a production auth provider or a hardened JWT/session implementation.

## Separate frontend + backend deployment

`public/config.js` contains:

```js
window.FRAME_API = '/api';
```

For a static Netlify frontend with a separate Node backend, change it to your API origin, for example:

```js
window.FRAME_API = 'https://your-backend.example.com/api';
```

`netlify.toml` is included for SPA routing. `render.yaml` is included as a starting point for a Node deployment.

## Important production notes

The app is functional as a prototype/full-stack local demo. Real payment gateways, Google OAuth credentials, production media optimization, email delivery, database migrations, rate limiting, CSRF protection, secure session rotation, image/video transcoding and formal privacy/retention policies still need production hardening before public launch.

## vNext update
- Canva-style editor refinements: drag positioning, zoom, crop X/Y, rotation, width/height, centering and layer controls.
- NFC Spotify Embed support: paste an `open.spotify.com` track/album/playlist/episode URL; the saved Embed is rendered in Custom NFC, Preview, Dashboard review and the public NFC page.
- NFC phone previews use a much longer internal scroll canvas for Custom / Preview / Dashboard / Public NFC.
- Responsive refinements for desktop/tablet/mobile, including a mobile-first public NFC page.
- Primary action buttons use `#CD747A`.
- About Framie page redesigned with brand story, mission/vision and core values.

Spotify playback is provided through Spotify's official Embed player. Playback starts from user interaction and can be subject to browser/Spotify playback policies. See Spotify's official Embed documentation.
