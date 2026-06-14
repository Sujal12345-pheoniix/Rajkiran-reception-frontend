"use server";

import {
  createPatientRequest,
  getPatientRequest,
  searchPatientRequest,
  extractApiError,
} from "../api-client";
import { getAccessToken } from "../auth";

export type PatientFormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export type PatientFormData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  alternateNumber?: string;
};

// ─── Create Patient ────────────────────────────────────────────────────────────
export async function createPatient(
  _prevState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const rawData = {
    firstName: (formData.get("firstName") as string)?.trim(),
    lastName: (formData.get("lastName") as string)?.trim(),
    dob: formData.get("dob") as string,
    gender: formData.get("gender") as string,
    mobileNumber: (formData.get("mobileNumber") as string)?.trim(),
    email: (formData.get("email") as string)?.trim() || undefined,
    address: (formData.get("address") as string)?.trim() || undefined,
    alternateNumber: (formData.get("alternateNumber") as string)?.trim() || undefined,
  };

  // Client-side validation
  const errors: Record<string, string[]> = {};

  if (!rawData.firstName) errors.firstName = ["First name is required"];
  else if (rawData.firstName.length > 50) errors.firstName = ["First name too long (max 50 chars)"];

  if (!rawData.lastName) errors.lastName = ["Last name is required"];
  else if (rawData.lastName.length > 50) errors.lastName = ["Last name too long (max 50 chars)"];

  if (!rawData.dob) {
    errors.dob = ["Date of birth is required"];
  } else {
    const dob = new Date(rawData.dob);
    if (isNaN(dob.getTime())) errors.dob = ["Invalid date of birth"];
    else if (dob >= new Date()) errors.dob = ["Date of birth must be in the past"];
  }

  if (!rawData.gender) errors.gender = ["Gender is required"];
  else if (!["Male", "Female", "Other"].includes(rawData.gender)) {
    errors.gender = ["Gender must be Male, Female, or Other"];
  }

  if (!rawData.mobileNumber) {
    errors.mobileNumber = ["Mobile number is required"];
  } else if (!/^\d{10}$/.test(rawData.mobileNumber)) {
    errors.mobileNumber = ["Mobile number must be exactly 10 digits"];
  }

  if (rawData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawData.email)) {
    errors.email = ["Invalid email format"];
  }

  if (rawData.alternateNumber && !/^\d{10}$/.test(rawData.alternateNumber)) {
    errors.alternateNumber = ["Alternate number must be exactly 10 digits"];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Get auth token
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      success: false,
      message: "Session expired. Please log in again.",
      errors: {},
    };
  }

  try {
    const res = await createPatientRequest(
      {
        first_name: rawData.firstName!,
        last_name: rawData.lastName!,
        dob: new Date(rawData.dob!).toISOString(),
        gender: rawData.gender!,
        mobile: rawData.mobileNumber!,
        email: rawData.email || undefined,
        address: rawData.address || undefined,
        alternate_mobile: rawData.alternateNumber || undefined,
      },
      accessToken,
    );

    if (res.success) {
      return {
        success: true,
        message: res.data, // unique_id returned from API
      };
    }
    return { success: false, message: "Failed to create patient", errors: {} };
  } catch (e: any) {
    const errorMessage = await extractApiError(e);
    return {
      success: false,
      message: errorMessage,
      errors: {},
    };
  }
}

// ─── Get Patient By ID ─────────────────────────────────────────────────────────
export async function getPatientById(patientId: string): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  if (!patientId) {
    return { success: false, message: "Patient ID is required" };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, message: "Session expired. Please log in again." };
  }

  try {
    const res = await getPatientRequest(patientId, accessToken);
    return { success: res.success, data: res.data };
  } catch (e: any) {
    const message = await extractApiError(e);
    return { success: false, message };
  }
}

// ─── Search Patient ────────────────────────────────────────────────────────────
export async function searchPatient(q: string): Promise<{
  success: boolean;
  data?: any[];
  message?: string;
}> {
  if (!q?.trim()) {
    return { success: false, message: "Search query is required" };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, message: "Session expired. Please log in again." };
  }

  try {
    const res = await searchPatientRequest(q.trim(), accessToken);
    return { success: res.success, data: res.data };
  } catch (e: any) {
    const message = await extractApiError(e);
    return { success: false, message };
  }
}
