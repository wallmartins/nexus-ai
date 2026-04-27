import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { GuardrailResult } from './guardrail.types';

const DEFAULT_MAX_INPUT_LENGTH = 4000;

@Injectable()
export class GuardrailService {
  validateInput(input: string, maxLength = DEFAULT_MAX_INPUT_LENGTH): void {
    if (!input || input.trim().length === 0) {
      throw new BadRequestException({
        code: 'GUARDRAIL_EMPTY_INPUT',
        message: 'Input cannot be empty',
      });
    }

    if (input.length > maxLength) {
      throw new BadRequestException({
        code: 'GUARDRAIL_INPUT_TOO_LONG',
        message: `Input exceeds maximum length of ${maxLength} characters`,
      });
    }
  }

  validateOutput<T>(output: string, schema: z.ZodSchema<T>): T {
    const parsed = this.tryParseJson(output);
    const result = schema.safeParse(parsed);

    if (!result.success) {
      throw new BadRequestException({
        code: 'GUARDRAIL_OUTPUT_VALIDATION_FAILED',
        message: `Output does not match expected schema: ${result.error.message}`,
      });
    }

    return result.data;
  }

  async validateOutputWithRetry<T>(
    output: string,
    schema: z.ZodSchema<T>,
    retryFn: () => Promise<string>,
  ): Promise<GuardrailResult<T>> {
    const first = this.safeValidate(output, schema);
    if (first.ok) return first;

    let retryOutput: string;
    try {
      retryOutput = await retryFn();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Retry failed: ${message}` };
    }

    const second = this.safeValidate(retryOutput, schema);
    if (second.ok) return second;

    return {
      ok: false,
      error: `Output validation failed after retry. First: ${first.error}. Second: ${second.error}`,
    };
  }

  private safeValidate<T>(
    output: string,
    schema: z.ZodSchema<T>,
  ): GuardrailResult<T> {
    const parsed = this.tryParseJson(output);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { ok: true, value: result.data };
    }

    return { ok: false, error: result.error.message };
  }

  private tryParseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
