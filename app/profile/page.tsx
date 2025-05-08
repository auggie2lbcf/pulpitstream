'use client';

import { useEffect, useState, useCallback, FormEvent, ChangeEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeftIcon, ArrowUpIcon, CameraIcon } from 'lucide-react';

// ... (ProfileData, FeedbackMessage, generateUniqueFileName interfaces/functions from previous code)
interface ProfileData {
    username: string;
    full_name: string;
    // website: string;
    avatar_url: string;
}

interface FeedbackMessage {
    text: string;
    type: 'success' | 'error' | 'info';
}

const generateUniqueFileName = (originalName: string) => {
    const extension = originalName.split('.').pop();
    return `avatar-${Date.now()}-${Math.random().toString(36).substring(2,9)}.${extension}`;
}


export default function ProfilePage() {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfileData>({
        username: '',
        full_name: '',
        // website: '',
        avatar_url: '',
    });
    const [initialProfile, setInitialProfile] = useState<ProfileData | null>(null);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});

    // --- Make sure this validateField function is also present ---
    const validateField = (name: keyof ProfileData, value: string): string | undefined => {
        if (name === 'username') {
            if (!value) return 'Username is required.';
            if (value.length < 3) return 'Username must be at least 3 characters long.';
            if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores.';
        }
        if (name === 'full_name' && !value) return 'Full Name is required.';
        // if (name === 'username' && value) {
        //     try { new URL(value); } catch (_) { return 'Please enter a valid URL for the website.'; }
        // }
        return undefined;
    };
    // --- End validateField ---


    // VVVVVV THIS IS THE handleChange FUNCTION VVVVVV
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target as { name: keyof ProfileData; value: string };
        setProfile(prevProfile => ({ ...prevProfile, [name]: value }));

        // Validate on change for immediate feedback, except for avatar_url which is special
        if (name !== 'avatar_url') {
            const error = validateField(name, value);
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: error }));
        }

        // Clear general feedback message on input change
        if (feedbackMessage) setFeedbackMessage(null);
    };
    // ^^^^^^ END OF handleChange FUNCTION ^^^^^^

    // ... (Rest of the functions: getProfile, handleAvatarFileChange, uploadAvatarToR2, hasProfileChanged, handleSubmit)
    // Make sure they are all present from the previous response. For brevity, I'm not re-pasting all of them here.

    const getProfile = useCallback(async () => {
        setIsLoading(true);
        setFeedbackMessage(null);
        try {
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            if (userError || !currentUser) {
                setFeedbackMessage({ text: 'Could not authenticate user. Please log in again.', type: 'error' });
                setIsLoading(false); return;
            }
            setUser(currentUser);
            const { data, error: profileError, status } = await supabase
                .from('profiles')
                .select('username, full_name, avatar_url')
                .eq('id', currentUser.id)
                .single();

            if (profileError && status !== 406) {
                console.error('Error loading profile:', profileError);
                setFeedbackMessage({ text: 'Error loading your profile. Please try again later.', type: 'error' });
            } else if (data) {
                setProfile(data);
                setInitialProfile(data);
                if (data.avatar_url) setAvatarPreview(data.avatar_url);
            } else {
                setInitialProfile({ username: '', full_name: '', avatar_url: '' });
            }
        } catch (error) {
            console.error('Unexpected error in getProfile:', error);
            setFeedbackMessage({ text: 'An unexpected error occurred while fetching your profile.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        getProfile();
    }, [getProfile]);

    const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setFeedbackMessage({ text: 'File is too large. Maximum 5MB allowed.', type: 'error'});
                setFormErrors(prev => ({ ...prev, avatar_url: 'File too large.' }));
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
                setFeedbackMessage({ text: 'Invalid file type. Please select an image (JPG, PNG, WEBP, GIF).', type: 'error'});
                setFormErrors(prev => ({ ...prev, avatar_url: 'Invalid file type.' }));
                return;
            }
            setSelectedAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setFormErrors(prev => ({ ...prev, avatar_url: undefined }));
            setFeedbackMessage(null);
        } else {
            setSelectedAvatarFile(null);
            setAvatarPreview(profile.avatar_url || null);
        }
    };

    async function uploadAvatarToR2(file: File): Promise<string> {
        setIsUploading(true);
        setFeedbackMessage({ text: 'Uploading avatar...', type: 'info' });
        // ** START: REPLACE WITH YOUR ACTUAL R2 UPLOAD LOGIC **
        console.log(`Simulating R2 upload for: ${file.name}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const simulatedR2ObjectUrl = `https://pic.pulpitstream.com/avatars/${generateUniqueFileName(file.name)}`;
        console.log(`Simulated R2 URL: ${simulatedR2ObjectUrl}`);
        // ** END: REPLACE WITH YOUR ACTUAL R2 UPLOAD LOGIC **
        setIsUploading(false);
        return simulatedR2ObjectUrl;
    }

    const hasProfileChanged = () => {
        if (selectedAvatarFile) return true;
        if (!initialProfile && profile) return true;
        if (!initialProfile) return false;
        for (const key in profile) {
            if (profile[key as keyof ProfileData] !== initialProfile[key as keyof ProfileData]) {
                return true;
            }
        }
        return false;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isUploading) {
            setFeedbackMessage({text: "Please wait for the upload to complete.", type: "info"});
            return;
        }
        setFeedbackMessage(null); setFormErrors({});
        let currentFormErrors: Partial<Record<keyof ProfileData, string>> = {};
        (Object.keys(profile) as Array<keyof ProfileData>).forEach(key => {
            if (key === 'avatar_url') return;
            const error = validateField(key, profile[key]);
            if (error) currentFormErrors[key] = error;
        });

        if (Object.keys(currentFormErrors).length > 0) {
            setFormErrors(currentFormErrors);
            setFeedbackMessage({ text: 'Please correct the highlighted errors.', type: 'error' });
            return;
        }
        if (!user) {
            setFeedbackMessage({ text: 'User not authenticated.', type: 'error' }); return;
        }

        let finalAvatarUrl = profile.avatar_url;

        try {
            if (selectedAvatarFile) {
                finalAvatarUrl = await uploadAvatarToR2(selectedAvatarFile);
            }

            if (!hasProfileChanged() && finalAvatarUrl === initialProfile?.avatar_url && !selectedAvatarFile) {
                setFeedbackMessage({ text: 'No changes to save.', type: 'info' });
                return;
            }

            setIsSaving(true);
            const updates = {
                ...profile,
                avatar_url: finalAvatarUrl,
                id: user.id,
                updated_at: new Date().toISOString(),
            };

            const { error: upsertError } = await supabase.from('profiles').upsert(updates);
            if (upsertError) throw upsertError;

            setFeedbackMessage({ text: 'Profile updated successfully!', type: 'success' });
            setProfile(prev => ({...prev, avatar_url: finalAvatarUrl}));
            setInitialProfile(prev => ({...(prev || profile), ...updates}));
            setSelectedAvatarFile(null);
            if (finalAvatarUrl) setAvatarPreview(finalAvatarUrl);

        } catch (error: any) {
            console.error('Error processing profile update:', error);
            setFeedbackMessage({ text: `Error updating profile: ${error.message || 'Unknown error'}`, type: 'error' });
            if (error.message?.includes('profiles_username_key')) {
                setFormErrors(prev => ({ ...prev, username: 'This username is already taken.' }));
            }
        } finally {
            setIsSaving(false);
            setIsUploading(false);
        }
    };


    // ... (isLoading conditional return and JSX for the form)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading profile...</p>
            </div>
        );
    }

    const inputBaseClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const labelBaseClass = "block text-sm font-medium text-gray-700";


    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center">
                 <button onClick={() => window.history.back()} className="p-2 mr-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">Edit Profile</h1>
            </div>

            {feedbackMessage && (
                <div className={`p-3 rounded-md mb-4 text-sm ${feedbackMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : feedbackMessage.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                    {feedbackMessage.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
                {/* Avatar Upload Section */}
                <div>
                    <p className={labelBaseClass}>Profile Picture</p>
                    <div className="mt-2 flex items-center space-x-4">
                        <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
                            ) : (
                                <CameraIcon className="h-full w-full text-gray-300" />
                            )}
                        </span>
                        <label htmlFor="avatar-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <ArrowUpIcon className="w-5 h-5 mr-2 inline-block align-text-bottom" />
                            <span>{selectedAvatarFile ? "Change image" : "Upload image"}</span>
                            <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarFileChange} />
                        </label>
                        {selectedAvatarFile && (
                            <button type="button" onClick={() => { setSelectedAvatarFile(null); setAvatarPreview(profile.avatar_url || null); }} className="text-sm text-gray-600 hover:text-gray-900">
                                Cancel
                            </button>
                        )}
                    </div>
                    {formErrors.avatar_url && <p className="mt-1 text-xs text-red-600">{formErrors.avatar_url}</p>}
                    {isUploading && <p className="mt-1 text-sm text-blue-600">Uploading image, please wait...</p>}
                     <p className="mt-1 text-xs text-gray-500">Max file size: 5MB. Allowed types: JPG, PNG, WEBP, GIF.</p>
                </div>

                <div>
                    <label htmlFor="full_name" className={labelBaseClass}>Full Name</label>
                    <input id="full_name" name="full_name" type="text" value={profile.full_name} onChange={handleChange} className={`${inputBaseClass} ${formErrors.full_name ? 'border-red-500' : ''}`} required />
                    {formErrors.full_name && <p className="mt-1 text-xs text-red-600">{formErrors.full_name}</p>}
                </div>

                <div>
                    <label htmlFor="username" className={labelBaseClass}>Username</label>
                    <input id="username" name="username" type="text" value={profile.username} onChange={handleChange} className={`${inputBaseClass} ${formErrors.username ? 'border-red-500' : ''}`} required />
                    {formErrors.username && <p className="mt-1 text-xs text-red-600">{formErrors.username}</p>}
                </div>
{/* 
                <div>
                    <label htmlFor="website" className={labelBaseClass}>Website</label>
                    <input id="website" name="website" type="url" value={profile.website} onChange={handleChange} className={`${inputBaseClass} ${formErrors.website ? 'border-red-500' : ''}`} placeholder="https://example.com" />
                    {formErrors.website && <p className="mt-1 text-xs text-red-600">{formErrors.website}</p>}
                </div> */}

                {profile.avatar_url && (
                    <div>
                        <label htmlFor="avatar_url_display" className={labelBaseClass}>Current Avatar URL (from R2)</label>
                        <input id="avatar_url_display" name="avatar_url_display" type="text" value={profile.avatar_url} readOnly className={`${inputBaseClass} bg-gray-50 text-gray-500 cursor-not-allowed`} />
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        disabled={isSaving || isLoading || isUploading}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}