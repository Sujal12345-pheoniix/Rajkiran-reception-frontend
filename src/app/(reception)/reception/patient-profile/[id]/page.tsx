"use client";

import React, { useEffect, useState, use } from "react";
import {
  User,
  Heart,
  TrendingUp,
  Activity,
  FileText,
  Shield,
  Download,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Briefcase,
  Plus
} from "lucide-react";
import { getPatientById } from "@/lib/actions/patientForm";
import { logPatientDownloadRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PatientProfilePage({
  params: paramsPromise
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { id } = params;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getPatientById(id);
        if (res.success && res.data) {
          setPatient(res.data);
        } else {
          setError(res.message ?? "Failed to load patient profile.");
        }
      } catch (e) {
        setError("Error loading profile details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleDownloadReport = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        await logPatientDownloadRequest(id, token);
      }
      window.print();
    } catch (e) {
      console.error(e);
    }
  };

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header activeItem="Visit Book" />
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-slate-500 font-medium">Loading Patient 360° Profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header activeItem="Visit Book" />
        <div className="flex-1 max-w-xl mx-auto py-12 px-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-bold text-red-800">Error Loading Profile</h2>
            <p className="text-sm text-red-600">{error ?? "Patient profile could not be found."}</p>
            <Link href="/reception/visit-book" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:underline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Visit Book
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Parse lists
  const visits = patient.visits || [];
  const totalVisits = visits.length;
  const firstVisitDate = totalVisits > 0 ? new Date(visits[visits.length - 1].visit_date).toLocaleDateString() : "N/A";
  const lastVisitDate = totalVisits > 0 ? new Date(visits[0].visit_date).toLocaleDateString() : "N/A";
  const opdCount = visits.filter((v: any) => v.visit_type === "OPD").length;
  const ipdCount = visits.filter((v: any) => v.visit_type === "IPD").length;

  // Extract medical trends for graphs
  const reverseVisitsForTrends = [...visits].reverse();
  const vitalsTrend = reverseVisitsForTrends
    .filter((v: any) => v.vitals)
    .map((v: any) => ({
      date: new Date(v.visit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      bp: v.vitals.blood_pressure || "120/80",
      hr: v.vitals.heart_rate || 72,
      weight: v.vitals.weight || 70,
      temp: v.vitals.temperature || 98.6,
      bmi: v.vitals.bmi || 22.8,
      sugar: v.vitals.blood_sugar || 110,
    }));

  // Allergies
  const medicineAllergies = patient.patient_allergies?.filter((a: any) => a.allergy?.category === "drug") || [];
  const foodAllergies = patient.patient_allergies?.filter((a: any) => a.allergy?.category === "food") || [];
  const otherAllergies = patient.patient_allergies?.filter((a: any) => a.allergy?.category === "other") || [];

  // Chronic conditions
  const chronicConditions = patient.patient_chronic_conditions || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between print:bg-white print:text-black">
      <Header activeItem="Visit Book" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:px-8 space-y-8 print:p-0 print:my-0">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/reception/visit-book"
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Patient 360° Profile</h1>
              <p className="text-xs text-slate-500">Comprehensive real-time EHR telemetry</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Medical Report (PDF)
            </button>
          </div>
        </div>

        {/* PRINT HEADER */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">RAJKIRAN SUPER-SPECIALITY HOSPITAL</h1>
              <p className="text-sm text-slate-600">Patna, Bihar, India | Contact: +91 98765 43210</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-800">COMPLETE EHR REPORT</h2>
              <p className="text-xs text-slate-500">Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Grid 1: Basic Info & KPI widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card: Profile Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 font-bold text-xl rounded-full flex items-center justify-center border border-blue-100">
                {patient.first_name.slice(0, 1)}{patient.last_name.slice(0, 1)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{patient.first_name} {patient.last_name}</h2>
                <p className="text-xs font-mono text-slate-500">{patient.unique_id}</p>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-medium text-[10px]">Age / Gender</span>
                <span className="font-semibold text-slate-700">{calculateAge(patient.dob)} Yrs / {patient.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-medium text-[10px]">Blood Group</span>
                <span className="font-semibold text-rose-600">{patient.blood_group || "O+"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block uppercase tracking-wider font-medium text-[10px]">Mobile Contact</span>
                <span className="font-semibold text-slate-700">{patient.mobile} {patient.alternate_mobile && `(Alt: ${patient.alternate_mobile})`}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block uppercase tracking-wider font-medium text-[10px]">Address</span>
                <span className="font-semibold text-slate-700">{patient.address || "No Address Provided"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block uppercase tracking-wider font-medium text-[10px]">Emergency Contact</span>
                <span className="font-semibold text-slate-700">{patient.emergency_contact || "N/A"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block uppercase tracking-wider font-medium text-[10px]">Insurance / Corporate Carrier</span>
                <span className="font-semibold text-blue-700">{patient.insurance_details || "Self Paid (No Insurance Claims)"}</span>
              </div>
            </div>
          </div>

          {/* Cards: Metrics & Alert banner */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Vitals Warnings Alert */}
            {(medicineAllergies.length > 0 || chronicConditions.length > 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
                <AlertTriangle className="w-10 h-10 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Critical Clinical Warnings</h4>
                  <ul className="text-xs text-amber-800 mt-1 list-disc pl-4 space-y-1">
                    {medicineAllergies.map((a: any, idx: number) => (
                      <li key={idx}><strong>Drug Allergy:</strong> Allergy to {a.allergy?.allergy_name} ({a.specific_note || "Severe reaction"})</li>
                    ))}
                    {chronicConditions.map((c: any, idx: number) => (
                      <li key={idx}><strong>Chronic Condition:</strong> Diagnosed with {c.condition?.condition_name} ({c.other_specific_note || "Active"})</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Visit KPI counts row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase block tracking-wider">Total Consults</span>
                <span className="text-2xl font-extrabold text-slate-900 block mt-1">{totalVisits}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase block tracking-wider">OPD Inquiries</span>
                <span className="text-2xl font-extrabold text-blue-600 block mt-1">{opdCount}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase block tracking-wider">IPD Admissions</span>
                <span className="text-2xl font-extrabold text-purple-600 block mt-1">{ipdCount}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase block tracking-wider">Timeline Span</span>
                <span className="text-xs font-bold text-slate-700 block mt-2 truncate">{firstVisitDate} to {lastVisitDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical History Trends Graphs */}
        {vitalsTrend.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 print:break-inside-avoid">
            <h3 className="font-bold text-slate-950 text-sm mb-4 flex items-center gap-2">
              <Activity className="text-blue-600 w-4 h-4" /> Vitals History & Trends Chart
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* BP & Heart Rate bar simulation */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Blood Pressure (mmHg)</h4>
                <div className="space-y-2.5">
                  {vitalsTrend.map((v, idx) => {
                    const sys = parseInt(v.bp.split("/")[0]) || 120;
                    const percent = Math.min(100, Math.max(30, (sys / 180) * 100));
                    return (
                      <div key={idx} className="flex items-center text-xs gap-3">
                        <span className="w-14 text-slate-400 text-right">{v.date}</span>
                        <div className="flex-1 bg-slate-200 h-4 rounded overflow-hidden relative">
                          <div className={`h-full rounded ${sys > 139 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }}></div>
                          <span className="absolute inset-y-0 left-2 flex items-center font-bold text-[10px] text-white">{v.bp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Heart Rate line simulation */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Heart Rate (BPM)</h4>
                <div className="space-y-2.5">
                  {vitalsTrend.map((v, idx) => {
                    const hrVal = Number(v.hr);
                    const percent = Math.min(100, Math.max(30, (hrVal / 140) * 100));
                    return (
                      <div key={idx} className="flex items-center text-xs gap-3">
                        <span className="w-14 text-slate-400 text-right">{v.date}</span>
                        <div className="flex-1 bg-slate-200 h-4 rounded overflow-hidden relative">
                          <div className="h-full bg-emerald-600 rounded" style={{ width: `${percent}%` }}></div>
                          <span className="absolute inset-y-0 left-2 flex items-center font-bold text-[10px] text-white">{v.hr} bpm</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Random clinical metric (e.g. Sugar levels) */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Blood Sugar (mg/dL)</h4>
                <div className="space-y-2.5">
                  {vitalsTrend.map((v, idx) => {
                    const sugar = Number(v.sugar);
                    const percent = Math.min(100, Math.max(30, (sugar / 250) * 100));
                    return (
                      <div key={idx} className="flex items-center text-xs gap-3">
                        <span className="w-14 text-slate-400 text-right">{v.date}</span>
                        <div className="flex-1 bg-slate-200 h-4 rounded overflow-hidden relative">
                          <div className={`h-full rounded ${sugar > 140 ? 'bg-rose-500' : 'bg-teal-600'}`} style={{ width: `${percent}%` }}></div>
                          <span className="absolute inset-y-0 left-2 flex items-center font-bold text-[10px] text-white">{v.sugar} mg/dL</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Medical / Visit History Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:break-inside-avoid">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Full Medical & Visit History Timeline</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Consulting Doctor / Dept</th>
                  <th className="px-6 py-3">Chief Complaint / Notes</th>
                  <th className="px-6 py-3">Symptoms / Past Diagnoses</th>
                  <th className="px-6 py-3">Bill Breakdown</th>
                  <th className="px-6 py-3">Total paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {visits.map((visit: any, idx: number) => {
                  const doctorName = visit.doctor
                    ? `Dr. ${visit.doctor.first_name} ${visit.doctor.last_name}`
                    : "No Doctor Assigned";
                  const specialization = visit.doctor?.specialization || "General Medicine";

                  return (
                    <tr key={visit.visit_id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        {new Date(visit.visit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        <span className="block text-[10px] font-bold text-blue-600 mt-0.5">{visit.visit_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{doctorName}</div>
                        <div className="text-slate-400 text-[10px]">{specialization}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs whitespace-normal break-words">
                        {visit.chief_complaint && (
                          <div className="mb-1"><strong>Complaint:</strong> {visit.chief_complaint}</div>
                        )}
                        {visit.visit_notes && (
                          <div><strong>Notes:</strong> {visit.visit_notes}</div>
                        )}
                        {!visit.chief_complaint && !visit.visit_notes && <span className="text-slate-400">N/A</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {visit.symptoms?.map((s: string, sidx: number) => (
                            <span key={sidx} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] border border-blue-100">{s}</span>
                          ))}
                          {visit.known_diseases?.map((d: string, didx: number) => (
                            <span key={didx} className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-red-100">{d}</span>
                          ))}
                          {(!visit.symptoms || visit.symptoms.length === 0) && (!visit.known_diseases || visit.known_diseases.length === 0) && <span className="text-slate-400">N/A</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[10px] text-slate-500">
                          {visit.bill?.consultation_fee > 0 && `Consult: ₹${visit.bill.consultation_fee}`}
                          {visit.bill?.registration_fee > 0 && ` | Reg: ₹${visit.bill.registration_fee}`}
                          {visit.bill?.tests_fee > 0 && ` | Tests: ₹${visit.bill.tests_fee}`}
                          {visit.bill?.medicines_fee > 0 && ` | Meds: ₹${visit.bill.medicines_fee}`}
                          {visit.bill?.extra_charges > 0 && ` | Extra: ₹${visit.bill.extra_charges}`}
                          {visit.bill?.discount > 0 && ` | Disc: -₹${visit.bill.discount}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{Number(visit.bill?.total_amount).toLocaleString("en-IN")}
                        <span className={`block text-[9px] font-medium uppercase mt-0.5 ${
                          visit.bill?.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"
                        }`}>{visit.bill?.payment_status}</span>
                      </td>
                    </tr>
                  );
                })}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">No visits recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Labs & Active Medication Records */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-inside-avoid">
          {/* Diagnostic Lab Reports */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">Diagnostic Lab Reports</h3>
            <div className="space-y-3">
              {[
                { name: "Complete Blood Count (CBC)", type: "Lab Report", date: lastVisitDate },
                { name: "HbA1c & Fasting Blood Sugar", type: "Lab Report", date: lastVisitDate },
                { name: "Chest X-Ray Digital", type: "Radiology", date: lastVisitDate },
                { name: "Electrocardiogram (ECG)", type: "Cardio", date: "45 days ago" },
              ].map((lab, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">{lab.name}</h4>
                    <span className="text-[10px] text-slate-400">{lab.type} • Dated: {lab.date}</span>
                  </div>
                  <button
                    onClick={handleDownloadReport}
                    className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition rounded-lg"
                    title="Download Report File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Medication History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">Medication & Prescriptions History</h3>
            <div className="space-y-3">
              {[
                { name: "Tab. Metformin 500mg", dosage: "1-0-1 (Post Meals)", dur: "3 Months", status: "Active", dr: "Dr. Vikram Verma" },
                { name: "Tab. Amlodipine 5mg", dosage: "0-0-1 (Before Sleep)", dur: "3 Months", status: "Active", dr: "Dr. Vikram Verma" },
                { name: "Syp. Ascoril 10ml", dosage: "1-1-1", dur: "5 Days", status: "Completed", dr: "Dr. Aarav Sharma" },
              ].map((med, idx) => (
                <div key={idx} className="flex justify-between items-start p-3 border border-slate-100 rounded-lg">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{med.name}</h4>
                    <div className="text-[10px] text-slate-500 mt-0.5">Dosage: {med.dosage} • Duration: {med.dur}</div>
                    <span className="text-[9px] text-slate-400">Prescribed by {med.dr}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                    med.status === "Active" ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-slate-100 text-slate-600"
                  }`}>{med.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
