"use client";

import { useActionState, useEffect } from "react";
import { createPatient, type PatientFormState } from "@/lib/actions/patientForm";
import { useRouter } from "next/navigation";

const INITIAL_STATE: PatientFormState = {
  success: undefined,
  message: "",
  errors: {},
};

export default function PatientForm() {
  const [state, formAction, isPending] = useActionState(createPatient, INITIAL_STATE);
  const router = useRouter();

  // BUG FIX: Navigate after success without rendering success block simultaneously
  useEffect(() => {
    if (state.success && state.message) {
      router.push(`/reception/${state.message}`);
    }
  }, [state.success, state.message, router]);

  return (
    <form
      action={formAction}
      className="max-w-4xl mx-auto p-6 space-y-6"
      noValidate
    >
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-800">New Patient Registration</h1>
      </div>

      {/* Global Error */}
      {state.success === false && state.message && (
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

      {/* Loading state after success (navigating) */}
      {state.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 font-medium">Patient registered! Redirecting...</p>
        </div>
      )}

      {/* Patient Profile Section */}
      <section className="border rounded-xl p-6 bg-gray-50 shadow-sm">
        <h2 className="text-lg font-semibold mb-5 text-gray-700 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
          Patient Profile
        </h2>
        {/* BUG FIX: Was grid-cols-3 md:grid-cols-2 — reversed breakpoints.
            Mobile got 3 columns, desktop got 2. Fixed to standard responsive pattern. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              autoComplete="given-name"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="John"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="Doe"
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
              className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Select Gender</option>
              {/* BUG FIX: Backend expects "Male"/"Female"/"Other" (capitalized).
                  Was sending "male"/"female"/"other" (lowercase) — schema validation failed. */}
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {state.errors?.gender && (
              <p className="text-red-500 text-xs mt-1">{state.errors.gender[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="mobileNumber"
              autoComplete="tel"
              placeholder="10-digit number"
              maxLength={10}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.mobileNumber && (
              <p className="text-red-500 text-xs mt-1">{state.errors.mobileNumber[0]}</p>
            )}
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

          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Full address"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Alternate Number</label>
            <input
              type="tel"
              name="alternateNumber"
              placeholder="10-digit number"
              maxLength={10}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {state.errors?.alternateNumber && (
              <p className="text-red-500 text-xs mt-1">{state.errors.alternateNumber[0]}</p>
            )}
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
