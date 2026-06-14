"use server";

import { createVisitRequest, extractApiError, type VisitCreateData } from "../api-client";
import { getAccessToken } from "../auth";

export type VisitFormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: any;
};

// ─── Create Visit ─────────────────────────────────────────────────────────────
// BUG FIX: Was a stub with a fake setTimeout. Now calls the real API.
// BUG FIX: Removed bad import { errorToJSON } from "next/dist/server/render"
export async function createVisit(
  _prevState: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  // Extract form data
  const bloodPressure = formData.get("bloodPressure") as string;
  const heartRate = formData.get("heartRate") as string;
  const temperature = formData.get("temperature") as string;
  const weight = formData.get("weight") as string;
  const height = formData.get("height") as string;
  const assignmentType = (formData.get("assignmentType") as string) || "OPD";
  const doctorId = formData.get("doctorId") as string;
  const patientId = formData.get("patientId") as string;
  const extraCharge = formData.get("extraCharge") as string;
  const paymentMethod = (formData.get("paymentMethod") as string) || "cash";
  const paymentStatus = (formData.get("paymentStatus") as string) || "pending";

  // Validation
  const errors: Record<string, string[]> = {};

  if (!bloodPressure) errors.bloodPressure = ["Blood pressure is required"];
  if (!heartRate) errors.heartRate = ["Heart rate is required"];
  else if (isNaN(Number(heartRate)) || Number(heartRate) < 20 || Number(heartRate) > 300) {
    errors.heartRate = ["Heart rate must be between 20 and 300 BPM"];
  }
  if (!temperature) errors.temperature = ["Temperature is required"];
  else if (isNaN(Number(temperature)) || Number(temperature) < 90 || Number(temperature) > 115) {
    errors.temperature = ["Temperature must be between 90°F and 115°F"];
  }
  if (!weight) errors.weight = ["Weight is required"];
  else if (isNaN(Number(weight)) || Number(weight) < 1 || Number(weight) > 500) {
    errors.weight = ["Weight must be between 1 and 500 kg"];
  }
  if (!height) errors.height = ["Height is required"];
  else if (isNaN(Number(height)) || Number(height) < 30 || Number(height) > 300) {
    errors.height = ["Height must be between 30 and 300 cm"];
  }

  if (assignmentType === "OPD") {
    if (!doctorId) errors.doctor = ["Please select a doctor"];
    if (!patientId) errors.patient = ["Patient ID is required"];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      success: false,
      message: "Session expired. Please log in again.",
      errors: {},
    };
  }

  const visitData: VisitCreateData = {
    visit: {
      patientId: patientId,
      doctorId: doctorId,
      visit_type: assignmentType as "OPD" | "IPD",
    },
    vital: {
      blood_pressure: bloodPressure || undefined,
      heart_rate: heartRate ? parseInt(heartRate) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
    },
    bill: {
      extra_charge: extraCharge ? parseFloat(extraCharge) : 0,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
    },
  };

  try {
    const res = await createVisitRequest(visitData, accessToken);
    return {
      success: true,
      message: "Visit created successfully",
      data: res.data,
    };
  } catch (e: any) {
    const message = await extractApiError(e);
    return {
      success: false,
      message,
      errors: {},
    };
  }
}
