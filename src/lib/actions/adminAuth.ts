"use server";

import { redirect } from "next/navigation";
import { adminLogin } from "../auth";

export type LoginState = {
  error?: string;
  fieldErrors?: { username?: string; password?: string };
} | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = await adminLogin(_prev, formData);

  if (!result.success) {
    return { error: result.error ?? "Login failed. Please try again." };
  }

  redirect("/admin/dashboard");
}
