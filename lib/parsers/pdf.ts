import pdfParse from 'pdf-parse';

/** Extracts resume text with pdf-parse's Node-compatible bundled PDF.js build. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text || '';
}
