import ky, { type KyInstance, type KyResponse } from "ky";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  user_id: string;
  username: string;
  role: string;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
}

export interface Patient {
  patient_id: string;
  unique_id: string;
  first_name: string;
  last_name: string;
  dob: Date;
  gender: string;
  mobile: string;
  email: string | null;
  address: string | null;
  alternate_mobile: string | null;
  created_at: Date;
}

export interface Doctor {
  doctor_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  consultation_fee: number;
  status: string;
  department_id: string;
}

export interface Department {
  department_id: string;
  name: string;
  status: string;
  doctors: Doctor[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Base URL ─────────────────────────────────────────────────────────────────
const API_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api")
    : "http://localhost:3001/api";

// ─── API Client ───────────────────────────────────────────────────────────────
export const api: KyInstance = ky.create({
  prefix: API_BASE,
  headers: { "Content-Type": "application/json" },
  throwHttpErrors: true,
  credentials: "include",
  timeout: 30000,
  retry: 0, // Don't auto-retry — let our refresh logic handle it
} as any);

// ─── Auth Endpoints ───────────────────────────────────────────────────────────
export const receptionistLoginRequest = (data: {
  username: string;
  password: string;
}): Promise<KyResponse> => {
  return api.post("auth/reception/login", { json: data });
};

export const adminLoginRequest = (data: {
  username: string;
  password: string;
}): Promise<KyResponse> => {
  return api.post("auth/login", { json: data });
};

// BUG FIX: Was sending refresh_token in Authorization header.
// Backend reads it from the cookie — credentials:"include" handles this.
export const refreshRequest = (): Promise<KyResponse> => {
  return api.post("auth/refresh");
};

export const logoutRequest = (): Promise<KyResponse> => {
  return api.post("auth/logout");
};

export const authMeRequest = async (accessToken: string): Promise<User> => {
  return api
    .get("auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<User>();
};

// ─── Patient Endpoints ────────────────────────────────────────────────────────
export type PatientCreateData = {
  first_name: string;
  last_name: string;
  dob: Date | string;
  gender: string;
  mobile: string;
  email?: string;
  address?: string;
  alternate_mobile?: string;
};

export const createPatientRequest = (
  patientData: PatientCreateData,
  accessToken: string,
): Promise<ApiResponse<string>> => {
  return api
    .post("patient", {
      json: patientData,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<string>>();
};

export const getPatientRequest = (
  patientId: string,
  accessToken: string,
): Promise<ApiResponse<Patient>> => {
  return api
    .get(`patient/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<Patient>>();
};

// BUG FIX: Was calling api.get("/") — wrong endpoint, returns 404.
// Fixed to "patient" endpoint with proper pagination params.
export const getPatientsRequest = (
  page: number,
  limit: number,
  accessToken: string,
): Promise<ApiResponse<Patient[]>> => {
  return api
    .get("patient", {
      searchParams: { page, limit },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<Patient[]>>();
};

export const searchPatientRequest = (
  query: string,
  accessToken: string,
): Promise<ApiResponse<Patient[]>> => {
  return api
    .get(`patient/search/${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<Patient[]>>();
};

// ─── Department & Doctor Endpoints ────────────────────────────────────────────
export const getDepartmentsRequest = (
  accessToken: string,
): Promise<ApiResponse<Department[]>> => {
  return api
    .get("department", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<Department[]>>();
};

export const getDoctorsByDepartmentRequest = (
  departmentId: string,
  accessToken: string,
): Promise<ApiResponse<Doctor[]>> => {
  return api
    .get(`doctor/${departmentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<Doctor[]>>();
};

export const getAllDoctorsWithDepartmentsRequest = (
  accessToken: string,
): Promise<ApiResponse<Department[]>> => {
  return api
    .get("doctor", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<Department[]>>();
};

// ─── Visit Endpoints ──────────────────────────────────────────────────────────
export type VisitCreateData = {
  visit: {
    patientId: string;
    doctorId: string;
    visit_type: "OPD" | "IPD";
  };
  vital: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  bill: {
    extra_charge?: number;
    payment_status?: string;
    payment_method?: string;
  };
};

export const createVisitRequest = (
  visitData: VisitCreateData,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .post("visit", {
      json: visitData,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const getVisitsRequest = (
  params: { page?: number; limit?: number; date?: string; doctor_id?: string },
  accessToken: string,
): Promise<ApiResponse<any[]>> => {
  return api
    .get("visit", {
      searchParams: params as Record<string, string | number>,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any[]>>();
};

// ─── Analytics Endpoint ────────────────────────────────────────────────────────
export const getAnalyticsRequest = (accessToken: string): Promise<ApiResponse<any>> => {
  return api
    .get("analytics", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

// ─── Error Helper ─────────────────────────────────────────────────────────────
export async function extractApiError(e: any): Promise<string> {
  if (e?.response) {
    try {
      const body = await e.response.json();
      return body?.error ?? "Request failed";
    } catch {
      return `Request failed with status ${e.response.status}`;
    }
  }
  if (e?.message) return e.message;
  return "An unexpected error occurred";
}