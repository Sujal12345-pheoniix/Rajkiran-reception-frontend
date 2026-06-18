import { LogOut, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LogoutBtn from "./LogoutBtn";

type NavigationItem = {
  label: string;
  href: string;
};

type HeaderProps = {
  activeItem?: string;
  navigation?: NavigationItem[];
};

const defaultNavigation: NavigationItem[] = [
  { label: "Home", href: "/reception" },
  { label: "New Patient", href: "/reception/new-patient" },
  { label: "Renew Visit", href: "/reception/renew-visit" },
  { label: "Visit Log", href: "/reception/visit-log" },
];

export function Header({
  activeItem = "Home",
  navigation = defaultNavigation,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface text-brand-primary">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 md:px-16">
        <div className="flex items-center gap-3">
          <Link href={"/home"}>
            <Image
              src="/reference/logo.png"
              alt="Rajkiran Hospital Logo"
              width={501}
              height={498}
              priority
              className="h-20 w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-12 text-sm font-semibold leading-5 md:flex">
          {navigation.map((item) => {
            const isActive = item.label === activeItem;

            return (
              <a
                className={
                  isActive
                    ? "border-b-2 border-brand-secondary pb-1 font-bold text-brand-secondary transition-colors hover:text-brand-secondary-strong"
                    : "text-foreground-muted transition-colors hover:text-brand-secondary"
                }
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            );
          })}
          <LogoutBtn />
        </nav>

        <button
          aria-label="Open navigation menu"
          className="text-brand-primary md:hidden"
          type="button"
        >
          <Menu aria-hidden="true" size={24} strokeWidth={2.25} />
        </button>
      </div>
    </header>
  );
}
