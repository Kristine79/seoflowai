import fs from "node:fs";
import path from "node:path";
import { marked, type Tokens } from "marked";
import pdfMake from "pdfmake/build/pdfmake.js";
import type { ReportData } from "./report";
import { generateReport } from "./report-data";

export type { ReportData };

const CONTENT_WIDTH = 595.28 - 84; // A4 − margins 42+42

const FONT_NAMES = {
  normal: "Roboto-Regular.ttf",
  bold: "Roboto-Medium.ttf",
  italics: "Roboto-Italic.ttf",
  bolditalics: "Roboto-MediumItalic.ttf",
} as const;

function loadFonts() {
  const dir = path.join(process.cwd(), "node_modules", "pdfmake", "build", "fonts", "Roboto");
  const storage: Record<string, Buffer> = {};
  for (const name of Object.values(FONT_NAMES)) {
    storage[name] = fs.readFileSync(path.join(dir, name));
  }
  const vfs = (pdfMake as unknown as { virtualfs: { storage: Record<string, Buffer> } }).virtualfs;
  vfs.storage = storage;
}

/** Заменяет символы, отсутствующие в Roboto subset, ASCII-эквивалентами. */
const SAFE_CHARS: Record<string, string> = {
  "⚠": "[!]",
  "→": "->",
  "←": "<-",
  "↑": "^",
  "↓": "v",
  "⇒": "=>",
};

function sanitize(s: string): string {
  let out = "";
  for (const ch of s) out += SAFE_CHARS[ch] ?? ch;
  return out;
}

type InlinePart = { text: string; bold?: boolean; italics?: boolean; code?: boolean };

/** Разбирает inline-markdown: **bold**, *italic*, `code`. */
function renderInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: sanitize(text.slice(last, m.index)) });
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push({ text: token.slice(1, -1), code: true });
    } else if (token.startsWith("**")) {
      parts.push({ text: sanitize(token.slice(2, -2)), bold: true });
    } else {
      parts.push({ text: sanitize(token.slice(1, -1)), italics: true });
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push({ text: sanitize(text.slice(last)) });
  return parts;
}

function inlineToPdf(text: string): InlinePart[] {
  return renderInline(text).map((p) =>
    p.code
      ? { text: p.text, fontSize: 8, background: "#f4f4f5", color: "#44403c" }
      : p
  );
}

type PdfContent = Record<string, unknown> | string | PdfContent[];

const COLUMN_MIN_WIDTH = 34;

function tableWidths(columns: number, content: string[][]): number[] {
  const maxLens = Array.from({ length: columns }, (_, c) =>
    Math.max(1, ...content.map((row) => row[c]?.length ?? 1))
  );
  const widths = maxLens.map((len) => Math.max(COLUMN_MIN_WIDTH, Math.min(len * 4.6, 190)));
  const sum = widths.reduce((a, b) => a + b, 0);
  if (sum > CONTENT_WIDTH) {
    const k = CONTENT_WIDTH / sum;
    return widths.map((w) => Math.max(COLUMN_MIN_WIDTH, w * k));
  }
  return widths;
}

function listToPdf(items: Tokens.ListItem[]): PdfContent[] {
  return items.map((item) => {
    // вложенный список внутри пункта
    const nested = item.tokens?.find((t): t is Tokens.List => t.type === "list");
    if (nested) {
      return [inlineToPdf(item.text ?? "") as unknown as PdfContent, listToPdf(nested.items)];
    }
    return inlineToPdf(item.text ?? "") as unknown as PdfContent;
  });
}

/** Конвертирует markdown-отчёт (из generateReport) в pdfmake-определение. */
export function markdownToPdfContent(markdown: string): PdfContent[] {
  const tokens = marked.lexer(markdown);
  const content: PdfContent[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        const text = inlineToPdf(token.raw.replace(/^#{1,6}\s*/, "").trim());
        const depth = token.depth;
        const style = depth === 1 ? "title" : depth === 2 ? "h2" : "h3";
        content.push({ text, style, margin: depth === 1 ? [0, 0, 0, 10] : depth === 2 ? [0, 14, 0, 6] : [0, 10, 0, 4] });
        break;
      }
      case "paragraph":
        content.push({ text: inlineToPdf(token.text), style: "body", margin: [0, 0, 0, 4] });
        break;
      case "list":
        content.push({ ul: listToPdf(token.items), style: "body", margin: [0, 0, 0, 6] });
        break;
      case "blockquote": {
        const q = token.raw.replace(/^>\s?/gm, "").trim();
        content.push({ text: inlineToPdf(q), italics: true, color: "#52525b", margin: [10, 2, 0, 8] });
        break;
      }
      case "table": {
        const header = token.header.map((h) => inlineToPdf(h.text)) as unknown as string[];
        const rows = token.rows.map((r) => r.map((c) => inlineToPdf(c.text))) as unknown as string[][];
        const body = [header, ...rows];
        const widths = tableWidths(token.header.length, body);
        const wide = token.header.length >= 5;
        content.push({
          table: { headerRows: 1, widths: widths.map((w) => w), body },
          layout: "lightHorizontalLines",
          fontSize: wide ? 7 : 8,
          margin: [0, 2, 0, 10],
        });
        break;
      }
      case "space":
      case "hr":
      default:
        break;
    }
  }
  return content;
}

/** Генерирует PDF из markdown-отчёта (A4, header/footer, номер страницы). */
export function renderMarkdownToPdf(markdown: string): Promise<Buffer> {
  loadFonts();
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [42, 64, 42, 56],
    info: { title: "AI Search Intelligence Audit", author: "SEOFlow AI" },
    header: {
      columns: [
        { text: "AI Search Intelligence Audit", fontSize: 8, color: "#71717a", margin: [42, 26, 0, 0] },
        { text: "SEOFlow AI", alignment: "right", fontSize: 8, color: "#a1a1aa", margin: [0, 26, 42, 0] },
      ],
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Стр. ${currentPage} из ${pageCount}`,
      alignment: "center",
      fontSize: 8,
      color: "#a1a1aa",
      margin: [0, 18, 0, 0],
    }),
    content: markdownToPdfContent(markdown),
    styles: {
      title: { fontSize: 15, bold: true, color: "#18181b" },
      h2: { fontSize: 11.5, bold: true, color: "#27272a" },
      h3: { fontSize: 10, bold: true, color: "#3f3f46" },
      body: { fontSize: 8.5, lineHeight: 1.4, color: "#27272a" },
    },
    defaultStyle: { font: "Roboto", fontSize: 8.5, lineHeight: 1.35, color: "#27272a" },
  };
  return pdfMake.createPdf(docDefinition as never).getBuffer();
}

/** Полный пайплайн: единый report (generateReport) → markdown → PDF. */
export async function generateReportPdf(data: ReportData): Promise<Buffer> {
  return renderMarkdownToPdf(generateReport(data));
}