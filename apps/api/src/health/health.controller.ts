import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { HealthService, HealthStatus } from './health.service';
import { HealthStatusDto } from './health.dto';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'All services healthy', type: HealthStatusDto })
  @ApiResponse({ status: 503, description: 'One or more services unhealthy' })
  @HttpCode(HttpStatus.OK)
  async check(): Promise<HealthStatus> {
    const result = await this.healthService.check();

    if (result.status === 'unhealthy') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
