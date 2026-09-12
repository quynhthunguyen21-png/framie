# Feedback Website Framie — Tổng hợp yêu cầu sửa & Flow triển khai

> Tổng hợp từ file `Feedback website Framie.docx`. Danh sách bên dưới bám sát đúng nội dung yêu cầu trong file gốc, không bổ sung thêm yêu cầu ngoài phạm vi đã nêu.

---

## A. Tổng hợp yêu cầu sửa đổi (theo từng mục)

### 1. Giao diện tổng thể
- [ ] Logo: chữ to hơn + mềm mại hơn.
- [ ] Thanh điều hướng trên cùng (Trang chủ, Về Framie, Blog...): chữ to hơn.
- [ ] Giãn khoảng cách giữa các dòng chữ.
- [ ] Tối ưu bố cục hiển thị, giảm việc user phải lướt lên xuống quá nhiều (áp dụng đặc biệt cho Cửa hàng và Setup Station: chọn khung, thiết kế vật lý, thiết kế NFC, bảo mật, preview...).
- [ ] Thêm hiệu ứng khi scroll: nội dung/hình ảnh xuất hiện dần theo thao tác lướt.
- [ ] Đổi màu chữ nội dung (ví dụ "FRAMIE dành cho những cặp đôi...") và các text khác sang màu **#893b3f** (đậm hơn).
- [ ] Phóng to các nút CTA và cỡ chữ trong nút.
- [ ] Bỏ dấu "." ở các heading.
- [ ] Fix lỗi heading trang Blog và Cửa hàng bị chồng chữ lên nhau.
- [ ] Điều chỉnh heading để các từ như "thương", "quà" không bị nhảy xuống dòng khác (áp dụng cho các heading khác tương tự).

### 2. Navbar
- [ ] Kéo gần khoảng cách giữa logo Framie và dòng chữ "chạm để kết nối".

### 3. Trang chủ
- [ ] Thêm hình ảnh sản phẩm Framie (Hình 1): đổi nội dung text lớn thành *"FRAMIE là món quà nơi những điều hữu hình và những kỷ niệm số hóa cùng nhau lưu giữ trọn vẹn lời yêu thương. Từ một khung hình có thể chạm đến những hình ảnh, lời nhắn và âm thanh chỉ thuộc về hai người."*; đổi màu text; tăng cỡ nút và text trên nút.
- [ ] Section "Một khung ảnh — Cả một thế giới riêng": thay 2 hình ảnh hiện tại bằng 2 hình ảnh sản phẩm khác (Hình 2, Hình 3).
- [ ] Section "Biến lời yêu thương thành một món quà": thay hình ảnh bằng 1 hình ảnh sản phẩm khác (Hình 4).
- [ ] Fix hình ảnh điện thoại trên bản mobile bị méo tỷ lệ — giữ đúng tỷ lệ điện thoại và các thành phần bên trong.

### 4. Về Framie
- [ ] Chỉnh sửa lại toàn bộ bố cục và giao diện trang theo hình mẫu đính kèm trong file gốc.

### 5. Blog
**Trang danh sách Blog:**
- [ ] Chia layout blog thành **4 columns** để tối ưu không gian hiển thị.
- [ ] Thêm hình ảnh cho các blog (tạm dùng lần lượt Hình 8 → Hình 9 → Hình 10 → Hình 11 → Hình 12).

**Trang chi tiết Blog:**
- [ ] Không để trống quá nhiều khoảng trắng hai bên.
- [ ] Tiêu đề bài viết nhỏ lại.
- [ ] Phần background của tiêu đề có thể dùng hình ảnh.
- [ ] Bên dưới tiêu đề hiển thị: ngày đăng, người đăng, số phút đọc, nút chia sẻ.
- [ ] Bố cục 2 cột: **2/3 bên trái** là nội dung bài blog, **1/3 bên phải** là danh mục bài viết liên quan (kèm hình ảnh).

