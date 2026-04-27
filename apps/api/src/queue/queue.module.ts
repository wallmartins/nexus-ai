import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JobStatusService } from './job-status.service';
import { JobStatusController } from './job-status.controller';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [WorkersModule],
  controllers: [JobStatusController],
  providers: [QueueService, JobStatusService],
  exports: [QueueService, JobStatusService],
})
export class QueueModule {}
