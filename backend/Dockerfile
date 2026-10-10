# ใช้ Node.js เวอร์ชั่นล่าสุดสำหรับ Build
FROM node:18-alpine AS builder

WORKDIR /app

# คัดลอก package.json และ pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# ติดตั้ง pnpm และ dependencies
RUN npm install -g pnpm && pnpm install

# คัดลอกโค้ดทั้งหมดและ Build เป็น JavaScript
COPY . .
RUN pnpm build

# ขั้นตอนการรันโปรดักชัน
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]