### 6. Kho Template (thuộc trang Cửa hàng, dưới danh mục sản phẩm)
- [ ] Thêm **Kho Template mẫu** chia theo chủ đề (dạng thẻ template).
- [ ] Thêm **bộ lọc** theo chủ đề.
- [ ] Các element trong template tùy chỉnh được: thay ảnh, bỏ ảnh...; hỗ trợ kéo ảnh thả vào khung để tự động thay thế/khớp khung (tương tự Canva).

**Flow của Kho Template:**
```
Cửa hàng → Kho Template → Chọn chủ đề → Chọn template → Chính sách bảo mật
→ Thiết kế vật lý → Custom NFC → Bảo mật → Preview → Đặt hàng
```

### 7. Cửa hàng
- [ ] Rút ngắn chiều dài các gói sản phẩm để user thấy full hình ảnh + thông tin gói mà không cần lướt nhiều.
- [ ] Thay 3 hình ảnh trên 3 gói bằng Hình 5, Hình 6, Hình 7.

### 8. Trạm thiết lập (Setup Station)
- [ ] Tối ưu không gian hiển thị ở các bước: Chọn khung, Thiết kế vật lý, Thiết kế NFC, Bảo mật, Preview, và các bước liên quan — hạn chế việc lướt lên xuống nhiều.
- [ ] Sidebar: fix cứng vị trí; nội dung trong sidebar dồn lên phía trên; giảm khoảng cách giữa các thành phần (tránh cảm giác thưa) — theo hình mẫu đã fix trong file gốc, gồm cả việc để chữ "thành framie" trên heading nằm cùng 1 dòng.

### 9. Editor (Thiết kế vật lý + Thiết kế NFC)
**Thêm bộ editor chuyên sâu kiểu Canva cho cả 2 bước:**
- [ ] In đậm.
- [ ] In nghiêng.
- [ ] Căn giữa / trái / phải.
- [ ] Đổi màu chữ.
- [ ] Background cho chữ.
- [ ] Kéo thả element.
- [ ] Tương tác trực tiếp với element.
- [ ] Resize trực tiếp bằng các điểm ở góc/cạnh (không chỉ điều chỉnh qua nút bên cạnh).
- [ ] Thêm nút "return" (hoàn tác) khi chỉnh sửa ảnh, biểu tượng, element...

**Sticker:**
- [ ] Thêm nhiều sticker hơn (theo file đính kèm).
- [ ] Cho phép khách hàng tự tải hình ảnh lên để tạo sticker riêng.

### 10. Khung sản phẩm
**Thêm hình dạng khung (bổ sung vào khu vực khung đứng/khung ngang):**
- [ ] Khung vuông.
- [ ] Khung trái tim.

**Thêm màu/pattern (bổ sung các mẫu):**
- [ ] Trắng + nhiều trái tim màu đỏ.
- [ ] Trắng + nhiều trái tim màu hồng.
- [ ] Đen + nhiều trái tim màu đỏ.

### 11. Custom NFC
**Upload hình ảnh:**
- [ ] Fix live preview đang có độ trễ → cần hiển thị ngay sau khi upload.

**Mockup điện thoại:**
- [ ] Bỏ phần notch thừa, chỉ giữ lại **Dynamic Island**.
- [ ] Dời logo xuống một chút (đang bị Dynamic Island che).
- [ ] 2 dòng chữ mặc định **"Gửi một điều thật đẹp"** và **"Một kỷ niệm có thể chạm vào"** phải luôn nằm **dưới khung màu hồng**.

**Thêm nội dung:**
- [ ] Fix lỗi: khi roll xuống dưới điện thoại không thể thêm hình ảnh/âm thanh.
- [ ] Kéo dài trang trên điện thoại để thêm nhiều thành phần hơn: hình ảnh, âm thanh, video, text, sticker...

**Ghi âm:**
- [ ] Fix chức năng ghi âm đang lỗi (không thu âm và nghe lại đúng được).

**Tách audio từ video:**
- [ ] Thêm tính năng tách âm thanh từ video ở phần chọn audio của thiết kế NFC.

