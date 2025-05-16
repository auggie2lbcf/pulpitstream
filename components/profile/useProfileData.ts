import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface ProfileData {
  username: string;
  full_name: string;
  avatar_url: string;
}

interface UseProfileDataResult {
  user: User | null;
  profile: ProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData | null>>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProfileData(): UseProfileDataResult {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        setError('Authentication failed. Please log in again.');
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setUser(currentUser);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError('Failed to load profile data.');
        setProfile(null);
      } else {
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Unexpected error in useProfileData:', err);
      setError('An unexpected error occurred while loading your profile.');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    user,
    profile,
    setProfile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
