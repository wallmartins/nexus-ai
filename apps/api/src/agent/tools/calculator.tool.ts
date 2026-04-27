import { Injectable } from '@nestjs/common';
import { Tool, ToolInput, ToolResult } from './tool.types';

class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

class Tokenizer {
  private pos = 0;

  constructor(private readonly text: string) {}

  peek(): string | null {
    this.skipWhitespace();
    return this.text[this.pos] ?? null;
  }

  consume(expected: string): boolean {
    this.skipWhitespace();
    if (this.text[this.pos] === expected) {
      this.pos++;
      return true;
    }
    return false;
  }

  readNumber(): number {
    this.skipWhitespace();
    const start = this.pos;
    let hasDot = false;

    while (this.pos < this.text.length) {
      const ch = this.text[this.pos];
      if (ch >= '0' && ch <= '9') {
        this.pos++;
      } else if (ch === '.' && !hasDot) {
        hasDot = true;
        this.pos++;
      } else {
        break;
      }
    }

    const raw = this.text.slice(start, this.pos);
    if (raw.length === 0 || raw === '.') {
      throw new ParseError(`Expected number at position ${start}`);
    }

    return Number(raw);
  }

  private skipWhitespace(): void {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) {
      this.pos++;
    }
  }

  atEnd(): boolean {
    this.skipWhitespace();
    return this.pos >= this.text.length;
  }
}

function parseExpression(t: Tokenizer): number {
  let value = parseTerm(t);

  while (true) {
    if (t.consume('+')) {
      value += parseTerm(t);
    } else if (t.consume('-')) {
      value -= parseTerm(t);
    } else {
      break;
    }
  }

  return value;
}

function parseTerm(t: Tokenizer): number {
  let value = parseFactor(t);

  while (true) {
    if (t.consume('*')) {
      value *= parseFactor(t);
    } else if (t.consume('/')) {
      const divisor = parseFactor(t);
      if (divisor === 0) {
        throw new ParseError('Division by zero');
      }
      value /= divisor;
    } else {
      break;
    }
  }

  return value;
}

function parseFactor(t: Tokenizer): number {
  let value = parsePower(t);

  if (t.consume('^')) {
    const exponent = parseFactor(t);
    value = Math.pow(value, exponent);
  }

  return value;
}

function parsePower(t: Tokenizer): number {
  if (t.consume('+')) {
    return parsePrimary(t);
  }
  if (t.consume('-')) {
    return -parsePrimary(t);
  }
  return parsePrimary(t);
}

function parsePrimary(t: Tokenizer): number {
  if (t.consume('(')) {
    const value = parseExpression(t);
    if (!t.consume(')')) {
      throw new ParseError('Missing closing parenthesis');
    }
    return value;
  }

  return t.readNumber();
}

export function evaluateExpression(expression: string): number {
  const tokenizer = new Tokenizer(expression);
  const result = parseExpression(tokenizer);

  if (!tokenizer.atEnd()) {
    throw new ParseError('Unexpected characters at end of expression');
  }

  return result;
}

function looksLikeMathExpression(query: string): boolean {
  const cleaned = query.trim();
  if (cleaned.length === 0) return false;

  // Must contain at least one operator or parenthesis
  const hasOperator = /[+\-*/^()]/.test(cleaned);
  if (!hasOperator) return false;

  // Should only contain valid math characters
  const validChars = /^[\d\s+\-*/^().]+$/;
  if (!validChars.test(cleaned)) return false;

  // Must contain at least one digit
  const hasDigit = /\d/.test(cleaned);
  if (!hasDigit) return false;

  return true;
}

@Injectable()
export class CalculatorTool implements Tool {
  readonly name = 'calculator';

  async invoke(input: ToolInput): Promise<ToolResult> {
    if (!looksLikeMathExpression(input.query)) {
      return {
        toolName: this.name,
        output: null,
        error: 'Query does not look like a math expression',
      };
    }

    try {
      const result = evaluateExpression(input.query);
      return { toolName: this.name, output: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { toolName: this.name, output: null, error: message };
    }
  }
}
