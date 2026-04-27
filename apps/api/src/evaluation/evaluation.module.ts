import { Module } from '@nestjs/common';
import { DatasetLoader } from './dataset-loader.service';

@Module({
  providers: [DatasetLoader],
  exports: [DatasetLoader],
})
export class EvaluationModule {}
