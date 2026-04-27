import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EvaluationService, EvaluationModelConfig } from './evaluation.service';
import { QueueService } from '../queue/queue.service';
import { EvaluationTriggerRequest, EvaluationTriggerResponse } from './evaluation.types';

@Controller('api/v1/evaluations')
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly queueService: QueueService,
  ) {}

  @Post()
  async triggerEvaluation(
    @Body() body: EvaluationTriggerRequest,
  ): Promise<EvaluationTriggerResponse> {
    if (!Array.isArray(body.models) || body.models.length === 0) {
      throw new BadRequestException({
        code: 'MISSING_MODELS',
        message: 'At least one model must be specified',
      });
    }

    for (const model of body.models) {
      if (!model.provider || typeof model.provider !== 'string') {
        throw new BadRequestException({
          code: 'INVALID_MODEL_PROVIDER',
          message: 'Each model must have a provider string',
        });
      }
      if (!model.modelName || typeof model.modelName !== 'string') {
        throw new BadRequestException({
          code: 'INVALID_MODEL_NAME',
          message: 'Each model must have a modelName string',
        });
      }
    }

    const { runId, status, queuedAt } = await this.evaluationService.createRun(
      body.models as EvaluationModelConfig[],
    );

    await this.queueService.enqueueEvaluation({
      runId,
      datasetVersion: '',
      models: body.models as EvaluationModelConfig[],
    });

    return { runId, status, queuedAt };
  }

  @Get()
  async listRuns(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<unknown> {
    return this.evaluationService.listRuns({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  async getRun(@Param('id') id: string): Promise<unknown> {
    const run = await this.evaluationService.getRunById(id);

    if (!run) {
      throw new NotFoundException({
        code: 'RUN_NOT_FOUND',
        message: `Evaluation run with id '${id}' not found`,
      });
    }

    return run;
  }

  @Get(':id/results')
  async getRunResults(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<unknown> {
    const run = await this.evaluationService.getRunById(id);

    if (!run) {
      throw new NotFoundException({
        code: 'RUN_NOT_FOUND',
        message: `Evaluation run with id '${id}' not found`,
      });
    }

    return this.evaluationService.getRunResults({
      runId: id,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
