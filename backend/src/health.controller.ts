import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      success: true,
      data: { status: 'ok', timestamp: new Date().toISOString() },
      error: null,
      meta: {}
    };
  }
}