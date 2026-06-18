"use server";

import { cookies } from "next/headers";
import { cache } from "react";
import {
  authMeRequest,
  logoutRequest,
  receptionistLoginRequest,
  refreshRequest,
  adminLoginRequest,
} from "./api-client";

// ─── Cookie Names (must match backend exactly) ────────────────────────────────
// BUG FIX: Was using "accessToken" / "refreshToken" — backend uses
// "access_token" / "refresh_token". Names must match exactly.
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const ACCESS_TOKEN_OPTIONS = {
  httpOnly: false, // Must be readable by client components / server actions
  secure: true, // Always secure in production / cross-site cookies
  sameSite: "none" as const, // Cross-site cookie support for Vercel + Render
  path: "/",
  maxAge: 10 * 60 * 60, // 10 hours in seconds
};

const REFRESH_TOKEN_OPTIONS = {
  httpOnly: false,
  secure: true,
  sameSite: "none" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
};

// ─── Cookie Token Parser ──────────────────────────────────────────────────────
// BUG FIX: Old code did: headers[0].split(";")[0].split("=")[1]
// This breaks when token contains "=" (base64 JWT always does!).
// Now uses proper cookie header parsing.
function parseSetCookieToken(setCookieHeaders: string[], cookieName: string): string | null {
  for (const header of setCookieHeaders) {
    // Each header looks like: "name=value; Path=/; HttpOnly; ..."
    const parts = header.split(";");
    const nameValue = parts[0].trim();
    const eqIndex = nameValue.indexOf("=");
    if (eqIndex === -1) continue;
    const name = nameValue.slice(0, eqIndex).trim();
    const value = nameValue.slice(eqIndex + 1).trim();
    if (name === cookieName) return value;
  }
  return null;
}

// ─── Cookie Store Helpers ─────────────────────────────────────────────────────
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_KEY, accessToken, ACCESS_TOKEN_OPTIONS);
  cookieStore.set(REFRESH_TOKEN_KEY, refreshToken, REFRESH_TOKEN_OPTIONS);
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_KEY)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_KEY)?.value;
}

function decodeJwt(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Session Verification (cached per request) ────────────────────────────────
// OPTIMIZATION: Decodes JWT payload locally to avoid round-trip network API requests.
export const verifySession = cache(async (): Promise<any | null> => {
  const accessToken = await getAccessToken();

  if (accessToken) {
    const decoded = decodeJwt(accessToken);
    if (decoded) {
      return {
        user_id: decoded.sub,
        username: decoded.username,
        role: decoded.role,
      };
    }
  }

  // Try silent refresh
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await refreshRequest(refreshToken);
    if (!response.ok) return null;

    const setCookies = response.headers.getSetCookie();
    const newAccessToken = parseSetCookieToken(setCookies, ACCESS_TOKEN_KEY);
    const newRefreshToken = parseSetCookieToken(setCookies, REFRESH_TOKEN_KEY);

    if (!newAccessToken || !newRefreshToken) return null;

    await setAuthCookies(newAccessToken, newRefreshToken);
    
    const decoded = decodeJwt(newAccessToken);
    if (decoded) {
      return {
        user_id: decoded.sub,
        username: decoded.username,
        role: decoded.role,
      };
    }
    return null;
  } catch {
    // Refresh failed — clear stale cookies
    await clearAuthCookies();
    return null;
  }
});

// ─── Receptionist Login ───────────────────────────────────────────────────────
export async function login(_prevState: unknown, formData: FormData) {
  const username = formData.get("username")?.toString()?.trim();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }

  try {
    const response = await receptionistLoginRequest({ username, password });

    if (!response.ok) {
      return { success: false, error: "Invalid username or password" };
    }

    const setCookies = response.headers.getSetCookie();
    const accessToken = parseSetCookieToken(setCookies, ACCESS_TOKEN_KEY);
    const refreshToken = parseSetCookieToken(setCookies, REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) {
      return { success: false, error: "Authentication failed. Please try again." };
    }

    await setAuthCookies(accessToken, refreshToken);
    return { success: true };
  } catch (e: any) {
    const errorMessage = await extractErrorMessage(e);
    return { success: false, error: errorMessage };
  }
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
export async function adminLogin(_prevState: unknown, formData: FormData) {
  const username = formData.get("username")?.toString()?.trim();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }

  try {
    const response = await adminLoginRequest({ username, password });

    if (!response.ok) {
      return { success: false, error: "Invalid credentials" };
    }

    const setCookies = response.headers.getSetCookie();
    const accessToken = parseSetCookieToken(setCookies, ACCESS_TOKEN_KEY);
    const refreshToken = parseSetCookieToken(setCookies, REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) {
      return { success: false, error: "Authentication failed. Please try again." };
    }

    await setAuthCookies(accessToken, refreshToken);
    return { success: true };
  } catch (e: any) {
    const errorMessage = await extractErrorMessage(e);
    return { success: false, error: errorMessage };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  try {
    await logoutRequest();
  } catch {
    // Even if API call fails, clear local cookies
  }
  await clearAuthCookies();
  return { success: true };
}

// ─── Role Guards ──────────────────────────────────────────────────────────────
export async function requireReceptionist(): Promise<boolean> {
  const user = await verifySession();
  return !!(user && user.role === "receptionist");
}

export async function requireAdmin(): Promise<boolean> {
  const user = await verifySession();
  return !!(user && user.role === "admin");
}

export async function requireAuth(): Promise<any | null> {
  return await verifySession();
}

// ─── Error Message Extractor ──────────────────────────────────────────────────
// BUG FIX: Was using e?.data?.error — ky errors expose body via e.response
async function extractErrorMessage(e: any): Promise<string> {
  if (e?.response) {
    try {
      const body = await e.response.json();
      return body?.error ?? "An error occurred. Please try again.";
    } catch {
      return "An error occurred. Please try again.";
    }
  }
  if (e?.message) return e.message;
  return "An unexpected error occurred. Please try again.";
}
