/**
 * LinkedIn Provider Abstraction
 * Currently designed to normalize RapidAPI LinkedIn responses into a standard DevScope JSON schema.
 */

export function normalizeLinkedInProfile(rawProfileData) {
  if (!rawProfileData) return null;

  // This handles the standard structure typically returned by generic "LinkedIn Profile Data API" on RapidAPI
  // Adjust these mappings based on the specific provider you end up using.
  return {
    headline: rawProfileData.headline || rawProfileData.position || '',
    about: rawProfileData.summary || rawProfileData.about || '',
    experience: (rawProfileData.experience || rawProfileData.positions || []).map(exp => ({
      title: exp.title || exp.role || '',
      company: exp.companyName || exp.company || '',
      startDate: exp.start?.year ? `${exp.start.month}/${exp.start.year}` : exp.startDate || '',
      endDate: exp.end?.year ? `${exp.end.month}/${exp.end.year}` : exp.endDate || 'Present',
      description: exp.description || ''
    })),
    skills: (rawProfileData.skills || []).map(s => s.name || s),
    education: (rawProfileData.education || []).map(ed => ({
      school: ed.schoolName || ed.school || '',
      degree: ed.degreeName || ed.degree || '',
      field: ed.fieldOfStudy || ''
    })),
    certifications: (rawProfileData.certifications || []).map(c => ({
      name: c.name || '',
      authority: c.authority || ''
    })),
    _resumeKeywords: rawProfileData._resumeKeywords || [],
    _githubLanguages: rawProfileData._githubLanguages || [],
    _selfReport: rawProfileData._selfReport || {}
  };
}
