import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable( )
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token from Core Hub');
    }

    const token = authHeader.split(' ')[1];
    
    // จำลองการแกะข้อมูลจาก Token ของ Core Hub
    // ในระบบจริง จะต้องใช้ Secret Key หรือ Public Key ของ Core Hub มา Verify
    try {
      // สมมติว่าแกะออกมาแล้วได้ payload ที่มี core_user_id และ role
      const coreUserPayload = {
        core_user_id: 'user_mju_12345', // ดึงเฉพาะ ID ตามกฎ
        role: 'student', // student | alumni | staff | lecturer | admin | guest
      };

      // แนบข้อมูลผู้ใช้เข้ากับ Request (เก็บเฉพาะ core_user_id และ role)
      (request as any).user = coreUserPayload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid Core Hub token');
    }
  }
}