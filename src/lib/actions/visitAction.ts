"use server";

import { createVisitRequest, extractApiError, type VisitCreateData } from "../api-client";
import { getAccessToken } from "../auth";

export type VisitFormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: any;
};

export async function createVisit(
  _prevState: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  const patientId = formData.get("patientId") as string;
  const doctorId = formData.get("doctorId") as string;
  const assignmentType = (formData.get("assignmentType") as string) || "OPD";

  // Vitals
  const bloodPressure = formData.get("bloodPressure") as string;
  const heartRate = formData.get("heartRate") as string;
  const temperature = formData.get("temperature") as string;
  const weight = formData.get("weight") as string;
  const height = formData.get("height") as string;
  const oxygenSaturation = formData.get("oxygenSaturation") as string;
  const respiratoryRate = formData.get("respiratoryRate") as string;
  const bloodSugar = formData.get("bloodSugar") as string;
  const painScale = formData.get("painScale") as string;

  // Visit details
  const symptomsRaw = formData.get("symptoms") as string; // Comma separated
  const symptoms = symptomsRaw ? symptomsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
  
  const knownDiseasesRaw = formData.get("knownDiseases") as string; // Comma separated
  const knownDiseases = knownDiseasesRaw ? knownDiseasesRaw.split(",").map(d => d.trim()).filter(Boolean) : [];

  const chiefComplaint = formData.get("chiefComplaint") as string;
  const visitNotes = formData.get("visitNotes") as string;

  // Billing
  const consultationFee = formData.get("consultationFee") as string;
  const registrationFee = formData.get("registrationFee") as string;
  const testsFee = formData.get("testsFee") as string;
  const medicinesFee = formData.get("medicinesFee") as string;
  const extraCharge = formData.get("extraCharge") as string;
  const discount = formData.get("discount") as string;
  const tax = formData.get("tax") as string;
  const grandTotal = formData.get("grandTotal") as string;

  const paymentMethod = (formData.get("paymentMethod") as string) || "cash";
  const paymentStatus = (formData.get("paymentStatus") as string) || "pending";

  // Validation
  const errors: Record<string, string[]> = {};

  if (!patientId) errors.patient = ["Patient ID is required"];
  if (assignmentType === "OPD" && !doctorId) {
    errors.doctor = ["Please select a doctor"];
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

  const visitData: any = {
    visit: {
      patientId: patientId,
      doctorId: doctorId || undefined,
      visit_type: assignmentType,
      symptoms,
      known_diseases: knownDiseases,
      chief_complaint: chiefComplaint || undefined,
      visit_notes: visitNotes || undefined,
    },
    vital: {
      blood_pressure: bloodPressure || undefined,
      heart_rate: heartRate ? parseInt(heartRate) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      oxygen_saturation: oxygenSaturation ? parseInt(oxygenSaturation) : undefined,
      respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
      blood_sugar: bloodSugar ? parseInt(bloodSugar) : undefined,
      pain_scale: painScale ? parseInt(painScale) : undefined,
    },
    bill: {
      consultation_fee: consultationFee ? parseFloat(consultationFee) : 0,
      registration_fee: registrationFee ? parseFloat(registrationFee) : 0,
      tests_fee: testsFee ? parseFloat(testsFee) : 0,
      medicines_fee: medicinesFee ? parseFloat(medicinesFee) : 0,
      extra_charge: extraCharge ? parseFloat(extraCharge) : 0,
      discount: discount ? parseFloat(discount) : 0,
      tax: tax ? parseFloat(tax) : 0,
      grand_total: grandTotal ? parseFloat(grandTotal) : 0,
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
