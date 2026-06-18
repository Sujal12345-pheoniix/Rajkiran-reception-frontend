"use client";

import { useActionState, useEffect, useState } from "react";
import { createPatient, type PatientFormState, searchPatient } from "@/lib/actions/patientForm";
import { useRouter } from "next/navigation";
import { RefreshCw, Search, ShieldCheck } from "lucide-react";

const INITIAL_STATE: PatientFormState = {
  success: undefined,
  message: "",
  errors: {},
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

const CHRONIC_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "COPD",
  "Cancer",
  "Heart Disease",
  "Kidney Disease",
  "Thyroid Disorder",
  "Arthritis",
  "Tuberculosis",
  "Epilepsy",
];

export default function PatientForm() {
  const [state, formAction, isPending] = useActionState(createPatient, INITIAL_STATE);
  const router = useRouter();

  // State for real-time mobile duplicate checking
  const [mobile, setMobile] = useState("");
  const [liveDuplicate, setLiveDuplicate] = useState<any | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  useEffect(() => {
    if (state.success && state.message) {
      router.push(`/reception/${state.message}`);
    }
  }, [state.success, state.message, router]);

  // Real-time duplicate checking effect
  useEffect(() => {
    if (mobile.length === 10) {
      setCheckingDuplicate(true);
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await searchPatient(mobile);
          if (res.success && res.data && res.data.length > 0) {
            const exactMatch = res.data.find((p: any) => p.mobile === mobile);
            if (exactMatch) {
              setLiveDuplicate(exactMatch);
            } else {
              setLiveDuplicate(null);
            }
          } else {
            setLiveDuplicate(null);
          }
        } catch (err) {
          console.error("Duplicate search failed:", err);
        } finally {
          setCheckingDuplicate(false);
        }
      }, 500);

      return () => clearTimeout(delayDebounce);
    } else {
      setLiveDuplicate(null);
      setCheckingDuplicate(false);
    }
  }, [mobile]);

  return (
    <form
      action={formAction}
      className="max-w-4xl mx-auto p-6 space-y-6"
      noValidate
    >
      <input type="hidden" name="chronicConditions" value={JSON.stringify([])} />

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-800">New Patient Registration</h1>
      </div>

      {/* Global Error */}
      {state.success === false && state.message && state.message !== "DUPLICATE_PATIENT" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-red-700 font-semibold">Registration Failed</p>
            <p className="text-red-600 text-sm mt-0.5">{state.message}</p>
          </div>
        </div>
      )}

      {/* Real-Time Duplicate Patient Alert Banner */}
      {(liveDuplicate || (state.success === false && state.message === "DUPLICATE_PATIENT" && state.duplicatePatient)) && (
        (() => {
          const dup = liveDuplicate || state.duplicatePatient;
          return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between transition-all duration-300">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-100 rounded-full text-amber-700 mt-1">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-amber-900 font-bold text-lg leading-6">Existing Patient Found</h3>
                  <p className="text-slate-600 text-sm mt-1">
                    A patient record already exists with this mobile number.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mt-3 bg-white p-3 rounded-lg border border-amber-100 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block uppercase tracking-wider text-[9px]">Patient Name</span>
                      <span className="font-bold text-slate-800">{dup.first_name} {dup.last_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block uppercase tracking-wider text-[9px]">Patient ID</span>
                      <span className="font-mono font-bold text-slate-800">{dup.unique_id}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:self-center">
                <button
                  type="button"
                  onClick={() => router.push(`/reception/patient-profile/${dup.unique_id}`)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs"
                >
                  Open Profile
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/reception/${dup.unique_id}`)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
                >
                  Create Follow-Up
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/reception/patient-profile/${dup.unique_id}?edit=true`)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
                >
                  Update Existing Record
                </button>
              </div>
            </div>
          );
        })()
      )}

      {/* Loading state after success (navigating) */}
      {state.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 font-medium">Patient registered! Redirecting...</p>
        </div>
      )}

      {/* Patient Profile Section */}
      <section className="border rounded-xl p-6 bg-gray-50 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 border-b pb-3">
          Patient Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              autoComplete="given-name"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="First name"
            />
            {state.errors?.firstName && (
              <p className="text-red-500 text-xs mt-1">{state.errors.firstName[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              autoComplete="family-name"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="Last name"
            />
            {state.errors?.lastName && (
              <p className="text-red-500 text-xs mt-1">{state.errors.lastName[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dob"
              required
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.dob && (
              <p className="text-red-500 text-xs mt-1">{state.errors.dob[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              required
              className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {state.errors?.gender && (
              <p className="text-red-500 text-xs mt-1">{state.errors.gender[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center justify-between">
              <span>Mobile Number <span className="text-red-500">*</span></span>
              {checkingDuplicate && <RefreshCw size={12} className="animate-spin text-blue-600" />}
            </label>
            <input
              type="tel"
              name="mobileNumber"
              autoComplete="tel"
              required
              placeholder="10-digit mobile"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.mobileNumber && (
              <p className="text-red-500 text-xs mt-1">{state.errors.mobileNumber[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Blood Group <span className="text-red-500">*</span>
            </label>
            <select
              name="bloodGroup"
              required
              className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="Unknown">Select Blood Group</option>
              {BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="patient@example.com"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.email && (
              <p className="text-red-500 text-xs mt-1">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Alternate Mobile</label>
            <input
              type="tel"
              name="alternateNumber"
              placeholder="Alternate mobile"
              maxLength={10}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.alternateNumber && (
              <p className="text-red-500 text-xs mt-1">{state.errors.alternateNumber[0]}</p>
            )}
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Residential address"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>
        </div>
      </section>


      <button
        type="submit"
        disabled={isPending || state.success === true}
        className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
      >
        {isPending ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Registering Patient...
          </>
        ) : state.success ? (
          "Redirecting..."
        ) : (
          "Register Patient"
        )}
      </button>
    </form>
  );
}
