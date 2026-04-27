import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JobRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdate(
    queueName: string,
    bullJobId: string,
    status: string,
    payload: Record<string, unknown>,
    attempts: number,
    failedReason?: string,
  ): Promise<void> {
    const existing = await this.prisma.jobRecord.findFirst({
      where: { bullJobId },
    });

    const data = {
      queueName,
      bullJobId,
      status,
          payload: payload as any,
      attempts,
      failedReason: failedReason ?? null,
    };

    if (existing) {
      await this.prisma.jobRecord.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await this.prisma.jobRecord.create({ data });
    }
  }

  async markCompleted(bullJobId: string): Promise<void> {
    await this.prisma.jobRecord.updateMany({
      where: { bullJobId },
      data: { status: 'completed' },
    });
  }

  async markFailed(
    bullJobId: string,
    failedReason: string,
    attempts: number,
  ): Promise<void> {
    await this.prisma.jobRecord.updateMany({
      where: { bullJobId },
      data: { status: 'failed', failedReason, attempts },
    });
  }

  async findFailed(offset = 0, limit = 50) {
    return this.prisma.jobRecord.findMany({
      where: { status: 'failed' },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }
}
