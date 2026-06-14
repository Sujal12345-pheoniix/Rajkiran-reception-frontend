"use client";
import React from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";

export default function LogoutBtn() {
  const handleLogout = async () => {
    logout();
    window.location.href = "/auth";
  };
  return (
    <button
      className="rh-button-secondary flex items-center gap-1 rounded-full px-6 py-1 text-sm font-semibold transition-opacity hover:opacity-90"
      type="button"
      onClick={handleLogout}
    >
      <LogOut aria-hidden="true" size={20} strokeWidth={2.25} />
      <span>Logout</span>
    </button>
  );
}
