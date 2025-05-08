// app/admin/users/_actions.ts
'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Function to get a Supabase client with SERVICE_ROLE_KEY for admin operations
// IMPORTANT: Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables
function getAdminSupabaseClient() {
  const cookieStore = cookies(); // Required by createServerClient, even if not always used for service role
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // THIS IS THE CRITICAL PART
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
      // Optional: auth: { persistSession: false } // Service role doesn't rely on user sessions
    }
  );
}

// Action to check if the current user is an administrator
// IMPLEMENT YOUR OWN ROBUST ADMIN CHECK LOGIC HERE
export async function checkAdminAuth() {
  const cookieStore = cookies();
  const supabaseUserClient = createServerClient( // Regular client to get current user
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* ... cookie handlers as above ... */ get(name: string) {return cookieStore.get(name)?.value;},set(name: string, value: string, options: CookieOptions) {cookieStore.set({ name, value, ...options });},remove(name: string, options: CookieOptions) {cookieStore.delete({ name, ...options });} } }
  );

  const { data: { user } } = await supabaseUserClient.auth.getUser();

  if (!user) {
    return { isAdmin: false, error: 'Not authenticated. Please sign in.' };
  }

  // --- THIS IS A PLACEHOLDER ADMIN CHECK ---
  // Replace with your actual admin role verification logic.
  // For example, check a custom claim, user_metadata, or a separate admin table.
  // Option 1: Check user_metadata for a role (ensure metadata is set by a trusted source)
  // if (user.user_metadata?.role === 'admin') {
  //   return { isAdmin: true };
  // }
  // Option 2: Check app_metadata for a role (more secure, usually set server-side)
  // if (user.app_metadata?.roles?.includes('admin')) {
  //  return { isAdmin: true };
  // }
  // Option 3: Check against a list of admin emails (less flexible)
  // const adminEmails = (process.env.ADMIN_EMAILS || "").split(',');
  // if (user.email && adminEmails.includes(user.email)) {
  //    return { isAdmin: true };
  // }

  // For this example, we'll allow if a user is logged in.
  // !!! WARNING: THIS IS INSECURE FOR A REAL ADMIN PANEL. IMPLEMENT PROPER RBAC. !!!
  console.warn("Using placeholder admin check. Implement proper RBAC for production.");
  return { isAdmin: true };
  // --- END PLACEHOLDER ---

  // return { isAdmin: false, error: 'You are not authorized to perform this action.' };
}


export async function listAllUsers(page = 1, perPage = 50) {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) {
    console.error("Error listing users:", error.message);
    return { data: null, error: { message: error.message, ...error } };
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
  // Ensure required fields are present for creation
  if (!attributes.email || !attributes.password) {
    return { data: null, error: { message: "Email and password are required for new users." } };
  }
  const { data, error } = await supabase.auth.admin.createUser(attributes);

  if (error) {
    console.error("Error creating user:", error.message);
    return { data: null, error: { message: error.message, ...error } };
  }
  revalidatePath('/admin/users'); // Adjust path if your page is elsewhere
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
    return { data: null, error: { message: error.message, ...error } };
  }
  revalidatePath('/admin/users'); // Adjust path
  return { data, error: null };
}

export async function adminDeleteUser(userId: string) {
  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error deleting user:", error.message);
    return { data: null, error: { message: error.message, ...error } };
  }
  revalidatePath('/admin/users'); // Adjust path
  return { data, error: null };
}