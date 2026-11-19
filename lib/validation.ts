import { z } from 'zod';
import { ROLES } from './constants';

export const RoleSchema = z.nativeEnum(ROLES);

export const GitHubUsernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .transform((val) => {
    // Clean GitHub username or URL
    let clean = val.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
    clean = clean.replace(/^git@github\.com:/i, '');
    return clean.split('/')[0].split('?')[0].trim();
  })
  .refine((val) => /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(val), {
    message: 'Invalid GitHub username format'
  });

export const LinkedInUsernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(250)
  .transform((val) => {
    let slug = val;
    if (slug.includes('linkedin.com/in/')) {
      try {
        const url = new URL(slug.startsWith('http') ? slug : `https://${slug}`);
        const parts = url.pathname.split('/').filter(Boolean);
        slug = parts[1] || slug;
      } catch (e) { /* keep as-is */ }
    }
    return slug.split('?')[0].split('/').pop()?.trim() || '';
  });

export const UnifiedAnalyzeSchema = z.object({
  githubUsername: z
    .preprocess((val) => (val === '' || val === undefined ? null : val), GitHubUsernameSchema.nullable())
    .optional(),
  linkedinUsername: z
    .preprocess((val) => (val === '' || val === undefined ? null : val), LinkedInUsernameSchema
      .refine((val) => /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/i.test(val), {
        message: 'Invalid LinkedIn URL or username format'
      })
      .nullable())
    .optional(),
  linkedinText: z.string().trim().max(100000).optional().nullable(),
  resumeText: z.string().trim().max(100000).optional().nullable(),
  jobDescription: z.string().trim().max(50000).optional().nullable(),
  targetRole: RoleSchema.default(ROLES.FRONTEND),
  forceRefresh: z
    .any()
    .transform((val) => val === true || val === 'true')
    .default(false)
});

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000)
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  roleKey: z.string().default('frontend')
});

export const IntelligenceReportRequestSchema = z.object({
  jobDescription: z.string().trim().max(50000).default(''),
  targetRole: RoleSchema.default(ROLES.FRONTEND),
  forceRefresh: z
    .any()
    .transform((val) => val === true || val === 'true')
    .default(false)
});

export const SinglePlatformAnalyzeSchema = z.object({
  username: z.string().trim().optional().nullable(),
  targetRole: RoleSchema.default(ROLES.FRONTEND),
  forceRefresh: z
    .any()
    .transform((val) => val === true || val === 'true')
    .default(false)
});
