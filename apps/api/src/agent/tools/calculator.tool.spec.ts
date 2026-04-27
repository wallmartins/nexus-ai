import { Test, TestingModule } from '@nestjs/testing';
import { CalculatorTool, evaluateExpression } from './calculator.tool';

describe('evaluateExpression', () => {
  it('evaluates addition', () => {
    expect(evaluateExpression('2 + 3')).toBe(5);
  });

  it('evaluates subtraction', () => {
    expect(evaluateExpression('10 - 4')).toBe(6);
  });

  it('evaluates multiplication', () => {
    expect(evaluateExpression('3 * 4')).toBe(12);
  });

  it('evaluates division', () => {
    expect(evaluateExpression('12 / 4')).toBe(3);
  });

  it('evaluates exponentiation', () => {
    expect(evaluateExpression('2 ^ 3')).toBe(8);
  });

  it('evaluates parentheses', () => {
    expect(evaluateExpression('(2 + 3) * 4')).toBe(20);
  });

  it('respects operator precedence', () => {
    expect(evaluateExpression('2 + 3 * 4')).toBe(14);
  });

  it('handles unary minus', () => {
    expect(evaluateExpression('-5 + 3')).toBe(-2);
  });

  it('handles unary plus', () => {
    expect(evaluateExpression('+5')).toBe(5);
  });

  it('handles decimal numbers', () => {
    expect(evaluateExpression('3.5 * 2')).toBe(7);
  });

  it('handles nested parentheses', () => {
    expect(evaluateExpression('((1 + 2) * 3) ^ 2')).toBe(81);
  });

  it('handles whitespace', () => {
    expect(evaluateExpression('  2   +   3  ')).toBe(5);
  });

  it('throws on division by zero', () => {
    expect(() => evaluateExpression('10 / 0')).toThrow('Division by zero');
  });

  it('throws on empty expression', () => {
    expect(() => evaluateExpression('')).toThrow();
  });

  it('throws on invalid characters', () => {
    expect(() => evaluateExpression('2 + abc')).toThrow();
  });

  it('throws on missing parenthesis', () => {
    expect(() => evaluateExpression('(2 + 3')).toThrow('Missing closing parenthesis');
  });
});

describe('CalculatorTool', () => {
  let tool: CalculatorTool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculatorTool],
    }).compile();

    tool = module.get<CalculatorTool>(CalculatorTool);
  });

  it('instantiates', () => {
    expect(tool).toBeDefined();
    expect(tool.name).toBe('calculator');
  });

  describe('invoke', () => {
    it('returns result for valid math expression', async () => {
      const result = await tool.invoke({ query: '2 + 2', correlationId: 'corr-1' });

      expect(result.toolName).toBe('calculator');
      expect(result.output).toBe(4);
      expect(result.error).toBeUndefined();
    });

    it('returns error for non-math query', async () => {
      const result = await tool.invoke({ query: 'What is the refund policy?', correlationId: 'corr-2' });

      expect(result.output).toBeNull();
      expect(result.error).toBe('Query does not look like a math expression');
    });

    it('returns error for invalid math expression', async () => {
      const result = await tool.invoke({ query: '2 + + + 3', correlationId: 'corr-3' });

      expect(result.output).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('handles complex expression', async () => {
      const result = await tool.invoke({ query: '(10 - 2) * 3 + 4', correlationId: 'corr-4' });

      expect(result.output).toBe(28);
    });
  });
});
