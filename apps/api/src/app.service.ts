import { Injectable } from '@nestjs/common';
import type { HealthStatus } from '@furai/shared';

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'furai-api',
      timestamp: new Date().toISOString(),
    };
  }
}
