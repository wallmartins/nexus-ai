import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { GuardrailService } from './guardrail.service';

describe('GuardrailService', () => {
  let service: GuardrailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardrailService],
    }).compile();

    service = module.get<GuardrailService>(GuardrailService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('validateInput', () => {
    it('accepts valid input', () => {
      expect(() => service.validateInput('Hello world')).not.toThrow();
    });

    it('throws on empty input', () => {
      expect(() => service.validateInput('')).toThrow(BadRequestException);
      expect(() => service.validateInput('   ')).toThrow(BadRequestException);
    });

    it('throws on oversized input with default limit', () => {
      const longInput = 'a'.repeat(4001);
      expect(() => service.validateInput(longInput)).toThrow(
        BadRequestException,
      );
    });

    it('throws on oversized input with custom limit', () => {
      const input = 'a'.repeat(101);
      expect(() => service.validateInput(input, 100)).toThrow(
        BadRequestException,
      );
    });

    it('accepts input at exact limit', () => {
      const input = 'a'.repeat(4000);
      expect(() => service.validateInput(input)).not.toThrow();
    });

    it('error response contains guardrail code for empty input', () => {
      try {
        service.validateInput('');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<string, string>;
        expect(response.code).toBe('GUARDRAIL_EMPTY_INPUT');
        expect(response.message).toContain('empty');
      }
    });

    it('error response contains guardrail code for long input', () => {
      try {
        service.validateInput('a'.repeat(5000));
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<string, string>;
        expect(response.code).toBe('GUARDRAIL_INPUT_TOO_LONG');
        expect(response.message).toContain('4000');
      }
    });
  });

  describe('validateOutput', () => {
    const testSchema = z.object({
      answer: z.string(),
      confidence: z.number().min(0).max(1),
    });

    it('returns parsed data for valid JSON output', () => {
      const output = JSON.stringify({ answer: 'Yes', confidence: 0.95 });
      const result = service.validateOutput(output, testSchema);

      expect(result).toEqual({ answer: 'Yes', confidence: 0.95 });
    });

    it('returns parsed data for valid non-JSON string matching schema', () => {
      const output = 'plain text';
      const stringSchema = z.string();
      const result = service.validateOutput(output, stringSchema);

      expect(result).toBe('plain text');
    });

    it('throws on invalid JSON structure', () => {
      const output = JSON.stringify({ answer: 42, confidence: 'high' });
      expect(() => service.validateOutput(output, testSchema)).toThrow(
        BadRequestException,
      );
    });

    it('throws on malformed JSON string', () => {
      const output = '{ invalid json';
      expect(() => service.validateOutput(output, testSchema)).toThrow(
        BadRequestException,
      );
    });

    it('error response contains guardrail code', () => {
      try {
        service.validateOutput('{}', testSchema);
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<string, string>;
        expect(response.code).toBe('GUARDRAIL_OUTPUT_VALIDATION_FAILED');
      }
    });
  });

  describe('validateOutputWithRetry', () => {
    const testSchema = z.object({
      result: z.boolean(),
    });

    it('returns success on first valid output', async () => {
      const output = JSON.stringify({ result: true });
      const retryFn = jest.fn().mockRejectedValue(new Error('should not be called'));

      const result = await service.validateOutputWithRetry(output, testSchema, retryFn);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ result: true });
      }
      expect(retryFn).not.toHaveBeenCalled();
    });

    it('returns success on retry output when first fails', async () => {
      const firstOutput = '{ invalid';
      const retryFn = jest.fn().mockResolvedValue(JSON.stringify({ result: false }));

      const result = await service.validateOutputWithRetry(firstOutput, testSchema, retryFn);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ result: false });
      }
      expect(retryFn).toHaveBeenCalledTimes(1);
    });

    it('returns structured error when both attempts fail', async () => {
      const firstOutput = '{ invalid';
      const retryFn = jest.fn().mockResolvedValue('not json');

      const result = await service.validateOutputWithRetry(firstOutput, testSchema, retryFn);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('First:');
        expect(result.error).toContain('Second:');
        expect(result.error).toContain('retry');
      }
    });

    it('returns structured error when retry function throws', async () => {
      const firstOutput = '{ invalid';
      const retryFn = jest.fn().mockRejectedValue(new Error('LLM timeout'));

      const result = await service.validateOutputWithRetry(firstOutput, testSchema, retryFn);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('LLM timeout');
      }
    });
  });
});
