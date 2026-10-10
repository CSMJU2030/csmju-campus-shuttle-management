import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

@Injectable()
export class AuthService {
  private JWKS = createRemoteJWKSet(
    new URL('https://core-hub.csmju.com/.well-known/jwks.json') // URL JWKS ของ Core Hub ตามมาตรฐาน
  );

  async validateToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, this.JWKS, {
        algorithms: ['RS256'],
      });
      return { status: 'success', user: payload };
    } catch (error) {
      throw new UnauthorizedException('Invalid token or JWKS verification failed');
    }
  }
}