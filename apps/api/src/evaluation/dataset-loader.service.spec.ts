import { Test, TestingModule } from '@nestjs/testing';
import { DatasetLoader } from './dataset-loader.service';
import * as fs from 'fs';
import * as path from 'path';

describe('DatasetLoader', () => {
  let loader: DatasetLoader;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [DatasetLoader],
    }).compile();

    loader = module.get<DatasetLoader>(DatasetLoader);
  });

  afterEach(async () => {
    await module.close();
  });

  it('instantiates', () => {
    expect(loader).toBeDefined();
  });

  describe('load', () => {
    it('loads the committed dataset successfully', () => {
      const dataset = loader.load();

      expect(dataset.version).toBe('1.0.0');
      expect(dataset.name).toBe('nexus-ai-evaluation-dataset');
      expect(dataset.questions).toBeInstanceOf(Array);
      expect(dataset.questions.length).toBeGreaterThanOrEqual(20);
      expect(dataset.questions.length).toBeLessThanOrEqual(50);
    });

    it('each question has required fields', () => {
      const dataset = loader.load();

      for (const question of dataset.questions) {
        expect(question.id).toBeTruthy();
        expect(typeof question.id).toBe('string');
        expect(question.question).toBeTruthy();
        expect(typeof question.question).toBe('string');
        expect(question.expectedAnswer).toBeTruthy();
        expect(typeof question.expectedAnswer).toBe('string');
        expect(Array.isArray(question.referenceChunks)).toBe(true);
        expect(question.referenceChunks.length).toBeGreaterThan(0);
        expect(question.category).toBeTruthy();
        expect(typeof question.category).toBe('string');
      }
    });

    it('question ids are unique', () => {
      const dataset = loader.load();
      const ids = dataset.questions.map((q) => q.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getVersion', () => {
    it('returns the dataset version', () => {
      const version = loader.getVersion();

      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('getQuestions', () => {
    it('returns all questions', () => {
      const questions = loader.getQuestions();

      expect(questions).toBeInstanceOf(Array);
      expect(questions.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('getQuestionById', () => {
    it('returns a question when id exists', () => {
      const dataset = loader.load();
      const firstQuestion = dataset.questions[0];

      const found = loader.getQuestionById(firstQuestion.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(firstQuestion.id);
      expect(found!.question).toBe(firstQuestion.question);
    });

    it('returns undefined when id does not exist', () => {
      const found = loader.getQuestionById('non-existent-id');

      expect(found).toBeUndefined();
    });
  });

  describe('validateStructure', () => {
    it('throws when dataset is not an object', () => {
      const tempPath = path.join(__dirname, 'dataset', 'temp-invalid.json');
      fs.writeFileSync(tempPath, JSON.stringify('not-an-object'));

      const tempLoader = new DatasetLoader();
      (tempLoader as unknown as { datasetPath: string }).datasetPath = tempPath;

      expect(() => tempLoader.load()).toThrow('Dataset must be a JSON object');

      fs.unlinkSync(tempPath);
    });

    it('throws when version is missing', () => {
      const tempPath = path.join(__dirname, 'dataset', 'temp-no-version.json');
      fs.writeFileSync(
        tempPath,
        JSON.stringify({ name: 'test', description: 'test', questions: [] }),
      );

      const tempLoader = new DatasetLoader();
      (tempLoader as unknown as { datasetPath: string }).datasetPath = tempPath;

      expect(() => tempLoader.load()).toThrow(
        'Dataset must have a string "version" field',
      );

      fs.unlinkSync(tempPath);
    });

    it('throws when questions is not an array', () => {
      const tempPath = path.join(__dirname, 'dataset', 'temp-no-questions.json');
      fs.writeFileSync(
        tempPath,
        JSON.stringify({
          version: '1.0.0',
          name: 'test',
          description: 'test',
          questions: 'not-array',
        }),
      );

      const tempLoader = new DatasetLoader();
      (tempLoader as unknown as { datasetPath: string }).datasetPath = tempPath;

      expect(() => tempLoader.load()).toThrow(
        'Dataset must have an array "questions" field',
      );

      fs.unlinkSync(tempPath);
    });

    it('throws when a question lacks required fields', () => {
      const tempPath = path.join(__dirname, 'dataset', 'temp-bad-question.json');
      fs.writeFileSync(
        tempPath,
        JSON.stringify({
          version: '1.0.0',
          name: 'test',
          description: 'test',
          questions: [{ id: 'q001' }],
        }),
      );

      const tempLoader = new DatasetLoader();
      (tempLoader as unknown as { datasetPath: string }).datasetPath = tempPath;

      expect(() => tempLoader.load()).toThrow(
        'must have a non-empty string "question"',
      );

      fs.unlinkSync(tempPath);
    });

    it('throws when referenceChunks contains non-string values', () => {
      const tempPath = path.join(
        __dirname,
        'dataset',
        'temp-bad-chunks.json',
      );
      fs.writeFileSync(
        tempPath,
        JSON.stringify({
          version: '1.0.0',
          name: 'test',
          description: 'test',
          questions: [
            {
              id: 'q001',
              question: 'What?',
              expectedAnswer: 'That.',
              referenceChunks: [123],
              category: 'test',
            },
          ],
        }),
      );

      const tempLoader = new DatasetLoader();
      (tempLoader as unknown as { datasetPath: string }).datasetPath = tempPath;

      expect(() => tempLoader.load()).toThrow(
        'referenceChunks[0] must be a string',
      );

      fs.unlinkSync(tempPath);
    });
  });
});
