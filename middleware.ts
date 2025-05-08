// pulpitstream/middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware"; // This is your existing session updater
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request); // Updates session, handles cookies

  // Your existing protection for /user routes
  if (request.nextUrl.pathname.startsWith("/user")) {
    const supabase = createServerClient( // Re-create client to check user for THIS request
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
              // Response might already be modified by updateSession, apply to it
              cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
          },
        }
      );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // Potential: Add protection for /admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
     const supabase = createServerClient( // Re-create client
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
         {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
          },
        }
      );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    // Add your admin role check here if doing it in middleware
    // e.g., if (!user.app_metadata?.roles?.includes('admin')) {
    //   return NextResponse.redirect(new URL("/unauthorized", request.url));
    // }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};