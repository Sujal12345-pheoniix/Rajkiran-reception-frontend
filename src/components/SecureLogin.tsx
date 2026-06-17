"use client";

import {
  Eye,
  EyeOff,
  HeartPulse,
  HeartHandshake,
  Lock,
  Monitor,
  Shield,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { useActionState } from "react";
import { login } from "../lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const values = [
  { label: "विश्वास", icon: ShieldCheck },
  { label: "सेवा", icon: HeartHandshake },
  { label: "स्वास्थ्य", icon: HeartPulse },
] satisfies Array<{ label: string; icon: Icon }>;

function RajkiranLogo({
  priority = false,
  variant = "default",
}: {
  priority?: boolean;
  variant?: "default" | "inverted" | "largeInverted";
}) {
  const className =
    variant === "largeInverted"
      ? "rh-logo-large"
      : `rh-logo ${variant === "inverted" ? "brightness-0 invert" : ""}`;

  return (
    <Image
      src="/reference/logo.png"
      alt="Rajkiran Hospital Logo"
      width={501}
      height={498}
      priority={priority}
      className={className}
    />
  );
}

export function SecureLogin() {
  const [state, action, loading] = useActionState(login, undefined);
  const router = useRouter();
  // BUG FIX: Added showPassword state — Eye button previously had no state toggle
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success) router.push("/reception");
  }, [state, router]);

  return (
    <main className="flex min-h-screen w-full flex-col overflow-hidden bg-background font-body-md text-foreground antialiased selection:bg-brand-secondary selection:text-background md:flex-row">
      {/* Left panel */}
      <section className="rh-login-left relative hidden w-full flex-col justify-between overflow-hidden md:flex md:w-1/2 lg:w-[55%] xl:w-[60%]">
        <div className="absolute inset-0 z-0 blur-xs">
          <Image
            src="/reference/bg.png"
            alt="Hospital bg"
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="relative z-10 flex h-full min-h-[calc(100vh-128px)] flex-col justify-between">
          <div className="mb-12 flex justify-center">
            <RajkiranLogo priority variant="largeInverted" />
          </div>
          <div className="flex w-full max-w-lg flex-col gap-6" />
          <div className="mb-12 flex justify-center">
            <div className="flex items-center justify-center rounded-lg p-3" />
          </div>

          <footer className="rh-value-footer medical-shadow grid grid-cols-3">
            {values.map((value, index) => (
              <div
                className={`rh-value-card ${index < values.length - 1 ? "border-r border-border" : ""}`}
                key={index}
              >
                <div className="rh-value-icon">
                  <value.icon aria-hidden="true" size={22} strokeWidth={2.5} />
                </div>
                <span className="text-xl font-semibold leading-5 text-foreground">
                  {value.label}
                </span>
              </div>
            ))}
          </footer>
        </div>
      </section>

      {/* Right panel */}
      <section className="rh-login-right flex min-h-screen w-full flex-col items-center justify-center px-4 py-10 md:w-1/2 md:px-0 lg:w-[45%] xl:w-[40%]">
        <div className="w-full max-w-105">
          <div className="mb-12 flex flex-col items-center text-center">
            <RajkiranLogo priority />
          </div>

          <form className="flex flex-col gap-6" action={action}>
            {/* Error state */}
            {state?.success === false && state?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{state.error}</p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="rh-label" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="rh-input-icon" aria-hidden="true">
                  <Monitor size={20} strokeWidth={2} />
                </div>
                <input
                  className="rh-input pl-10"
                  id="username"
                  name="username"
                  placeholder="Enter Username"
                  required
                  type="text"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="rh-label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="rh-input-icon" aria-hidden="true">
                  <Lock size={20} strokeWidth={2} />
                </div>
                <input
                  className="rh-input pl-10 pr-10"
                  id="password"
                  name="password"
                  placeholder="Enter password"
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                />
                {/* BUG FIX: Eye button now actually toggles password visibility */}
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-muted transition-colors hover:text-foreground"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={20} strokeWidth={2} />
                  ) : (
                    <Eye aria-hidden="true" size={20} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-6">
              <button
                className="rh-button-primary flex w-full items-center justify-center gap-3 rounded-sm py-3 text-sm font-semibold leading-5 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock aria-hidden="true" size={18} strokeWidth={2.25} />
                    Secure Entry
                  </>
                )}
              </button>
              <div className="flex justify-between items-center text-xs">
                <a
                  className="leading-4 text-foreground-muted transition-colors hover:text-brand-primary hover:underline"
                  href="#"
                >
                  IT Support / Forgot Password
                </a>
                <Link
                  className="leading-4 font-bold text-brand-primary transition-colors hover:text-brand-secondary hover:underline flex items-center gap-1"
                  href="/admin/auth"
                >
                  <Shield size={14} className="inline-block" /> Admin Portal
                </Link>
              </div>
            </div>
          </form>

          <div className="rh-card mt-12 bg-surface p-3 text-center">
            <div className="mb-1 flex items-center justify-center gap-1 text-brand-primary">
              <Shield aria-hidden="true" size={16} strokeWidth={2.5} />
              <span className="text-sm font-semibold leading-5">
                Secure Institutional Access
              </span>
            </div>
            <p className="text-xs leading-4 text-foreground-muted">
              This system is restricted to authorized hospital staff. All access
              attempts are logged and monitored in compliance with national
              health data privacy regulations.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
