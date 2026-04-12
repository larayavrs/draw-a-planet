import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip intl routing for API routes — next-intl would prefix them with /locale/
  // which breaks all fetch() calls that use plain /api/* paths.
  const isApiRoute = pathname.startsWith("/api/");

  // 1. Run next-intl locale routing (non-API only)
  const intlResponse = isApiRoute ? null : intlMiddleware(request);

  // 2. Refresh Supabase auth session on every request
  const response = intlResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (silently)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files, images, and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|fonts|textures|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
