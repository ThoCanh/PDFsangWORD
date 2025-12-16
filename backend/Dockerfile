# 1. Dùng Python 3.10 bản Slim
FROM python:3.10-slim

# 2. Thiết lập biến môi trường
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. CÀI ĐẶT CÁC GÓI HỆ THỐNG (FIX LỖI TẠI ĐÂY)
# - Đã thay 'libgl1-mesa-glx' thành 'libgl1' (Gói mới)
# - Thêm 'libglib2.0-0' (Cần thiết cho xử lý ảnh)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libreoffice \
    libreoffice-java-common \
    default-jre \
    tesseract-ocr \
    tesseract-ocr-vie \
    ghostscript \
    libgl1 \
    libglib2.0-0 \
    libgdiplus \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 4. Thiết lập thư mục
WORKDIR /app

# 5. Cài thư viện Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy code
COPY . .

# 7. Mở cổng
EXPOSE 8000

# 8. Chạy Server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]