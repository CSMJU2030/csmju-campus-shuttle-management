import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token from Core Hub');
    }

    const token = authHeader.split(' ')[1];

    try {
      const coreUserPayload = {
        core_user_id: 'user_mju_12345',
        role: 'student',
      };

      (request as any).user = coreUserPayload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid Core Hub token');
    }
  }
}