### 12. Preview
- [ ] Fix hình ảnh điện thoại bị thừa notch → chỉ giữ Dynamic Island.
- [ ] Dời logo (đang bị Dynamic Island che).
- [ ] Fix lỗi tỷ lệ nội dung NFC.
- [ ] Fix khoảng cách giữa các thành phần ở Preview đang gần nhau hơn so với bước Custom.
- [ ] **Yêu cầu bắt buộc:** Preview phải hiển thị y hệt bước Custom trước đó, bao gồm: vị trí, kích thước, khoảng cách, tỷ lệ, nội dung, hình ảnh, các element đã custom.

### 13. Dashboard
- [ ] Fix lỗi khi xem lại NFC: điện thoại vẫn còn thừa notch → chỉ giữ Dynamic Island.
- [ ] Dời logo (vẫn bị Dynamic Island che).
- [ ] **Yêu cầu bắt buộc:** Nếu khách hàng chỉnh sửa NFC trong phạm vi gói đã mua thì **không yêu cầu thanh toán lại** (hiện tại vẫn đang yêu cầu thanh toán lại).

### 14. NFC Landing Page
- [ ] Trang đích chỉ hiển thị nội dung khách hàng đã custom.
- [ ] Bỏ: thanh điều hướng Framie, chân trang Framie, các nội dung marketing khác.
- [ ] Có thể thêm hiệu ứng khi scroll (lướt tới đâu, hình ảnh/nội dung xuất hiện tới đó).
- [ ] Thêm CTA ở cuối trang, ví dụ: **"Cùng Framie kể câu chuyện của bạn"**, **"Lưu giữ thêm những kỷ niệm"**.

### 15. Chính sách bảo mật
- [ ] Kéo 2 checkbox gần nhau hơn (hiện khoảng cách đang hơi xa) để bố cục gọn hơn.

### 16. Google
- [ ] Bổ sung đăng nhập nhanh bằng Google.
- [ ] Hoàn thiện phần khai báo Google (Google OAuth/consent).

### 17. Lỗi chuyển trang
- [ ] Fix lỗi: khi đang ở cuối trang A rồi chuyển sang trang B, trang B vẫn hiển thị ở vị trí phía dưới thay vì từ đầu trang.

### 18. Trang liên hệ
- [ ] Đổi màu chữ câu **"nghe câu chuyện của bạn."** sang **màu hồng Framie**.

---

## B. Flow sửa đề xuất (thứ tự triển khai)

Flow được nhóm theo mức độ ưu tiên: **fix lỗi chặn (bug) → chuẩn hóa UI nền tảng → từng trang → tính năng mới → QA**. Thứ tự này giúp các phase sau kế thừa được kết quả của phase trước (ví dụ: chuẩn hóa heading/màu chữ trước khi chỉnh từng trang cụ thể).

### Phase 1 — Fix bug chặn (ưu tiên cao nhất)
1. Heading trang Blog & Cửa hàng bị chồng chữ (mục 1).
2. Hình ảnh điện thoại trang chủ bị méo tỷ lệ trên mobile (mục 3).
3. Mockup điện thoại bị thừa notch + logo bị che — áp dụng đồng bộ 3 nơi: Custom NFC, Preview, Dashboard (mục 11, 12, 13).
4. Live preview khi upload ảnh ở Custom NFC bị delay (mục 11).
5. Chức năng ghi âm bị lỗi (mục 11).
6. Preview không khớp với bước Custom về vị trí/kích thước/khoảng cách/tỷ lệ/nội dung (mục 12).
7. Yêu cầu thanh toán lại khi chỉnh sửa NFC trong phạm vi gói đã mua (mục 13).
8. Chuyển trang không cuộn về đầu trang (mục 17).
9. Lỗi khi roll xuống dưới điện thoại không thêm được ảnh/âm thanh (mục 11).

### Phase 2 — Chuẩn hóa UI/UX nền tảng (design system)
1. Logo: to hơn + mềm mại hơn.
2. Thanh điều hướng: chữ to hơn; kéo gần logo và "chạm để kết nối" (mục 1, 2).
3. Giãn khoảng cách dòng chữ toàn site.
4. Chuẩn màu chữ nội dung: #893b3f.
5. Phóng to nút CTA + chữ trong nút (áp dụng toàn site).
6. Bỏ dấu "." ở heading; fix heading không bị xuống dòng giữa từ.
7. Thêm hiệu ứng scroll-reveal (áp dụng chung, dùng lại cho NFC Landing Page ở Phase 6).

