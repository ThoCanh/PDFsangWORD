# PDFsangWORD

DocuFlowAI – dự án chuyển đổi tài liệu (PDF ⇄ Word, JPG ⇄ PNG, Word → PDF) với giao diện Next.js và backend Python.

## SePay VA + Webhook

- Cấu hình biến môi trường trong `backend/.env` (tham khảo `backend/.env.example`): `SEPAY_BANK`, `SEPAY_VA_ACCOUNT`, `SEPAY_WEBHOOK_SECRET`.
- Backend endpoints:
	- `POST /payments/orders` (yêu cầu đăng nhập) → tạo đơn, trả về `transfer_content` + `qr_image_url`.
	- `POST /payments/sepay/webhook` → nhận callback từ SePay, lưu lịch sử giao dịch, tự kích hoạt gói (cập nhật `users.plan_key`).

## PDF conversion behavior

- **Tier A (Premium):** when the user explicitly selects Tier A we send the original scanned PDF to **Adobe PDF Services** and instruct Adobe to run OCR in Vietnamese (via `ADOBE_OCR_LANG`, default `vi-VN`). The server will **not** run OCR (ocrmypdf/Tesseract) or LibreOffice preprocessing before sending the file. Tier A requires Adobe credentials (`ADOBE_CLIENT_ID` and `ADOBE_CLIENT_SECRET`) to be configured on the server.

- **OCR-first (Chế độ chuyển PDF(SCAN) sang Word văn bản) — Premium:** For scan-heavy PDFs, we provide a dedicated OCR-first mode that performs local OCR with `ocrmypdf` + Tesseract (configured to Vietnamese) to create a searchable PDF while preserving original images/stamps. After local OCR, the searchable PDF is sent to Adobe for layout-preserving conversion to DOCX. This avoids Vietnamese Mojibake and prevents stamps from being converted into text. This mode requires Adobe to be configured and is for Premium users only.
