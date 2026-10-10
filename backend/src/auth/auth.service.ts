import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  validateUser(credentials: any) {
    return {
      status: 'success',
      message: 'Authentication successful',
      access_token: 'mock-core-hub-token-12345',
      user: {
        core_user_id: 'user_mju_12345',
        role: 'student',
      },
    };
  }
}