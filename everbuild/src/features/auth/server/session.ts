import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath } from "../lib/redirects";
import { ANON_SESSION_COOKIE, ANON_SESSION_MAX_AGE_SECONDS } from "../lib/session";

/**
 * Runs in src/proxy.ts. Refreshes the Supabase session cookie and does an
 * optimistic redirect for signed-out visitors on private pages. Also assigns an
 * anonymous session id used to debounce project view counts. Real
 * authorization still happens in server code (see ./viewer.ts).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (!request.cookies.get(ANON_SESSION_COOKIE)) {
    response.cookies.set(ANON_SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: ANON_SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
  }

  return response;
}
