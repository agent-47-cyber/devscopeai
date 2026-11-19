"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (user) {
          setUser(user);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch user session on home page:', err);
      });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <LandingPage 
      user={user} 
      onLogout={handleLogout} 
    />
  );
}
