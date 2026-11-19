/**
 * LinkedIn Provider Abstraction
 * Normalizes RapidAPI LinkedIn responses into a standard DevScope JSON schema.
 */

export function normalizeLinkedInProfile(rawProfileData: any): any {
  if (!rawProfileData) return null;

  return {
    headline: rawProfileData.headline || rawProfileData.position || '',
    about: rawProfileData.summary || rawProfileData.about || '',
    experience: (rawProfileData.experience || rawProfileData.positions || []).map((exp: any) => ({
      title: exp.title || exp.role || '',
      company: exp.companyName || exp.company || '',
      startDate: exp.start?.year ? `${exp.start.month}/${exp.start.year}` : exp.startDate || '',
      endDate: exp.end?.year ? `${exp.end.month}/${exp.end.year}` : exp.endDate || 'Present',
      description: exp.description || ''
    })),
    skills: (rawProfileData.skills || []).map((s: any) => s.name || s),
    education: (rawProfileData.education || []).map((ed: any) => ({
      school: ed.schoolName || ed.school || '',
      degree: ed.degreeName || ed.degree || '',
      field: ed.fieldOfStudy || ''
    })),
    certifications: (rawProfileData.certifications || []).map((c: any) => ({
      name: c.name || '',
      authority: c.authority || ''
    })),
    _resumeKeywords: rawProfileData._resumeKeywords || [],
    _githubLanguages: rawProfileData._githubLanguages || [],
    _selfReport: rawProfileData._selfReport || {}
  };
}
