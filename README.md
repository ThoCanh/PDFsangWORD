# PDFsangWORD

DocuFlowAI – dự án chuyển đổi tài liệu (PDF ⇄ Word, JPG ⇄ PNG, Word → PDF) với giao diện Next.js và backend Python.

## SePay VA + Webhook

- Cấu hình biến môi trường trong `backend/.env` (tham khảo `backend/.env.example`): `SEPAY_BANK`, `SEPAY_VA_ACCOUNT`, `SEPAY_WEBHOOK_SECRET`.
- Backend endpoints:
	- `POST /payments/orders` (yêu cầu đăng nhập) → tạo đơn, trả về `transfer_content` + `qr_image_url`.
	- `POST /payments/sepay/webhook` → nhận callback từ SePay, lưu lịch sử giao dịch, tự kích hoạt gói (cập nhật `users.plan_key`).
