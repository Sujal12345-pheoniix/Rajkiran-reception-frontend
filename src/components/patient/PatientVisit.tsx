"use client";

import { useActionState, useEffect, useState } from "react";
import { createVisit, type VisitFormState } from "@/lib/actions/visitAction";
import { getAllDoctorsWithDepartmentsRequest, type Department, type Doctor } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

const INITIAL_STATE: VisitFormState = {
  success: undefined,
  message: "",
  errors: {},
};

export default function PatientVisit({ patientId }: { patientId: string }) {
  const [state, formAction, isPending] = useActionState(createVisit, INITIAL_STATE);

  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDoctorName, setSelectedDoctorName] = useState("");

  // BUG FIX: Was hardcoded mock data — now fetches from real API
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);
  const [deptError, setDeptError] = useState("");

  const [assignmentType, setAssignmentType] = useState<"OPD" | "IPD">("OPD");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Fetch departments + doctors on mount
  useEffect(() => {
    async function fetchDepartments() {
      setIsLoadingDepts(true);
      setDeptError("");
      try {
        // Get token for authenticated request
        const token = await getAccessToken();
        if (!token) {
          setDeptError("Session expired. Please log in again.");
          return;
        }
        const res = await getAllDoctorsWithDepartmentsRequest(token);
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      } catch (e: any) {
        setDeptError("Failed to load departments. Please refresh.");
        console.error("Failed to fetch departments:", e);
      } finally {
        setIsLoadingDepts(false);
      }
    }
    fetchDepartments();
  }, []);

  // Update doctors when department changes
  useEffect(() => {
    if (selectedDepartmentId) {
      const dept = departments.find((d) => d.department_id === selectedDepartmentId);
      setFilteredDoctors(dept?.doctors ?? []);
      setSelectedDoctorId("");
      setSelectedDoctorName("");
      setTotalAmount(0);
    } else {
      setFilteredDoctors([]);
    }
  }, [selectedDepartmentId, departments]);

  // Update total amount when doctor changes
  useEffect(() => {
    if (selectedDoctorId && assignmentType === "OPD") {
      const doctor = filteredDoctors.find((d) => d.doctor_id === selectedDoctorId);
      if (doctor) {
        setTotalAmount(Number(doctor.consultation_fee));
        setSelectedDoctorName(`Dr. ${doctor.first_name} ${doctor.last_name}`);
      }
    } else {
      setTotalAmount(0);
      setSelectedDoctorName("");
    }
  }, [selectedDoctorId, filteredDoctors, assignmentType]);

  if (state.success) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-8 bg-green-50 border border-green-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-700">Visit Created Successfully!</h2>
        </div>
        <p className="text-green-600 mb-2">{state.message}</p>
        {state.data && (
          <p className="text-sm text-green-500">Visit ID: {state.data.visit_id}</p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            New Visit for Same Patient
          </button>
          <a
            href="/reception"
            className="px-5 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition font-medium"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="doctorId" value={selectedDoctorId} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="paymentStatus" value="pending" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Visit Registration</h1>
        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
          Patient: {patientId}
        </span>
      </div>

      {/* Global Error */}
      {state.success === false && state.message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-0.5">{state.message}</p>
          </div>
        </div>
      )}

      {/* Clinical Vitals Section */}
      <section className="border rounded-xl p-6 bg-gray-50 shadow-sm">
        <h2 className="text-lg font-semibold mb-5 text-gray-700 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
          Clinical Vitals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Blood Pressure <span className="text-red-500">*</span> (mmHg)
            </label>
            <input
              type="text"
              name="bloodPressure"
              placeholder="e.g. 120/80"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.bloodPressure && (
              <p className="text-red-500 text-xs mt-1">{state.errors.bloodPressure[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Heart Rate <span className="text-red-500">*</span> (BPM)
            </label>
            <input
              type="number"
              name="heartRate"
              placeholder="e.g. 72"
              min={20}
              max={300}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.heartRate && (
              <p className="text-red-500 text-xs mt-1">{state.errors.heartRate[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Temperature <span className="text-red-500">*</span> (°F)
            </label>
            <input
              type="number"
              step="0.1"
              name="temperature"
              placeholder="e.g. 98.6"
              min={90}
              max={115}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.temperature && (
              <p className="text-red-500 text-xs mt-1">{state.errors.temperature[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Weight <span className="text-red-500">*</span> (kg)
            </label>
            <input
              type="number"
              step="0.1"
              name="weight"
              placeholder="e.g. 70"
              min={1}
              max={500}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.weight && (
              <p className="text-red-500 text-xs mt-1">{state.errors.weight[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Height <span className="text-red-500">*</span> (cm)
            </label>
            <input
              type="number"
              step="0.1"
              name="height"
              placeholder="e.g. 170"
              min={30}
              max={300}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.height && (
              <p className="text-red-500 text-xs mt-1">{state.errors.height[0]}</p>
            )}
          </div>
        </div>
      </section>

      {/* OPD / IPD Section */}
      <section className="border rounded-xl p-6 bg-gray-50 shadow-sm">
        <h2 className="text-lg font-semibold mb-5 text-gray-700 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
          Visit Type & Assignment
        </h2>

        <div className="flex gap-4 mb-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="assignmentType"
              value="OPD"
              checked={assignmentType === "OPD"}
              onChange={() => { setAssignmentType("OPD"); setSelectedDoctorId(""); setTotalAmount(0); }}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="font-medium text-gray-700">OPD (Outpatient)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="assignmentType"
              value="IPD"
              checked={assignmentType === "IPD"}
              onChange={() => { setAssignmentType("IPD"); setSelectedDoctorId(""); setTotalAmount(0); }}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="font-medium text-gray-700">IPD (Inpatient)</span>
          </label>
        </div>

        {assignmentType === "OPD" && (
          <div className="space-y-4">
            {deptError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm">
                ⚠️ {deptError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
                disabled={isLoadingDepts}
              >
                <option value="">
                  {isLoadingDepts ? "Loading departments..." : "Select Department"}
                </option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDepartmentId && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Doctor <span className="text-red-500">*</span>
                </label>
                {filteredDoctors.length === 0 ? (
                  <p className="text-amber-600 text-sm p-3 bg-amber-50 rounded-lg border border-amber-200">
                    No active doctors in this department.
                  </p>
                ) : (
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Select Doctor</option>
                    {filteredDoctors.map((doctor) => (
                      <option key={doctor.doctor_id} value={doctor.doctor_id}>
                        Dr. {doctor.first_name} {doctor.last_name} — ₹{Number(doctor.consultation_fee).toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                )}
                {state.errors?.doctor && (
                  <p className="text-red-500 text-xs mt-1">{state.errors.doctor[0]}</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Payment Section */}
      <section className="border rounded-xl p-6 bg-gray-50 shadow-sm">
        <h2 className="text-lg font-semibold mb-5 text-gray-700 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
          Payment Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="insurance">Insurance</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Extra Charges (₹)</label>
            <input
              type="number"
              name="extraCharge"
              defaultValue={0}
              min={0}
              className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="0"
            />
          </div>
        </div>
      </section>

      {/* Total Amount Display */}
      {assignmentType === "OPD" && selectedDoctorId && totalAmount > 0 && (
        <div className="border-2 border-blue-300 rounded-xl p-5 bg-blue-50 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Consultation Fee</h3>
              <p className="text-sm text-blue-600 mt-0.5">{selectedDoctorName}</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
      >
        {isPending ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating Visit...
          </>
        ) : (
          "Create Visit"
        )}
      </button>
    </form>
  );
}
