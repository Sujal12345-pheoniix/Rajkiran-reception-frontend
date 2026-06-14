import type { Metadata } from "next";
import { CalendarDays, RefreshCw, UserPlus } from "lucide-react";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rajkiran Hospital - Home",
  description: "Rajkiran Hospital reception dashboard.",
};

const actions = [
  {
    title: "New Patient",
    description: "Register a new patient profile.",
    icon: UserPlus,
    tone: "primary",
    path: "/reception/new-patient",
  },
  {
    title: "Renew Visit",
    description: "Update or renew an existing visit.",
    icon: RefreshCw,
    tone: "secondary",
    path: "/reception/renew-visit",
  },
  {
    title: "Visit Book",
    description: "Filter and find existing visits.",
    icon: CalendarDays,
    tone: "primarySoft",
    path: "/reception/visit-book",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-foreground">
      <Header activeItem="Home" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 md:px-16">
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-12">
          <div className="mb-20 max-w-2xl text-center">
            <div className="mb-3 flex justify-center">
              <Image
                src="/reference/logo.png"
                alt="Rajkiran Hospital Logo"
                width={501}
                height={498}
                priority
                className="h-56 w-auto object-contain"
              />
            </div>
          </div>

          <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {actions.map((action) => (
              <Link
                className="home-action-card group"
                key={action.title}
                href={action.path}
              >
                <div
                  className={`home-action-icon home-action-icon-${action.tone}`}
                >
                  <action.icon
                    aria-hidden="true"
                    size={40}
                    strokeWidth={2.15}
                  />
                </div>
                <div>
                  <h2 className="mb-1 font-headline-md text-2xl font-semibold leading-8 text-brand-primary transition-colors duration-300 group-hover:text-brand-secondary">
                    {action.title}
                  </h2>
                  <p className="text-base leading-6 text-foreground-muted">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
