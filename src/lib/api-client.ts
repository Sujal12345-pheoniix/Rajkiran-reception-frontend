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
  blood_group: string | null;
  chronic_conditions: string[];
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
  mobile: string;
  email: string;
}

export interface Department {
  department_id: string;
  name: string;
  status: string;
  description?: string;
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
  timeout: 60000, // 60 seconds tolerance for cold starts
  retry: {
    limit: 2,
    methods: ["get", "post", "put", "patch", "delete"],
    statusCodes: [408, 504],
  },
  hooks: {
    afterResponse: [
      async ({ request, response }) => {
        if (response.status === 401 && !request.url.includes("auth/refresh") && !request.url.includes("auth/login")) {
          try {
            const refreshRes = await ky.post(`${API_BASE}/auth/refresh`, { credentials: "include" });
            if (refreshRes.ok) {
              return ky(request);
            }
          } catch (err) {
            console.error("Silent refresh failed:", err);
            if (typeof window !== "undefined") {
              window.location.href = window.location.pathname.startsWith("/admin") ? "/admin/auth" : "/auth";
            }
          }
        }
        return response;
      }
    ]
  }
});

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

export const refreshRequest = (refreshToken?: string): Promise<KyResponse> => {
  return api.post("auth/refresh", {
    headers: refreshToken ? { Cookie: `refresh_token=${refreshToken}` } : undefined,
  });
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
  blood_group?: string;
  chronic_conditions?: string[];
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

export const deletePatientRequest = (
  patientId: string,
  permanent: boolean,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .delete(`patient/${patientId}`, {
      searchParams: { permanent: String(permanent) },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const getPatientImpactRequest = (
  patientId: string,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .get(`patient/${patientId}/impact`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
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

export const createDoctorRequest = (
  data: any,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .post("doctor", {
      json: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const updateDoctorRequest = (
  doctorId: string,
  data: any,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .patch(`doctor/${doctorId}`, {
      json: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const deleteDoctorRequest = (
  doctorId: string,
  permanent: boolean,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .delete(`doctor/${doctorId}`, {
      searchParams: { permanent: String(permanent) },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const createDepartmentRequest = (
  data: any,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .post("department", {
      json: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const updateDepartmentRequest = (
  departmentId: string,
  data: any,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .patch(`department/${departmentId}`, {
      json: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const deleteDepartmentRequest = (
  departmentId: string,
  permanent: boolean,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .delete(`department/${departmentId}`, {
      searchParams: { permanent: String(permanent) },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

// ─── User Management Endpoints ───────────────────────────────────────────────
export const getUsersRequest = (
  page: number,
  limit: number,
  accessToken: string,
): Promise<ApiResponse<User[]>> => {
  return api
    .get("users", {
      searchParams: { page, limit },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<User[]>>();
};

export const createUserRequest = (
  data: any,
  accessToken: string,
): Promise<ApiResponse<User>> => {
  return api
    .post("users", {
      json: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<User>>();
};

export const updateUserRequest = (
  userId: string,
  data: any,
  accessToken: string,
): Promise<ApiResponse<User>> => {
  return api
    .patch(`users/${userId}`, {
      json: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<User>>();
};

export const deleteUserRequest = (
  userId: string,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .delete(`users/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const resetUserPasswordRequest = (
  userId: string,
  data: any,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .post(`users/${userId}/reset-password`, {
      json: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

// ─── Database Backup / Restore Endpoints ──────────────────────────────────────
export const backupDatabaseRequest = (
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .post("analytics/backup", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const restoreDatabaseRequest = (
  data: any,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .post("analytics/restore", {
      json: { data },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

// ─── Visit Endpoints ──────────────────────────────────────────────────────────
export type VisitCreateData = {
  visit: {
    patientId: string;
    doctorId: string;
    visit_type: "OPD" | "IPD";
    symptoms?: string[];
    known_diseases?: string[];
    chief_complaint?: string;
    visit_notes?: string;
  };
  vital: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygen_saturation?: number;
    respiratory_rate?: number;
    blood_sugar?: number;
    pain_scale?: number;
  };
  bill: {
    consultation_fee?: number;
    registration_fee?: number;
    tests_fee?: number;
    medicines_fee?: number;
    extra_charge?: number;
    tax?: number;
    discount?: number;
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

export const updateVisitRequest = (
  visitId: string,
  data: any,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .patch(`visit/${visitId}`, {
      json: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const deleteVisitRequest = (
  visitId: string,
  permanent: boolean,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .delete(`visit/${visitId}`, {
      searchParams: { permanent: String(permanent) },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

// ─── Analytics Endpoint ────────────────────────────────────────────────────────
export const getAnalyticsRequest = (accessToken: string): Promise<ApiResponse<any>> => {
  return api
    .get("analytics", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any>>();
};

export const getAuditLogsRequest = (accessToken: string): Promise<ApiResponse<any[]>> => {
  return api
    .get("analytics/logs", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any[]>>();
};

export const getBillsReportRequest = (accessToken: string): Promise<ApiResponse<any[]>> => {
  return api
    .get("analytics/bills", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<any[]>>();
};

export const logPatientDownloadRequest = (
  patientId: string,
  accessToken: string,
): Promise<ApiResponse<boolean>> => {
  return api
    .post(`patient/${patientId}/log-download`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<ApiResponse<boolean>>();
};

export const updatePatientRequest = (
  patientId: string,
  data: any,
  accessToken: string,
): Promise<ApiResponse<any>> => {
  return api
    .patch(`patient/${patientId}`, {
      json: data,
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