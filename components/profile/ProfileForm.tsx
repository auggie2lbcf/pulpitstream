'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { AvatarUploader } from './AvatarUploader';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface ProfileData {
  username: string;
  full_name: string;
  avatar_url: string;
}

interface Props {
  user: User;
}

export default function ProfileForm({ user }: Props) {
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    full_name: '',
    avatar_url: '',
  });
  const [initialProfile, setInitialProfile] = useState<ProfileData | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        setFeedbackMessage({ text: 'Failed to load profile.', type: 'error' });
      } else if (data) {
        setProfile(data);
        setInitialProfile(data);
      }
    };

    fetchProfile();
  }, [supabase, user.id]);

  const validateField = (name: keyof ProfileData, value: string): string | undefined => {
    if (name === 'username') {
      if (!value) return 'Username is required.';
      if (value.length < 3) return 'At least 3 characters.';
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores allowed.';
    }
    if (name === 'full_name' && !value) return 'Full name is required.';
    return undefined;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));

    const error = validateField(name as keyof ProfileData, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));

    if (feedbackMessage) setFeedbackMessage(null);
  };

  const handleAvatarUpload = (url: string) => {
    setProfile(prev => ({ ...prev, avatar_url: url }));
    setFeedbackMessage(null);
  };

  const hasChanges = () => {
    if (!initialProfile) return true;
    return (
      profile.username !== initialProfile.username ||
      profile.full_name !== initialProfile.full_name ||
      profile.avatar_url !== initialProfile.avatar_url
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const errors: typeof formErrors = {};
    (Object.keys(profile) as Array<keyof ProfileData>).forEach(key => {
      const error = validateField(key, profile[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFeedbackMessage({ text: 'Please fix the errors above.', type: 'error' });
      return;
    }

    if (!hasChanges()) {
      setFeedbackMessage({ text: 'No changes to save.', type: 'info' });
      return;
    }

    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      const updates = {
        ...profile,
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) {
        throw error;
      }

      setInitialProfile(profile);
      setFeedbackMessage({ text: 'Profile updated successfully.', type: 'success' });
    } catch (err: any) {
      const message = err?.message || 'Failed to update profile.';
      setFeedbackMessage({ text: message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputBaseClass =
    'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';
  const labelBaseClass = 'block text-sm font-medium text-gray-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 shadow sm:rounded-lg bg-white">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Profile</h2>

      <AvatarUploader initialUrl={profile.avatar_url} onUploadComplete={handleAvatarUpload} />

      <div>
        <label htmlFor="full_name" className={labelBaseClass}>
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={profile.full_name}
          onChange={handleChange}
          className={`${inputBaseClass} ${formErrors.full_name ? 'border-red-500' : ''}`}
        />
        {formErrors.full_name && <p className="mt-1 text-xs text-red-600">{formErrors.full_name}</p>}
      </div>

      <div>
        <label htmlFor="username" className={labelBaseClass}>
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={profile.username}
          onChange={handleChange}
          className={`${inputBaseClass} ${formErrors.username ? 'border-red-500' : ''}`}
        />
        {formErrors.username && <p className="mt-1 text-xs text-red-600">{formErrors.username}</p>}
      </div>

      {feedbackMessage && (
        <div
          className={`p-3 rounded-md text-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : feedbackMessage.type === 'error'
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-blue-100 text-blue-700 border border-blue-300'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md disabled:opacity-50"
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
