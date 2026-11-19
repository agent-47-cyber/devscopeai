import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';

// Set the workerSrc to the absolute path in node_modules so that Node.js/Next.js can import it successfully
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

/**
 * Extracts raw text from a PDF buffer using pdfjs-dist.
 * Replaces pdf-parse to handle 'bad XRef entry' issues with modern PDFs.
 * 
 * @param buffer The raw PDF file buffer
 * @returns Extracted text with whitespace and page order preserved
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  
  // Disable font rendering & workers since we only care about text extraction
  // useSystemFonts bypasses fetching standard fonts remotely
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0, // silent errors internally
    // @ts-ignore - Required for Next.js API route to prevent it from loading the external worker file
    disableWorker: true
  });
  
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  let fullText = '';
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    // Ignore forms, annotations, and images by extracting only text content
    const textContent = await page.getTextContent();
    
    let lastY: number | undefined = undefined;
    let pageText = '';
    
    for (const item of textContent.items) {
      if ('str' in item) {
        // PDF transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
        const currentY = item.transform[5];
        
        // If Y coordinate changes significantly, treat as a newline
        // This preserves structural layout (paragraphs, distinct lines)
        if (lastY !== undefined && Math.abs(lastY - currentY) > 5) {
          pageText += '\n';
        } 
        
        pageText += item.str;
        lastY = currentY;
      }
    }
    
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}
