import { useState, useEffect, useCallback } from 'react';
import { UserProfile, RoleModel } from '@/types/mentor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from Supabase or localStorage
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      
      if (user) {
        // Fetch from Supabase for authenticated users
        const { data, error } = await supabase
          .from('profiles')
          .select('name, goals, challenges, role_models, communication_style, onboarding_complete')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          const roleModels: RoleModel[] = Array.isArray(data.role_models) 
            ? (data.role_models as unknown as RoleModel[])
            : [];
          
          setProfile({
            name: data.name || '',
            goals: data.goals || [],
            challenges: data.challenges || [],
            roleModels,
            communicationStyle: (data.communication_style as UserProfile['communicationStyle']) || 'balanced',
            onboardingComplete: data.onboarding_complete || false,
          });
        } else {
          // Fallback to localStorage if no Supabase data
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setProfile(parsed);
              // Sync localStorage data to Supabase
              await syncProfileToSupabase(user.id, parsed);
            } catch {
              setProfile(defaultProfile);
            }
          }
        }
      } else {
        // Use localStorage for non-authenticated users
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setProfile(JSON.parse(stored));
          } catch {
            setProfile(defaultProfile);
          }
        }
      }
      
      setIsLoading(false);
    };

    loadProfile();
  }, [user]);

  // Sync profile to Supabase
  const syncProfileToSupabase = async (userId: string, profileData: UserProfile) => {
    await supabase
      .from('profiles')
      .update({
        name: profileData.name,
        goals: profileData.goals,
        challenges: profileData.challenges,
        role_models: JSON.parse(JSON.stringify(profileData.roleModels)),
        communication_style: profileData.communicationStyle,
        onboarding_complete: profileData.onboardingComplete,
      })
      .eq('id', userId);
  };

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    
    // Save to localStorage (backup)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    
    // Sync to Supabase if authenticated
    if (user) {
      await syncProfileToSupabase(user.id, newProfile);
    }
  }, [profile, user]);

  const resetProfile = useCallback(async () => {
    setProfile(defaultProfile);
    localStorage.removeItem(STORAGE_KEY);
    
    // Reset in Supabase if authenticated
    if (user) {
      await syncProfileToSupabase(user.id, defaultProfile);
    }
  }, [user]);

  return { profile, updateProfile, resetProfile, isLoading };
};
