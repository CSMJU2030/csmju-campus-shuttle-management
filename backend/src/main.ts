import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ตั้งค่า Global Prefix ให้ตรงตามมาตรฐาน API conventions
  app.setGlobalPrefix('api/v1');

  await app.listen(3000);
}
bootstrap();