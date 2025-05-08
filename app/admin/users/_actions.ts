// app/admin/users/_actions.ts
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Function to get a Supabase client with SERVICE_ROLE_KEY for admin operations
// This uses your existing pattern from utils/supabase/server.ts but explicitly uses the service role key.
// IMPORTANT: Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables
function getAdminSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // THIS IS THE CRITICAL PART for admin actions
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          // Using a try-catch as in your utils/supabase/server.ts
          try {
            (await cookieStore).set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
          }
        },
      },
    }
  );
}

// Action to check if the current user is an administrator
// IMPLEMENT YOUR OWN ROBUST ADMIN CHECK LOGIC HERE
export async function checkAdminAuth() {
  const cookieStore = cookies();
  // Use the standard client (anon key) to get the current user session
  const supabaseUserClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value, ...options });
          } catch (error) {
            // Ignore error
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value: '', ...options });
          } catch (error) {
            // Ignore error
          }
        },
      },
    }
  );

  const { data: { user } } = await supabaseUserClient.auth.getUser();

  if (!user) {
    return { isAdmin: false, error: 'Not authenticated. Please sign in.' };
  }

  // --- THIS IS A PLACEHOLDER ADMIN CHECK ---
  // Replace with your actual admin role verification logic.
  // Example: Check app_metadata for a role (more secure, set server-side by a trusted source)
  // if (user.app_metadata?.roles?.includes('admin')) {
  //  return { isAdmin: true };
  // }
  // Example: Check user_metadata for a role
  // if (user.user_metadata?.role === 'admin') {
  //   return { isAdmin: true };
  // }
  // Example: Check against a list of admin emails (less flexible but simple for small teams)
  // const adminEmails = (process.env.ADMIN_EMAILS || "").split(',');
  // if (user.email && adminEmails.includes(user.email)) {
  //    return { isAdmin: true };
  // }

  // !!! WARNING: The following is INSECURE for a real admin panel. IMPLEMENT PROPER RBAC. !!!
  // For demonstration, allowing if a user is logged in.
  console.warn("Using placeholder admin check in app/admin/users/_actions.ts. Implement proper RBAC for production.");
  if (user) { // Basic check that a user exists. THIS IS NOT AN ADMIN CHECK.
      return { isAdmin: true };
  }
  // --- END PLACEHOLDER ---

  return { isAdmin: false, error: 'You are not authorized to perform this action.' };
}


export async function listAllUsers(page = 1, perPage = 50) {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) {
    console.error("Error listing users:", error.message);
    return { data: null, error: { ...error } };
  }
  return { data, error: null };
}

export async function adminCreateUser(attributes: {
  email?: string;
  password?: string;
  phone?: string;
  email_confirm?: boolean;
  phone_confirm?: boolean;
  user_metadata?: object;
  app_metadata?: object;
  // Add any other valid attributes for supabase.auth.admin.createUser
}) {
  const supabase = getAdminSupabaseClient();
  if (!attributes.email || !attributes.password) {
    return { data: null, error: { message: "Email and password are required for new users." } };
  }
  const { data, error } = await supabase.auth.admin.createUser(attributes);

  if (error) {
    console.error("Error creating user:", error.message);
    return { data: null, error: { ...error } };
  }
  revalidatePath('/admin/users'); // Ensure this path matches your page route
  return { data, error: null };
}

export async function adminUpdateUser(
  userId: string,
  attributes: {
    email?: string;
    phone?: string;
    password?: string; // For changing password
    email_confirm?: boolean;
    phone_confirm?: boolean;
    user_metadata?: object;
    app_metadata?: object;
    // Add any other valid attributes for supabase.auth.admin.updateUserById
  }
) {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase.auth.admin.updateUserById(userId, attributes);

  if (error) {
    console.error("Error updating user:", error.message);
    return { data: null, error: { ...error } };
  }
  revalidatePath('/admin/users'); // Ensure this path matches your page route
  return { data, error: null };
}

export async function adminDeleteUser(userId: string) {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error deleting user:", error.message);
    return { data: null, error: { ...error } };
  }
  revalidatePath('/admin/users'); // Ensure this path matches your page route
  return { data, error: null };
}