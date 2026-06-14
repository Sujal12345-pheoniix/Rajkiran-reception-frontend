import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rajkiran Hospital - Secure Login",
  description: "Secure reception workstation access for Rajkiran Hospital.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

// deptrecep_1781041406654
