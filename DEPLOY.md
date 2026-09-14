# Hướng dẫn Deploy Framie lên Vercel + gắn Domain riêng

Tài liệu này ghi lại **chi tiết từng bước** để build và vận hành dự án Framie trên hạ tầng thật:
Vercel (hosting + serverless API) + Supabase (Postgres + Storage) + Google OAuth (đăng nhập Google) + domain riêng.

Đọc theo đúng thứ tự từ trên xuống — các bước sau phụ thuộc vào giá trị lấy được ở bước trước (connection string, key, redirect URI...).

---

## 0. Kiến trúc tóm tắt (để hiểu vì sao phải làm các bước dưới)

- **Frontend**: `public/` là site tĩnh (HTML/CSS/JS thuần, không build step). Vercel serve trực tiếp thư mục này.
- **Backend API**: toàn bộ logic nằm trong `lib/api.js`, được gọi từ **2 entry point khác nhau** nhưng dùng chung code:
  - `server.js` — chạy khi dev local (`npm run dev`), lắng nghe cổng `PORT` (mặc định 5173).
  - `api/[...path].js` — Vercel tự nhận diện đây là 1 **serverless function**, và theo cấu hình trong `vercel.json`, mọi request `/api/*` sẽ được route vào file này.
- **Database**: Postgres, dùng Supabase làm nơi host (qua `lib/db.js`, đọc biến `DATABASE_URL`). Bảng được tự tạo (`CREATE TABLE IF NOT EXISTS...`) ở lần gọi API đầu tiên — **không cần chạy migration tay**.
- **File upload** (ảnh/video/audio người dùng tải lên): Vercel serverless function **không có ổ đĩa ghi được**, nên bắt buộc phải dùng **Supabase Storage** khi chạy production (`lib/storage.js`). Khi chạy local mà chưa cấu hình Supabase Storage, code tự fallback lưu vào thư mục `storage/` trên máy — chỉ dùng được cho dev, không dùng được trên Vercel.
- **Đăng nhập Google**: `lib/api.js` có 2 route `/api/auth/google/start` và `/api/auth/google/callback`. Redirect URI gửi cho Google được **tự động tính theo domain đang gọi request** (xem hàm `getOrigin()` trong `lib/api.js`, đọc header `x-forwarded-proto` / `x-forwarded-host` mà Vercel gắn vào mỗi request). Điều này có nghĩa là: **domain nào gọi vào app, domain đó phải được khai báo sẵn trong Google Cloud Console** ở mục Authorized redirect URIs — nếu không sẽ bị lỗi `redirect_uri_mismatch`. Chi tiết ở Bước 4 và Bước 7.

Vì vậy thứ tự làm hợp lý nhất là: **Supabase trước → biến môi trường → deploy Vercel → gắn domain → quay lại cập nhật Google OAuth theo domain thật cuối cùng.**

---

## 1. Chuẩn bị tài khoản

Cần có sẵn:

