"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Dashboard from './Dashboard';
import InputForm from './InputForm';
import { createClient } from '@/utils/supabase/client';

export default function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  const [profileData, setProfileData] = useState({
    githubUsername: '',
    resumeText: '',
    linkedinUsername: '',
    targetRole: 'frontend'
  });

  const [scores, setScores] = useState({
    portfolio: null,
    ats: null,
    github: null,
    careerReady: null
  });

  const [githubAnalysis, setGithubAnalysis] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [linkedinAnalysis, setLinkedinAnalysis] = useState(null);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
          loadUserHistory();
        } else {
          router.push('/');
        }
      })
      .catch((err) => {
        console.error('Failed to authenticate user session:', err);
        router.push('/');
      });
  }, [router]);

  const loadUserHistory = async () => {
    try {
      const response = await fetch(`/api/history`);
      if (response.ok) {
        const raw = await response.json().catch(() => null);
        const data = raw?.data || raw?.analysis || raw;
        if (data) {
          setProfileData({
            githubUsername: data.githubUsername || '',
            resumeText: data.resumeData ? 'Uploaded Resume Details' : '',
            linkedinUsername: data.linkedinUsername || '',
            jobDescription: data.jobDescription || '',
            targetRole: data.targetRole || 'frontend'
          });
          setScores(data.scores || { portfolio: null, ats: null, github: null, careerReady: null });
          setGithubAnalysis(data.githubData || null);
          setResumeAnalysis(data.resumeData || null);
          setLinkedinAnalysis(data.linkedinData || null);
          setIntelligenceData(data.intelligenceData || null);
        }
      }
    } catch (err) {
      console.error('Failed to load user history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUnifiedSubmit = async (payload) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || errData.error || 'Analysis failed.');
      }

      const rawResult = await res.json();
      // Since it's standard response, it might be wrapped or raw. Let's handle both.
      const analysis = rawResult.data || rawResult.analysis || rawResult;

      setProfileData({
        githubUsername: analysis.github_username || '',
        resumeText: analysis.resume_data ? 'Uploaded Resume Details' : '',
        linkedinUsername: analysis.linkedin_url || '',
        jobDescription: analysis.job_description || '',
        targetRole: analysis.target_role || 'frontend'
      });
      setScores(analysis.scores || { portfolio: null, ats: null, github: null, careerReady: null });
      setGithubAnalysis(analysis.github_data || null);
      setResumeAnalysis(analysis.resume_data || null);
      setLinkedinAnalysis(analysis.linkedin_data || null);
      setIntelligenceData(analysis.intelligence_data || null);
    } catch (err) {
      console.error('Unified analysis failed:', err);
      alert(err.message || 'Unified analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout cleanup failed:', err);
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background text-primary">Loading...</div>;
  }

  // If no analysis exists, show unified InputForm directly
  const hasAnalysis = githubAnalysis || resumeAnalysis || linkedinAnalysis;

  if (!hasAnalysis) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-between">
        <InputForm onSubmit={handleUnifiedSubmit} onBack={handleLogout} isLoading={isAnalyzing} />
      </div>
    );
  }

  const dashboardProps = {
    profileData,
    scores,
    githubAnalysis,
    resumeAnalysis,
    linkedinAnalysis,
    intelligenceData,
    onHome: handleLogout, // map Sign Out button to handleLogout
    user,
    setIsAuthenticated
  };

  return <Dashboard {...dashboardProps} />;
}