### Phase 3 — Tối ưu bố cục các trang nhiều nội dung
1. Cửa hàng: rút ngắn chiều dài gói sản phẩm, thay hình Hình 5–7 (mục 7).
2. Trạm thiết lập: tối ưu không gian các bước (chọn khung, thiết kế vật lý, NFC, bảo mật, preview); sidebar fix cứng, nội dung dồn lên trên, giảm khoảng cách (mục 8).

### Phase 4 — Trang chủ & Về Framie
1. Trang chủ: thêm/thay hình theo Hình 1–4, đổi nội dung text, màu text, tăng cỡ nút/text (mục 3).
2. Về Framie: redesign theo bố cục hình mẫu (mục 4).

### Phase 5 — Blog
1. Trang danh sách: chia 4 columns, thêm ảnh minh họa Hình 8–12.
2. Trang chi tiết: giảm khoảng trắng 2 bên, thu nhỏ tiêu đề + background ảnh, thêm ngày đăng/người đăng/thời gian đọc/nút chia sẻ, bố cục 2/3 – 1/3.

### Phase 6 — Custom NFC & Preview (hoàn thiện tính năng)
1. Mockup: 2 dòng text mặc định luôn nằm dưới khung hồng.
2. Kéo dài trang mobile để thêm nhiều thành phần (ảnh, âm thanh, video, text, sticker).
3. Thêm tính năng tách audio từ video.
4. Đồng bộ lại Preview theo đúng yêu cầu ở Phase 1 sau khi các thay đổi UI của Custom NFC hoàn tất.

### Phase 7 — Editor nâng cao
1. Toolbar: in đậm, in nghiêng, căn lề, đổi màu chữ, background chữ.
2. Kéo thả + resize trực tiếp bằng điểm góc/cạnh.
3. Nút return khi chỉnh sửa ảnh/icon/element.
4. Sticker: thêm sticker theo file đính kèm + cho phép khách tự upload ảnh làm sticker.

### Phase 8 — Khung sản phẩm
1. Thêm khung vuông, khung trái tim.
2. Thêm 3 pattern: trắng + tim đỏ, trắng + tim hồng, đen + tim đỏ.

### Phase 9 — Kho Template (tính năng mới)
1. Xây kho template theo chủ đề + bộ lọc.
2. Element tùy chỉnh được (thay/xóa ảnh, kéo-thả auto-fit khung kiểu Canva).
3. Nối flow: Cửa hàng → Kho Template → Chọn chủ đề → Chọn template → Chính sách bảo mật → Thiết kế vật lý → Custom NFC → Bảo mật → Preview → Đặt hàng.

### Phase 10 — Các trang/tính năng phụ
1. NFC Landing Page: bỏ nav/footer/marketing Framie, chỉ giữ nội dung custom; thêm scroll effect; thêm CTA cuối trang.
2. Chính sách bảo mật: kéo gần 2 checkbox.
3. Google: thêm đăng nhập nhanh + hoàn thiện khai báo Google.
4. Trang liên hệ: đổi màu câu "nghe câu chuyện của bạn." sang màu hồng Framie.

### Phase 11 — QA tổng thể
1. Kiểm tra Preview khớp 100% với Custom (vị trí, kích thước, khoảng cách, tỷ lệ, nội dung, hình ảnh, element).
2. Kiểm tra đồng bộ mockup điện thoại (notch/Dynamic Island/logo) ở cả 3 nơi: Custom NFC, Preview, Dashboard.
3. Test flow Kho Template từ đầu đến Đặt hàng.
4. Test không bị yêu cầu thanh toán lại khi sửa NFC trong phạm vi gói đã mua.
5. Test responsive/tỷ lệ hình ảnh trên mobile toàn site.
6. Test chuyển trang luôn cuộn về đầu.
7. Rà lại toàn bộ heading (không dấu ".", không chồng chữ, không xuống dòng sai vị trí).