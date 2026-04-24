import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';

export interface ParsedDocument {
  text: string;
  pageCount?: number;
}

@Injectable()
export class DocumentParserService {
  async parse(filePath: string, mimeType: string): Promise<ParsedDocument> {
    const raw = await this.extractRaw(filePath, mimeType);
    const cleaned = this.cleanText(raw.text);
    return { text: cleaned, pageCount: raw.pageCount };
  }

  private async extractRaw(
    filePath: string,
    mimeType: string,
  ): Promise<ParsedDocument> {
    switch (mimeType) {
      case 'application/pdf':
        return this.parsePdf(filePath);
      case 'text/plain':
        return this.parseTxt(filePath);
      case 'text/markdown':
        return this.parseMarkdown(filePath);
      default:
        throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
  }

  private async parsePdf(filePath: string): Promise<ParsedDocument> {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return { text: result.text, pageCount: result.pages.length };
  }

  private async parseTxt(filePath: string): Promise<ParsedDocument> {
    const text = await readFile(filePath, 'utf-8');
    return { text };
  }

  private async parseMarkdown(filePath: string): Promise<ParsedDocument> {
    const text = await readFile(filePath, 'utf-8');
    return { text: this.stripMarkdownSyntax(text) };
  }

  private stripMarkdownSyntax(text: string): string {
    return (
      text
        // Remove HTML tags
        .replace(/<[^>]+>/g, '')
        // Remove headings markers
        .replace(/^#{1,6}\s+/gm, '')
        // Remove bold/italic markers
        .replace(/(\*{1,2}|_{1,2})(.+?)\1/g, '$2')
        // Remove inline code
        .replace(/`([^`]+)`/g, '$1')
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove links, keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove images
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        // Remove blockquotes
        .replace(/^>\s?/gm, '')
        // Remove horizontal rules
        .replace(/^(---|___|\*\*\*)$/gm, '')
        // Remove list markers
        .replace(/^(\s*)[-*+]\s+/gm, '$1')
        .replace(/^\s*\d+\.\s+/gm, '')
    );
  }

  private cleanText(text: string): string {
    return (
      text
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Collapse multiple blank lines into one
        .replace(/\n{3,}/g, '\n\n')
        // Strip repeated headers/footers patterns (common in PDFs)
        .replace(/\n\s*Page\s*\d+\s*(of\s*\d+)?\s*\n/gi, '\n')
        // Normalize whitespace
        .replace(/[ \t]+/g, ' ')
        // Trim
        .trim()
    );
  }
}
