import { requireReceptionist } from "@/lib/auth";
import { unauthorized } from "next/navigation";

export default async function ReceptionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const receptionist = await requireReceptionist();
  if (!receptionist) unauthorized();
  return children;
}
