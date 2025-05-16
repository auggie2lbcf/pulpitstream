"use client";
import { useEffect, useState } from 'react';
import { createClient } from "@/utils/supabase/client"; // Assuming client supabase instance
import { User } from "@supabase/supabase-js";

interface UserProfile {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    // ... other profile fields
}

export function useUser() {
    const supabase = createClient(); // Get client-side supabase instance
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (currentUser) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url') // Select fields needed by Header/Profile
                    .eq('id', currentUser.id)
                    .single();
                setProfile(profileData as UserProfile | null); // Type assertion might be needed
            } else {
                setProfile(null);
            }
            setIsLoading(false);
        };

        fetchUser();

        // Optional: Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            // Re-fetch profile or update state based on session user if needed
            if (session?.user) {
                supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data: profileData }) => setProfile(profileData as UserProfile | null));
            } else {
                setProfile(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };

    }, [supabase]); // Re-run if supabase instance changes (unlikely)

    return { user, profile, isLoading };
}