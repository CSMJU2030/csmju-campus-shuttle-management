import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // เปิดใช้งาน CORS เพื่อรองรับการเชื่อมต่อจาก Frontend
  app.enableCors();

  // กำหนดให้รันที่พอร์ต 3206 สำหรับ Local Development
  const port = process.env.PORT || 3206;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

// จุดสำคัญ: ต้องมีบรรทัดนี้เรียกใช้งานฟังก์ชัน bootstrap เพื่อให้เซิร์ฟเวอร์เริ่มทำงาน
bootstrap();