import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  EvaluationDataset,
  DatasetQuestion,
} from './dataset.types';

const DATASET_FILE_NAME = 'dataset-v1.json';

@Injectable()
export class DatasetLoader {
  private readonly datasetPath: string;

  constructor() {
    this.datasetPath = path.join(
      __dirname,
      'dataset',
      DATASET_FILE_NAME,
    );
  }

  load(): EvaluationDataset {
    const raw = fs.readFileSync(this.datasetPath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;

    this.validateStructure(parsed);

    return parsed as EvaluationDataset;
  }

  getVersion(): string {
    return this.load().version;
  }

  getQuestions(): DatasetQuestion[] {
    return this.load().questions;
  }

  getQuestionById(id: string): DatasetQuestion | undefined {
    return this.load().questions.find((q) => q.id === id);
  }

  private validateStructure(data: unknown): void {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Dataset must be a JSON object');
    }

    const dataset = data as Record<string, unknown>;

    if (typeof dataset.version !== 'string') {
      throw new Error('Dataset must have a string "version" field');
    }

    if (typeof dataset.name !== 'string') {
      throw new Error('Dataset must have a string "name" field');
    }

    if (typeof dataset.description !== 'string') {
      throw new Error('Dataset must have a string "description" field');
    }

    if (!Array.isArray(dataset.questions)) {
      throw new Error('Dataset must have an array "questions" field');
    }

    for (let i = 0; i < dataset.questions.length; i++) {
      this.validateQuestion(dataset.questions[i], i);
    }
  }

  private validateQuestion(question: unknown, index: number): void {
    if (typeof question !== 'object' || question === null) {
      throw new Error(`Question at index ${index} must be an object`);
    }

    const q = question as Record<string, unknown>;

    if (typeof q.id !== 'string' || q.id.length === 0) {
      throw new Error(`Question at index ${index} must have a non-empty string "id"`);
    }

    if (typeof q.question !== 'string' || q.question.length === 0) {
      throw new Error(`Question at index ${index} must have a non-empty string "question"`);
    }

    if (typeof q.expectedAnswer !== 'string' || q.expectedAnswer.length === 0) {
      throw new Error(`Question at index ${index} must have a non-empty string "expectedAnswer"`);
    }

    if (!Array.isArray(q.referenceChunks)) {
      throw new Error(`Question at index ${index} must have an array "referenceChunks"`);
    }

    for (let j = 0; j < q.referenceChunks.length; j++) {
      if (typeof q.referenceChunks[j] !== 'string') {
        throw new Error(
          `Question at index ${index}, referenceChunks[${j}] must be a string`,
        );
      }
    }

    if (typeof q.category !== 'string' || q.category.length === 0) {
      throw new Error(`Question at index ${index} must have a non-empty string "category"`);
    }
  }
}
