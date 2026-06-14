import { LogOut, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LogoutBtn from "./LogoutBtn";

export function AdminHeader({ isLoginPage }: { isLoginPage?: boolean }) {
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
          {!isLoginPage && <LogoutBtn />}
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
