from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import urllib.request as urllib_req

OUT_DIR = Path("/tmp/test_scans")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Ensure Noto Sans is available
font_path = OUT_DIR / "NotoSans-Regular.ttf"
if not font_path.exists():
    print("Downloading Noto Sans font...")
    url = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf"
    urllib_req.urlretrieve(url, str(font_path))

font_vi = ImageFont.truetype(str(font_path), 36)
font_en = ImageFont.truetype(str(font_path), 36)

# Vietnamese sample
vi_text = (
    "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n"
    "Độc lập - Tự do - Hạnh phúc\n\n"
    "Đây là văn bản mẫu tiếng Việt có dấu: Độc lập, tự do, hạnh phúc, trường đại học, quốc gia."
)
# English sample
en_text = (
    "UNITED STATES OF AMERICA\n"
    "Sample scanned document\n\n"
    "This is a sample English text for OCR testing. The quick brown fox jumps over the lazy dog."
)

for lang, text, fn in [("vi", vi_text, "pacc_vi.pdf"), ("en", en_text, "pacc_en.pdf")]:
    img = Image.new("RGB", (1654, 2339), color=(255,255,255))
    draw = ImageDraw.Draw(img)
    x, y = 80, 80
    for line in text.split("\n"):
        draw.text((x, y), line, font=font_vi if lang=="vi" else font_en, fill=(0,0,0))
        y += 60
    out_pdf = OUT_DIR / fn
    img.save(out_pdf, "PDF", resolution=300.0)
    print(f"Saved {out_pdf}")

print("Done generating scanned PDFs in /tmp/test_scans")