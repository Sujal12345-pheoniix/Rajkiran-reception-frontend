"use client";

import { useActionState } from "react";
import { User, Lock, LogIn, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/adminAuth";
import Image from "next/image";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 bg-gray-100 w-full">
      <Image
        src="/reference/logo.png"
        alt="Rajkiran Hospital Logo"
        width={201}
        height={0}
        priority
      />
      <div className="rounded-lg p-5 border bg-white max-w-lg ">
        <div className="">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to access the dashboard
            </p>
          </div>

          {/* Global error */}
          {state?.error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-4" noValidate>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  defaultValue=""
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                  placeholder="Enter your username"
                  disabled={pending}
                />
              </div>
              {state?.fieldErrors?.username && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  defaultValue=""
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                  placeholder="Enter your password"
                  disabled={pending}
                />
              </div>
              {state?.fieldErrors?.password && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 p-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
