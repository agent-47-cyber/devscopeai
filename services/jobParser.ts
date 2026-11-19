import { extractSkillsFromText, uniq } from './fallback';

const RESPONSIBILITY_MARKERS = [
  'build',
  'develop',
  'design',
  'maintain',
  'own',
  'lead',
  'collaborate',
  'optimize',
  'deploy',
  'implement'
];

export function parseJobDescription(jobDescription = '', targetRole = 'frontend') {
  const text = String(jobDescription || '').replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const sentences = text.split(/[.!?]\s+/).map(line => line.trim()).filter(Boolean);
  const skills = extractSkillsFromText(text);
  const responsibilities = uniq(sentences.filter(sentence =>
    RESPONSIBILITY_MARKERS.some(marker => new RegExp(`\\b${marker}\\w*\\b`, 'i').test(sentence))
  )).slice(0, 12);
  const experience = (text.match(/\b\d+\+?\s*(?:years?|yrs?)\b/gi) || []).slice(0, 5);
  const education = uniq(lines.filter(line => /\bdegree|bachelor|master|phd|computer science|engineering\b/i.test(line))).slice(0, 5);
  const preferredSkills = uniq(lines.filter(line => /\bpreferred|nice to have|bonus|plus\b/i.test(line))).slice(0, 8);

  return {
    rawText: text.substring(0, 20000),
    role: lines.find(line => /\b(engineer|developer|architect|analyst|scientist|manager)\b/i.test(line)) || targetRole,
    responsibilities,
    requiredSkills: skills,
    preferredSkills,
    experience,
    education,
    technologies: skills,
    keywords: uniq([...skills, ...experience, targetRole]),
    atsKeywords: uniq([...skills, ...preferredSkills.flatMap(item => extractSkillsFromText(item))]),
    hiringPriorities: responsibilities.slice(0, 5),
    metadata: {
      provided: Boolean(text),
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0
    }
  };
}

export function parseLinkedinText(linkedinText = '', targetRole = 'frontend') {
  const text = String(linkedinText || '').replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const skills = extractSkillsFromText(text);
  const experience = lines.filter(line => /\b(experience|engineer|developer|manager|intern|consultant|architect)\b/i.test(line)).slice(0, 8);
  const education = lines.filter(line => /\b(education|university|college|degree|bachelor|master|phd)\b/i.test(line)).slice(0, 5);
  const certifications = lines.filter(line => /\b(certification|certified|certificate)\b/i.test(line)).slice(0, 5);

  return {
    headline: lines.find(line => /\b(engineer|developer|architect|analyst|scientist|manager)\b/i.test(line)) || `${targetRole} professional`,
    about: text.substring(0, 1500),
    skills,
    experience,
    education,
    certifications,
    recommendations: lines.filter(line => /\brecommend|endorse/i.test(line)).slice(0, 5),
    organizations: lines.filter(line => /\borganization|company|community|group\b/i.test(line)).slice(0, 5),
    industry: targetRole,
    careerProgression: experience,
    profileCompleteness: Math.min(100, 35 + skills.length * 5 + experience.length * 6 + education.length * 4),
    professionalKeywords: uniq([...skills, targetRole]),
    source: 'linkedin_pdf_text'
  };
}
