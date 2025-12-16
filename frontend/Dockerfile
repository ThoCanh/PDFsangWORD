# --- SỬA DÒNG NÀY: Dùng Node 20 thay vì 18 ---
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Cài đặt thư viện
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

# 8. Chạy ứng dụng
CMD ["npm", "start"]