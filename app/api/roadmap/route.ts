import { withAuth } from '@/lib/auth';
import { responseBuilder } from '@/lib/response';
import { JOB_PROFILES } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';

export const GET = withAuth(async (req, { user, supabase }) => {
  const { searchParams } = new URL(req.url);
  const roleKey = searchParams.get('role') || 'frontend';
  
  // Rate limit check
  await checkRateLimit(supabase, user.id, 'roadmap', 120, 60);

  const profile = JOB_PROFILES[roleKey] || JOB_PROFILES['frontend'];

  const { data: analysis } = await supabase
    .from('analyses')
    .select('github_data, resume_data, linkedin_data')
    .eq('user_id', user.id)
    .maybeSingle();

  let activeGithub = null;
  let activeResume = null;
  let activeLinkedin = null;

  if (analysis) {
    activeGithub = analysis.github_data;
    activeResume = analysis.resume_data;
    activeLinkedin = analysis.linkedin_data;
  }

  const userSkills = new Set<string>();
  if (activeGithub?.languages) activeGithub.languages.forEach((l: any) => l && l.name && userSkills.add(l.name));
  if (activeGithub?.topLanguages) activeGithub.topLanguages.forEach((l: any) => l && userSkills.add(typeof l === 'string' ? l : l.name));
  if (activeResume?.foundKeywords) activeResume.foundKeywords.forEach((kw: string) => kw && userSkills.add(kw));
  if (activeLinkedin?.foundKws) activeLinkedin.foundKws.forEach((kw: string) => kw && userSkills.add(kw));
  if (activeLinkedin?.metrics?.skillMatch >= 70) userSkills.add('LinkedIn Profile Optimization');
  if (userSkills.size === 0) ['React', 'JavaScript', 'HTML', 'CSS', 'Git'].forEach(s => userSkills.add(s));

  const completed: string[] = [];
  const gap: string[] = [];
  
  profile.requiredSkills.forEach((skill: string) => {
    let hasSkill = false;
    userSkills.forEach(us => {
      const usL = us.toLowerCase().replace(/[^a-z0-9]/g, '');
      const skL = skill.toLowerCase().split('/')[0].split('(')[0].replace(/[^a-z0-9]/g, '');
      const skL2 = skill.toLowerCase().includes('/') ? skill.toLowerCase().split('/')[1].split('(')[0].replace(/[^a-z0-9]/g, '') : null;

      if (usL === skL || usL.includes(skL) || skL.includes(usL)) {
        hasSkill = true;
      }
      if (skL2 && (usL === skL2 || usL.includes(skL2) || skL2.includes(usL))) {
        hasSkill = true;
      }
    });
    if (hasSkill) completed.push(skill);
    else gap.push(skill);
  });

  return responseBuilder.success({
    roleTitle: profile.title,
    completed,
    gap,
    completionPercent: Math.round((completed.length / profile.requiredSkills.length) * 100),
    resources: profile.resources
  });
});
