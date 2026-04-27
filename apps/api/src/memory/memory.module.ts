import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { CacheService } from './cache.service';

@Module({
  providers: [MemoryService, CacheService],
  exports: [MemoryService, CacheService],
})
export class MemoryModule {}
