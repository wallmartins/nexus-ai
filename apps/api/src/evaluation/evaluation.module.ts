import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { DatabaseModule } from '../database/database.module';
import { DatasetLoader } from './dataset-loader.service';
import { ScoringService } from './scoring.service';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';

@Module({
  imports: [AgentModule, DatabaseModule],
  controllers: [EvaluationController],
  providers: [DatasetLoader, ScoringService, EvaluationService],
  exports: [DatasetLoader, ScoringService, EvaluationService],
})
export class EvaluationModule {}
