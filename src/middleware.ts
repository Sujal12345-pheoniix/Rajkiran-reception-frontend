import { NextResponse, type NextRequest } from "next/server";

// Route protection configuration
const PROTECTED_ROUTES = {
  "/admin": "admin",
  "/reception": "receptionist",
} as const;

const AUTH_ROUTES = ["/auth", "/admin/auth"];
const PUBLIC_ROUTES = ["/", "/unauthorized"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and Next.js internals
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/reference") ||
    pathname.includes("favicon")
  ) {
    return NextResponse.next();
  }

  // Get access token from cookie (matches backend cookie name exactly)
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // If on auth page and already logged in, redirect to appropriate dashboard
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && accessToken) {
    // Could decode token here to get role without API call
    return NextResponse.next();
  }

  // If no tokens at all, redirect to login (only if not already on an auth route)
  if (!accessToken && !refreshToken) {
    const isAlreadyAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
    if (!isAlreadyAuthRoute) {
      const isAdminRoute = pathname.startsWith("/admin");
      const loginUrl = isAdminRoute ? "/admin/auth" : "/auth";
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|reference/).*)",
  ],
};
