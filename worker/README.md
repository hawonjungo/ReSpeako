# ReSpeako Worker (phát âm + chấm viết)

Cloudflare Worker đứng giữa app và hai dịch vụ: Azure Pronunciation Assessment (chấm phát âm) và Google Gemini (chấm Summarize Written Text và Essay).

- Key Azure và key Gemini **chỉ nằm trên Worker** (secret), không bao giờ có trong code web/app.
- Chỉ request có **mã truy cập riêng của bạn** (`APP_ACCESS_TOKEN`) mới được chấm. Người khác mở trang web cũng không dùng được.
- Worker tự đếm số giây audio mỗi tháng và **dừng ở 4,5 giờ** (`MONTHLY_LIMIT_SECONDS`), dưới mức 5 giờ miễn phí của Azure.
- Chấm viết bằng AI bị giới hạn **300 lượt mỗi tháng** (`MONTHLY_WRITING_LIMIT`).
- Chỉ nhận request trình duyệt từ các origin trong `ALLOWED_ORIGINS`.

## 1. Tạo Azure Speech (gói miễn phí)

1. Vào https://portal.azure.com → **Create a resource** → tìm **Speech** → Create.
2. **Pricing tier: chọn `Free F0`**. Gói F0 tự dừng khi hết hạn mức, **không bao giờ tính tiền**.
3. Region: chọn `Southeast Asia` (gần Việt Nam). Nếu chọn region khác, sửa `AZURE_SPEECH_REGION` trong `wrangler.toml`.
4. Sau khi tạo xong: **Keys and Endpoint** → copy **KEY 1**.

## 2. Tạo Worker trên Cloudflare

Cần tài khoản Cloudflare miễn phí. Chạy trong thư mục `worker/`:

```bash
cd worker
npx wrangler login

# Tạo KV để đếm số giây đã dùng, rồi dán "id" in ra vào wrangler.toml (thay REPLACE_WITH_KV_NAMESPACE_ID)
npx wrangler kv namespace create USAGE

# Key Azure (dán KEY 1 khi được hỏi)
npx wrangler secret put AZURE_SPEECH_KEY

# Mã truy cập riêng của bạn: tạo chuỗi ngẫu nhiên dài rồi dán vào
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
npx wrangler secret put APP_ACCESS_TOKEN

npx wrangler deploy
```

`wrangler deploy` in ra địa chỉ dạng `https://respeako-pronunciation.<tên>.workers.dev`.

## 2b. Bật chấm viết bằng Gemini (miễn phí)

1. Vào https://aistudio.google.com/apikey, đăng nhập tài khoản Google, bấm **Create API key**. Gói miễn phí không cần thẻ.
2. Trong thư mục `worker/`:

```bash
npx wrangler secret put GEMINI_API_KEY
```

Không cần deploy lại: secret có hiệu lực ngay.

Lưu ý: với gói miễn phí, Google có thể dùng nội dung gửi lên (bài viết luyện tập) để cải thiện sản phẩm. Đừng viết thông tin cá nhân vào bài luyện. Gói miễn phí cũng giới hạn số lượt mỗi phút; nếu app báo "Gemini đang bận", hãy đợi khoảng một phút. Muốn đổi model, sửa `GEMINI_MODEL` trong `wrangler.toml` rồi chạy `npx wrangler deploy`.

## 3. Kết nối app

Mở ReSpeako → **⚙️ Cài đặt** → nhập địa chỉ Worker và mã truy cập → **Kiểm tra kết nối**.
Mã chỉ được lưu trong trình duyệt hoặc thiết bị đó. Làm lại bước này trên mỗi thiết bị bạn dùng.

## Lưu ý bảo mật

- **Không** commit mã truy cập hay key Azure. Không đặt chúng vào biến `VITE_*`, vì mọi biến `VITE_*` đều bị build vào trang web public.
- Nếu nghi mã bị lộ: chạy lại `npx wrangler secret put APP_ACCESS_TOKEN` với mã mới. Mã cũ mất hiệu lực ngay lập tức.
- Đổi hạn mức: sửa `MONTHLY_LIMIT_SECONDS` trong `wrangler.toml` rồi `npx wrangler deploy`.
- Azure chỉ nhận tối đa 30 giây audio cho mỗi lần chấm; app tự cắt phần dư và báo cho bạn.
