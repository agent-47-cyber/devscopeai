import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import path from 'path';
import mammoth from 'mammoth';
import { extractPdfText } from '@/lib/parsers/pdf';

export const POST = withAuth(async (req, { user, supabase, requestId }) => {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new ValidationError('No file uploaded.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalname = file.name;
  const ext = path.extname(originalname || '').toLowerCase();

  let extractedText = '';

  // 1. Parse text based on extension / MIME type
  if (ext === '.pdf' || file.type === 'application/pdf') {
    try {
      extractedText = await extractPdfText(buffer);
    } catch (err: any) {
      console.error("PDF Parse Error:", err);
      throw new ValidationError(`Failed to parse PDF file: ${err.message}`);
    }
  } else if (ext === '.docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } catch (err: any) {
      console.error("Word Parse Error:", err);
      throw new ValidationError(`Failed to parse Word document: ${err.message}`);
    }
  } else if (ext === '.txt' || ext === '.md' || file.type.startsWith('text/')) {
    extractedText = buffer.toString('utf-8');
  } else {
    throw new ValidationError('Unsupported file type. Use PDF, DOCX, TXT, or MD.');
  }

  // Sanitize text
  extractedText = extractedText
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{4,}/g, '\n\n')
    .trim();

  if (!extractedText || extractedText.length < 50) {
    throw new ValidationError('Could not extract meaningful text from resume.');
  }

  // 2. Upload to Supabase Storage temporarily
  const filePath = `${user.id}/temp_${Date.now()}_${originalname}`;
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, { contentType: file.type });

  if (uploadError) {
    logger.warn({
      requestId,
      action: 'resume.upload',
      message: `Failed to upload temporary resume: ${uploadError.message}`
    });
  }

  return responseBuilder.success({
    text: extractedText,
    filePath
  });
});
