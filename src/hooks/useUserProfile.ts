import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/mentor';

const STORAGE_KEY = 'ai_mentor_profile';

const defaultProfile: UserProfile = {
  name: '',
  goals: [],
  challenges: [],
  roleModels: [],
  communicationStyle: 'balanced',
  onboardingComplete: false,
};

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        setProfile(defaultProfile);
      }
    }
    setIsLoading(false);
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { profile, updateProfile, resetProfile, isLoading };
};