- Tài khoản [GitHub](https://github.com) — repo code đã kết nối sẵn: `https://github.com/quynhthunguyen21-png/framie` (remote `origin` hiện tại của project).
- Tài khoản [Vercel](https://vercel.com) — nên **đăng nhập bằng GitHub** để Vercel tự có quyền đọc repo.
- Tài khoản [Supabase](https://supabase.com).
- Tài khoản [Google Cloud Console](https://console.cloud.google.com) (dùng email Google bất kỳ) — chỉ cần nếu muốn bật nút "Đăng nhập với Google".
- Quyền quản trị DNS của domain định gắn (đăng nhập được vào nơi mua domain: Mắt Bão, PA Vietnam, Nhân Hòa, iNET, GoDaddy, Namecheap, Cloudflare...).
- Node.js 20+ cài trên máy nếu muốn test local trước khi deploy (`node -v` để kiểm tra).
- (Tuỳ chọn) Vercel CLI nếu muốn deploy bằng dòng lệnh thay vì dashboard: `npm i -g vercel`.

---

## 2. Thiết lập Supabase (Database + Storage)

### 2.1. Tạo project

1. Vào [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Chọn Organization, đặt tên project (vd `framie`), đặt **Database Password** — **lưu lại mật khẩu này**, sẽ cần ghép vào connection string ở bước sau.
3. Chọn Region gần người dùng nhất (project hiện tại của Framie đang chạy ở `ap-southeast-2` — Sydney, khu vực gần Việt Nam nhất mà Supabase hỗ trợ).
4. Bấm **Create new project**, đợi 1-2 phút để Supabase khởi tạo hạ tầng.

### 2.2. Lấy connection string (DATABASE_URL)

1. Vào project vừa tạo → **Project Settings** (icon bánh răng) → **Database**.
2. Kéo tới mục **Connection string** → chọn tab **Transaction** (pooler, cổng `6543`) — đây là connection string dùng cho `DATABASE_URL`. **Bắt buộc dùng pooler**, không dùng connection trực tiếp port `5432` cho `DATABASE_URL`, vì serverless function trên Vercel có thể chạy hàng chục instance cùng lúc, mỗi instance mở tối đa 5 connection (`lib/db.js` đặt `max: 5`) — nếu không qua pooler sẽ nhanh chóng vượt giới hạn connection của Postgres và app sẽ báo lỗi kết nối.
3. Copy chuỗi, thay `[YOUR-PASSWORD]` bằng mật khẩu DB đã đặt ở bước 2.1. Dạng chuỗi sẽ giống:

   ```
   postgresql://postgres.<project-ref>:<mật-khẩu>@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

   (Ví dụ project ref đang dùng trong `.env.example` của repo này là `ukkvqxbsznognohbvija` — mỗi project Supabase sẽ có ref khác nhau, lấy đúng ref của project bạn vừa tạo.)

4. (Tuỳ chọn) Copy thêm bản **Session** pooler (cổng `5432`) để dùng làm `DIRECT_URL` — biến này hiện **không được app dùng tới**, chỉ để dành nếu sau này thêm công cụ migration cần connection không qua pooler. Có thể bỏ trống.

### 2.3. Tạo Storage bucket cho ảnh/video/audio upload

1. Vào **Storage** (menu bên trái) → **New bucket**.
2. Đặt tên bucket **chính xác là** `framie-uploads` (hoặc tên khác, nhưng nếu đổi tên thì phải set biến `SUPABASE_STORAGE_BUCKET` tương ứng — xem Bước 3).
3. Bật **Public bucket** = ON. Bucket **bắt buộc phải public** vì app trả thẳng URL public của Supabase Storage cho trình duyệt hiển thị ảnh/video/audio (xem `lib/storage.js`, hàm `saveUpload` trả về `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${file}`) — nếu để private, ảnh sẽ không hiển thị được (403).
4. Bấm **Save**.

### 2.4. Lấy các key cho Storage

Vào **Project Settings → API**:

- **Project URL** → dùng cho biến `SUPABASE_URL` (dạng `https://<project-ref>.supabase.co`).
- **service_role key** (mục *Project API keys*, **không phải** `anon` `public` key) → dùng cho biến `SUPABASE_SERVICE_ROLE_KEY`. Bắt buộc dùng service role vì upload diễn ra ở phía server và cần bỏ qua Storage RLS policies (`anon` key sẽ bị chặn quyền ghi).
- **anon public key** → dùng cho biến `SUPABASE_ANON_KEY` (hiện chưa được backend dùng trực tiếp trong flow chính, nhưng vẫn nên điền cho đủ, phòng khi dùng Supabase client ở phía khác).

> ⚠️ **service_role key có toàn quyền trên database/storage, tuyệt đối không để lộ ở phía frontend hoặc commit lên GitHub.** Nó chỉ được dùng trong biến môi trường phía server (Vercel Environment Variables), không xuất hiện trong bất kỳ file nào trong `public/`.

---

## 3. Thiết lập Google OAuth (đăng nhập Google) — phần khai báo ban đầu

> Ở bước này ta khai báo trước với Client ID/Secret + redirect URI tạm (domain `*.vercel.app`). Sau khi gắn domain riêng ở Bước 6, quay lại **Bước 7** để bổ sung domain thật vào danh sách redirect URI — thiếu bước này là nguyên nhân phổ biến nhất khiến nút "Đăng nhập Google" báo lỗi sau khi đổi sang domain riêng.

1. Vào [Google Cloud Console](https://console.cloud.google.com) → tạo project mới (hoặc chọn project có sẵn), vd đặt tên `Framie`.
2. Vào **APIs & Services → OAuth consent screen**:
   - Chọn **User type**: External (nếu app dùng cho khách hàng công khai).
   - Điền **App name** (Framie), **User support email**, **Developer contact email**.
   - Ở mục **Scopes**, không cần thêm gì đặc biệt — app chỉ xin `openid email profile` (mặc định).
   - Nếu app chưa qua Google verify, thêm các email test vào **Test users** để đăng nhập thử được ngay (khi ở chế độ "Testing"); khi sẵn sàng ra mắt thật, bấm **Publish app**.
3. Vào **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - **Application type**: Web application.
   - **Name**: Framie web.
   - **Authorized JavaScript origins**: thêm từng domain app sẽ chạy, ví dụ:
     - `https://framie.vercel.app` (domain tạm Vercel cấp)
     - `https://your-domain.com` (domain riêng — thêm ở Bước 7 khi đã có)
   - **Authorized redirect URIs**: thêm **chính xác** đường dẫn callback, có đủ `/api/auth/google/callback`, ví dụ:
     - `https://framie.vercel.app/api/auth/google/callback`
     - `https://your-domain.com/api/auth/google/callback`
   - Bấm **Create**. Google sẽ hiện **Client ID** và **Client secret** — copy lại, dùng cho biến `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`.

> Ghi chú: chỉ cần **1 OAuth client** duy nhất, khai báo **nhiều redirect URI** (mỗi domain 1 dòng) trong cùng client đó — không cần tạo nhiều client.

---

## 4. Chuẩn bị biến môi trường (Environment Variables)

Toàn bộ biến cần thiết đã liệt kê mẫu trong file [`.env.example`](.env.example) của repo. Copy file này thành `.env` để chạy local, và điền **đúng các giá trị thật** giống hệt vào **Vercel → Project Settings → Environment Variables** khi deploy production.

| Biến | Bắt buộc | Lấy ở đâu | Ghi chú |
|---|---|---|---|
| `PORT` | Chỉ cần khi chạy local | — | Mặc định `5173`, Vercel tự quản lý cổng nên **không cần set trên Vercel**. |
| `JWT_SECRET` | ✅ | Tự tạo | Chuỗi ngẫu nhiên dài, dùng để ký token đăng nhập. Tạo bằng lệnh `openssl rand -hex 32` (hoặc bất kỳ công cụ sinh chuỗi random nào). |
| `DATABASE_URL` | ✅ | Supabase → Project Settings → Database → Connection string (**Transaction pooler, port 6543**) | Xem Bước 2.2. |
| `DIRECT_URL` | Không bắt buộc | Supabase → Database → Connection string (Session pooler, port 5432) | App hiện không dùng, có thể bỏ trống. |
| `SUPABASE_URL` | ✅ (bắt buộc trên Vercel) | Project Settings → API → Project URL | Dạng `https://<ref>.supabase.co`. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (bắt buộc trên Vercel) | Project Settings → API → service_role key | **Giữ bí mật tuyệt đối.** |
| `SUPABASE_STORAGE_BUCKET` | ✅ (bắt buộc trên Vercel) | Tên bucket đã tạo ở Bước 2.3 | Mặc định `framie-uploads`. |
| `SUPABASE_ANON_KEY` | Khuyến nghị điền | Project Settings → API → anon public key | Điền cho đủ bộ, hiện chưa bắt buộc với flow chính. |
| `GOOGLE_CLIENT_ID` | Chỉ cần nếu bật đăng nhập Google | Google Cloud Console → Credentials | Xem Bước 3. |
| `GOOGLE_CLIENT_SECRET` | Chỉ cần nếu bật đăng nhập Google | Google Cloud Console → Credentials | Giữ bí mật. |
| `NFC_ENCRYPTION_SECRET` | ✅ | Tự tạo | Chuỗi ngẫu nhiên dài, dùng mã hoá mật khẩu bảo vệ trang NFC (AES-256-GCM trong `lib/api.js`). Tạo giống `JWT_SECRET`: `openssl rand -hex 32`. |

**Lưu ý về local dev**: nếu không có Supabase Storage (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` để trống), app tự fallback lưu file upload vào thư mục `storage/` trên máy — chỉ hoạt động khi chạy `npm run dev` local, **không hoạt động trên Vercel** (serverless không ghi được ổ đĩa) → trên Vercel bắt buộc phải điền đủ 3 biến Supabase Storage ở trên.

**`.env` không được commit lên Git** — đã có sẵn trong `.gitignore` (`.env`, `.env*`). Biến môi trường thật chỉ nhập trực tiếp vào Vercel dashboard.

---

## 5. Đẩy code lên GitHub

Nếu code đã có sẵn trên GitHub (`quynhthunguyen21-png/framie`), chỉ cần commit + push thay đổi:

```bash
git add -A
git commit -m "mô tả thay đổi"
git push origin main
```

Nếu deploy từ đầu với repo mới:

```bash
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/<tên-repo>.git
git push -u origin main
```

---

## 6. Deploy lên Vercel

### Cách A — Qua Vercel Dashboard (khuyến nghị, dễ nhất)

1. Vào [vercel.com/new](https://vercel.com/new), đăng nhập bằng GitHub.
2. Bấm **Import** repo `framie` (nếu chưa thấy repo, bấm **Adjust GitHub App Permissions** để cấp quyền Vercel đọc repo đó).
3. Ở màn hình cấu hình project:
   - **Framework Preset**: chọn **Other** (project này không dùng framework build nào, `vercel.json` đã tự khai báo builds/routes).
   - **Root Directory**: để mặc định (thư mục gốc repo, nơi có `vercel.json`).
   - **Build Command / Output Directory**: để trống, không cần chỉnh — `vercel.json` đã quy định rõ `public/**` build bằng `@vercel/static` và `api/[...path].js` build bằng `@vercel/node`.
4. Mở rộng mục **Environment Variables**, thêm **toàn bộ** các biến ở Bảng Bước 4 (trừ `PORT`, `DIRECT_URL` có thể bỏ qua). Chọn áp dụng cho cả **Production**, **Preview** và **Development** (hoặc ít nhất Production) để mọi loại deploy đều chạy được.
5. Bấm **Deploy**. Vercel build và cấp ngay 1 domain dạng `https://framie-xxxx.vercel.app` (hoặc `https://framie.vercel.app` nếu tên không trùng ai).
6. Sau khi deploy xong, mở domain đó, thử tải trang chủ. Request API đầu tiên sẽ **chậm vài giây** vì lúc này `ensureSchema()` trong `lib/db.js` đang tạo bảng trong Postgres lần đầu — đây là hành vi bình thường, không phải lỗi (đã ghi chú trong README).

### Cách B — Qua Vercel CLI

```bash
npm i -g vercel     # cài CLI nếu chưa có
vercel login        # đăng nhập
vercel link         # chạy trong thư mục project, liên kết với 1 project Vercel (tạo mới hoặc chọn có sẵn)
```

Set từng biến môi trường (lặp lại cho mỗi biến ở Bảng Bước 4):

```bash
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add NFC_ENCRYPTION_SECRET production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_STORAGE_BUCKET production
vercel env add SUPABASE_ANON_KEY production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
```

(CLI sẽ hỏi và dán giá trị cho từng biến. Lặp lại với môi trường `preview`/`development` nếu muốn.)

Deploy production:

```bash
vercel --prod
```

### Kiểm tra nhanh sau khi deploy

```bash
curl https://<domain-vercel-cua-ban>/api/health
# Kỳ vọng: {"ok":true,"app":"Framie","time":"..."}
```

---

## 7. Gắn Domain riêng vào Vercel

### 7.1. Thêm domain trong Vercel

1. Vào project trên Vercel → **Settings → Domains**.
2. Gõ domain muốn gắn, vd `framie.vn` (domain gốc/apex) hoặc `www.framie.vn` (subdomain) → bấm **Add**.
3. Nên thêm **cả 2**: domain gốc (`framie.vn`) và `www.framie.vn`, sau đó chọn 1 cái làm **Primary** (redirect cái còn lại về primary) — Vercel có nút gợi ý việc này ngay trong UI.
4. Vercel sẽ hiện ra các bản ghi DNS cần khai báo, tuỳ loại domain:
   - Nếu gắn **domain gốc** (`framie.vn`, không có `www`): Vercel yêu cầu 1 bản ghi
     ```
     Loại: A
     Host: @ (hoặc để trống, tuỳ nhà cung cấp)
     Giá trị: 76.76.21.21
     ```
   - Nếu gắn **subdomain** (`www.framie.vn`, hoặc bất kỳ subdomain nào khác như `app.framie.vn`): Vercel yêu cầu 1 bản ghi
     ```
     Loại: CNAME
     Host: www (hoặc tên subdomain tương ứng)
     Giá trị: cname.vercel-dns.com
     ```
   > Vercel luôn hiển thị đúng giá trị cần dùng ngay trong màn hình **Domains** của project (giá trị IP/CNAME có thể được Vercel cập nhật theo thời gian) — **luôn ưu tiên làm theo đúng giá trị Vercel hiển thị tại thời điểm gắn domain**, bảng trên chỉ là ví dụ tham khảo phổ biến nhất.

### 7.2. Trỏ DNS tại nơi quản lý domain

Đăng nhập vào trang quản trị DNS của domain (tuỳ nhà cung cấp, thường gọi là "Quản lý DNS" / "DNS Zone" / "DNS Management"):

- **Nếu domain mua ở nhà cung cấp Việt Nam** (Mắt Bão, PA Vietnam, Nhân Hòa, iNET...): vào mục **Quản lý DNS** của domain, thêm bản ghi loại **A** (cho domain gốc) hoặc **CNAME** (cho `www`/subdomain) đúng như Vercel yêu cầu ở 7.1. Nếu nhà cung cấp không cho thêm CNAME ở domain gốc (`@`), dùng loại bản ghi **ALIAS** hoặc **ANAME** nếu có hỗ trợ, hoặc dùng bản ghi A với IP Vercel đưa ra.
- **Nếu domain mua ở GoDaddy / Namecheap / Cloudflare...**: vào **DNS settings** của domain, thêm Record tương tự — riêng **Cloudflare**: sau khi thêm A/CNAME, tạm thời tắt **Proxy status** (chuyển icon đám mây màu cam sang **DNS only** — biểu tượng xám) để Vercel tự cấp chứng chỉ SSL cho domain thành công, tránh xung đột proxy 2 lớp. Có thể bật lại Proxy (Cloudflare CDN) sau khi domain đã verify SSL xong trên Vercel, nếu vẫn muốn dùng Cloudflare CDN/WAF phía trước.
- **Xoá/không để tồn tại các bản ghi A/CNAME cũ trỏ tới nơi khác** ở cùng Host (`@` hoặc `www`) — domain chỉ trỏ đúng 1 nơi tại 1 thời điểm, để lẫn nhiều bản ghi cùng loại/cùng host sẽ gây lỗi hoặc chạy chờn (load sai đích ngẫu nhiên).

### 7.3. Chờ DNS lan truyền & xác minh trên Vercel

- Thời gian DNS cập nhật thường 5–30 phút, có thể tới vài giờ tuỳ nhà cung cấp/TTL cũ.
- Quay lại **Vercel → Settings → Domains**: khi trạng thái domain chuyển từ *Invalid Configuration* sang **Valid Configuration** (dấu tick xanh), nghĩa là DNS đã trỏ đúng.
- Vercel **tự động cấp chứng chỉ SSL (Let's Encrypt)** cho domain sau khi DNS xác minh thành công — không cần tự mua/cài SSL. `https://` sẽ hoạt động sau vài phút.
- Kiểm tra nhanh tiến độ lan truyền DNS bằng công cụ ngoài, vd [dnschecker.org](https://dnschecker.org) — gõ domain, kiểm tra bản ghi A/CNAME đã thấy ở nhiều vị trí server DNS trên thế giới chưa.

---

## 8. Cập nhật lại các nơi phụ thuộc vào domain (bước hay bị quên)

Sau khi domain riêng đã chạy `https://` thành công, **quay lại** các chỗ sau để domain mới hoạt động đầy đủ (không chỉ là load được trang, mà cả đăng nhập Google, SEO...):

1. **Google Cloud Console → Credentials → OAuth client**:
   - Thêm vào **Authorized JavaScript origins**: `https://your-domain.com` (và `https://www.your-domain.com` nếu dùng cả 2).
   - Thêm vào **Authorized redirect URIs**: `https://your-domain.com/api/auth/google/callback` (và bản `www` nếu có).
   - **Không xoá** dòng domain `*.vercel.app` cũ nếu vẫn còn dùng để test/preview — cứ giữ cả 2, không giới hạn số dòng.
   - Lưu lại. Thử lại nút "Đăng nhập Google" trên domain mới — nếu vẫn báo `redirect_uri_mismatch`, kiểm tra kỹ đúng chuỗi domain (có/không có `www`, đúng `https`, không thừa dấu `/` cuối).

2. **`public/config.js`**: nếu vẫn deploy frontend + backend cùng 1 project Vercel (trường hợp mặc định của repo này) thì **không cần sửa gì** — `window.FRAME_API = '/api'` tự động dùng domain hiện tại. Chỉ sửa file này nếu tách riêng frontend/backend ra 2 nơi khác nhau.

3. **Supabase → Authentication → URL Configuration** (nếu sau này có dùng thêm Supabase Auth trực tiếp — hiện tại app tự làm auth riêng qua `lib/api.js`, không dùng Supabase Auth, nên bước này **không bắt buộc** với setup hiện tại, chỉ ghi chú phòng khi mở rộng).

4. Domain nào Vercel gắn là **Primary Domain**: mọi link tuyệt đối gửi cho khách (nếu sau này có gửi email link) nên dùng đúng domain Primary này để tránh redirect vòng vo.

---

## 9. Checklist kiểm tra sau khi deploy xong domain

- [ ] `https://your-domain.com` load được trang chủ, không lỗi console.
- [ ] `https://your-domain.com/api/health` trả về `{"ok":true,...}`.
- [ ] Ổ khoá SSL trên trình duyệt hiển thị hợp lệ (không cảnh báo "Not secure").
- [ ] `www.your-domain.com` (nếu có) redirect đúng về domain Primary.
- [ ] Đăng ký tài khoản mới (`/#/register`) → tạo được, xem trong Supabase → Table Editor → bảng `users` có dòng mới.
- [ ] Đăng nhập bằng Google (`/#/login`) → không bị `redirect_uri_mismatch`, đăng nhập xong quay lại đúng dashboard.
- [ ] Vào Trạm thiết lập, upload 1 ảnh ở bước Thiết kế vật lý → ảnh hiển thị ngay (không vỡ link) → vào Supabase → Storage → bucket `framie-uploads` thấy file mới.
- [ ] Ghi âm thử ở bước Custom NFC → nghe lại được.
- [ ] Đặt 1 đơn hàng test → thấy đơn trong Dashboard và trong bảng `orders` trên Supabase.
- [ ] Mở link trang NFC công khai (`/#/m/:id`) trên điện thoại thật, thử luồng xem nội dung.

---

## 10. Xử lý lỗi thường gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Trang load được nhưng gọi API nào cũng lỗi 500 | Thiếu/sai `DATABASE_URL` trên Vercel | Vào Vercel → Settings → Environment Variables kiểm tra lại đúng connection string pooler port 6543, đã Redeploy sau khi sửa biến chưa (**sửa biến môi trường không tự redeploy**, phải bấm **Redeploy** thủ công). |
| Request đầu tiên sau khi deploy/redeploy rất chậm (vài giây) | Bình thường — cold start + `ensureSchema()` tạo bảng lần đầu | Không cần xử lý, các request sau sẽ nhanh. |
| Upload ảnh báo lỗi, hoặc ảnh hiển thị link vỡ | Thiếu `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_STORAGE_BUCKET`, hoặc bucket chưa để **Public** | Kiểm tra lại 3 biến, kiểm tra bucket Storage đã bật Public bucket chưa. |
| Đăng nhập Google báo `redirect_uri_mismatch` | Domain đang chạy chưa được khai báo trong Google Cloud Console → Authorized redirect URIs | Thêm đúng `https://<domain-đang-dùng>/api/auth/google/callback` vào Credentials (xem Bước 8.1). Nhớ cả domain `www` nếu người dùng vào từ `www`. |
| Đăng nhập Google báo lỗi "access_blocked" / app chưa xác minh | OAuth consent screen còn ở chế độ **Testing** và email đang dùng không nằm trong **Test users** | Thêm email vào Test users, hoặc **Publish** app trong OAuth consent screen khi sẵn sàng public. |
| Domain add vào Vercel mãi báo "Invalid Configuration" | DNS chưa trỏ đúng, hoặc còn bản ghi cũ trỏ nơi khác, hoặc TTL cũ chưa hết hạn | Kiểm tra lại đúng bản ghi A/CNAME theo đúng giá trị Vercel yêu cầu; xoá bản ghi trùng host cũ; đợi thêm — có thể tới vài giờ. |
| Dùng Cloudflare, domain add vào Vercel mãi không verify SSL được | Cloudflare Proxy (icon cam) đang bật, chặn Vercel xác minh domain | Tắt Proxy (chuyển sang **DNS only**, icon xám) cho tới khi Vercel báo domain verified, sau đó có thể bật Proxy lại. |
| App chạy chậm dần / lỗi "too many connections" tới Postgres khi nhiều người dùng cùng lúc | Dùng nhầm connection string port `5432` (direct) thay vì pooler `6543` cho `DATABASE_URL` | Đổi lại đúng Transaction pooler port 6543 (`?pgbouncer=true`) như Bước 2.2. |
| Sau khi đổi sang domain riêng, các thiết kế/đơn hàng cũ "biến mất" | Đây **không phải lỗi mất dữ liệu** — dữ liệu vẫn nằm nguyên trong Supabase, chỉ là domain khác không liên quan gì tới database | Kiểm tra thẳng trong Supabase → Table Editor để xác nhận dữ liệu còn nguyên; đăng nhập đúng tài khoản đã tạo thiết kế đó. |

---

## 11. Ghi chú vận hành / bảo mật

- App hiện là **bản đủ dùng thật (Postgres + Supabase Storage) nhưng vẫn còn vài điểm ở mức "đủ dùng cho giai đoạn đầu"**, chưa phải chuẩn enterprise:
  - Mật khẩu người dùng hash bằng SHA-256 (không phải bcrypt/argon2).
  - Token đăng nhập là chuỗi tự ký (hand-rolled), không dùng thư viện JWT chuẩn.
  - Chưa có rate limiting, chưa có CSRF protection, chưa có migration tool chính thức, chưa gửi được email (quên mật khẩu hiện chỉ trả về thông báo chung chung, chưa thực sự gửi mail).
- Trước khi public rộng rãi / nhận thanh toán thật, nên nâng cấp các điểm trên, đồng thời tích hợp cổng thanh toán thật (hiện checkout chỉ hỗ trợ kiến trúc COD / chuyển khoản thủ công).
- **Không bao giờ** commit file `.env` hoặc dán `SUPABASE_SERVICE_ROLE_KEY` / `GOOGLE_CLIENT_SECRET` / `JWT_SECRET` vào code, issue, commit message hay chat công khai — nếu lỡ lộ, vào Supabase/Google Console **revoke (thu hồi) và tạo key mới ngay**, rồi cập nhật lại biến môi trường trên Vercel + Redeploy.
- Khi đổi bất kỳ biến môi trường nào trên Vercel, luôn nhớ bấm **Redeploy** (Deployments tab → ⋯ → Redeploy) để bản deploy mới nhất thực sự dùng giá trị mới — Vercel không tự áp dụng biến môi trường mới vào các deployment đã build sẵn.
