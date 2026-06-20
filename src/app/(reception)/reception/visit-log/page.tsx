"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getVisitsRequest, getPatientRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Activity,
  FileText,
  DollarSign,
  Monitor,
  CheckCircle,
  X,
  Search,
  ChevronRight,
  TrendingUp,
  HeartPulse,
  RefreshCw
} from "lucide-react";

type VisitLogData = {
  visit_id: string;
  visit_type: string;
  visit_date: string;
  symptoms: string[];
  known_diseases: string[];
  chief_complaint: string | null;
  visit_notes: string | null;
  created_by: string;
  created_by_user?: { username: string };
  patient: {
    first_name: string;
    last_name: string;
    unique_id: string;
    mobile: string;
  };
  doctor: {
    first_name: string;
    last_name: string;
    specialization: string;
    department?: { name: string };
  } | null;
  vitals: {
    blood_pressure: string | null;
    heart_rate: number | null;
    temperature: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    oxygen_saturation: number | null;
  } | null;
  bill: {
    total_amount: number;
    payment_status: string;
    payment_method: string | null;
  };
};

export default function VisitLogPage() {
  const [visits, setVisits] = useState<VisitLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisit, setSelectedVisit] = useState<VisitLogData | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Today's date in YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterVisitType, setFilterVisitType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(7);

  useEffect(() => {
    setVisibleCount(7);
  }, [searchQuery, selectedDate, filterPaymentStatus, filterVisitType]);

  const loadVisitsData = async (showMainSpinner = false) => {
    if (showMainSpinner) setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await getVisitsRequest({ limit: 1000 }, token);
      if (res.success && res.data) {
        const allVisits = res.data as VisitLogData[];
        // Filter to keep only the latest visit of each patient
        const seenPatients = new Set<string>();
        const uniqueLatestVisits = allVisits.filter((v) => {
          if (seenPatients.has(v.patient.unique_id)) {
            return false;
          }
          seenPatients.add(v.patient.unique_id);
          return true;
        });
        setVisits(uniqueLatestVisits.slice(0, 100));
      }
    } catch (err) {
      console.error("Failed to load visits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitsData(true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVisitsData(false);
    setRefreshing(false);
  };

  // Fetch patient profile history when a visit details modal is opened
  useEffect(() => {
    if (selectedVisit) {
      setLoadingHistory(true);
      async function loadPatientHistory() {
        try {
          if (!selectedVisit) return;
          const token = await getAccessToken();
          if (!token) return;
          const res = await getPatientRequest(selectedVisit.patient.unique_id, token);
          if (res.success && res.data) {
            setPatientHistory((res.data as any).visits || []);
          }
        } catch (err) {
          console.error("Failed to fetch patient history:", err);
        } finally {
          setLoadingHistory(false);
        }
      }
      loadPatientHistory();
    }
  }, [selectedVisit]);

  const filteredVisits = useMemo(() => {
    let result = visits;

    // Filter by Date
    if (selectedDate) {
      result = result.filter((v) => {
        const localDate = new Date(v.visit_date);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        const formattedVisitDate = `${year}-${month}-${day}`;
        return formattedVisitDate === selectedDate;
      });
    }

    // Filter by Payment Status
    if (filterPaymentStatus !== "all") {
      result = result.filter((v) => v.bill.payment_status === filterPaymentStatus);
    }

    // Filter by Visit Type
    if (filterVisitType !== "all") {
      result = result.filter((v) => v.visit_type === filterVisitType);
    }

    // Filter by Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (v) =>
          `${v.patient.first_name} ${v.patient.last_name}`.toLowerCase().includes(q) ||
          v.patient.unique_id.toLowerCase().includes(q) ||
          v.patient.mobile.includes(q) ||
          (v.doctor && `${v.doctor.first_name} ${v.doctor.last_name}`.toLowerCase().includes(q))
      );
    }

    return result;
  }, [visits, selectedDate, filterPaymentStatus, filterVisitType, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 font-body-md text-slate-100">
      <Header activeItem="Visit Book" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 md:px-16">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <HeartPulse className="text-blue-500 w-8 h-8" />
            Rajkiran Visit Log
          </h1>
          <p className="text-slate-400 text-sm">Complete historic index of all patient encounters.</p>
        </div>

        {/* Image 2 Style Search, Date, Filters & Refresh Row */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-center gap-3 shadow-sm mb-4 text-slate-800">
          {/* Search Input */}
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Date Picker */}
          <div className="relative w-full md:w-auto min-w-[180px]">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-lg py-2.5 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-semibold"
            />
          </div>

          {/* Filters Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full md:w-auto px-4 py-2.5 border rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              showFilters || filterPaymentStatus !== "all" || filterVisitType !== "all"
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Filters
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full md:w-auto p-2.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-slate-600 rounded-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>

        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Status</label>
              <div className="flex gap-2">
                {["all", "paid", "pending"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterPaymentStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      filterPaymentStatus === status
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visit Type</label>
              <div className="flex gap-2">
                {["all", "OPD", "IPD"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterVisitType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterVisitType === type
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary status text line */}
        <div className="text-slate-400 text-xs font-semibold mb-4 px-1">
          {filteredVisits.length} of {visits.length} visits {selectedDate ? `for ${new Date(selectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : "in total"}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredVisits.length > 0 ? (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold tracking-wider">
                    <th className="py-4 px-5">Visit Date / ID</th>
                    <th className="py-4 px-5">Patient Details</th>
                    <th className="py-4 px-5">Consulting Specialist</th>
                    <th className="py-4 px-5">Diagnosis & Symptoms</th>
                    <th className="py-4 px-5">Key Vitals</th>
                    <th className="py-4 px-5">Billing & Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredVisits.map((v) => {
                    const dateStr = new Date(v.visit_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    });
                    const timeStr = new Date(v.visit_date).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    return (
                      <tr key={v.visit_id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-4 px-5">
                          <button
                            onClick={() => setSelectedVisit(v)}
                            className="font-bold text-blue-400 hover:text-blue-300 hover:underline block text-left text-sm"
                          >
                            {dateStr}
                          </button>
                          <span className="text-slate-500 text-[10px] block font-mono mt-0.5">{timeStr} ({v.visit_id.slice(0, 8)})</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-semibold text-slate-200 block text-sm">
                            {v.patient.first_name} {v.patient.last_name}
                          </span>
                          <span className="text-slate-400 text-xs block mt-0.5">UHID: {v.patient.unique_id}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-medium text-slate-300 block text-sm">
                            {v.doctor ? `Dr. ${v.doctor.first_name} ${v.doctor.last_name}` : "General Duty"}
                          </span>
                          <span className="text-slate-500 text-xs block mt-0.5">
                            {v.doctor?.specialization ?? "OPD Clinic"} ({v.doctor?.department?.name ?? "General Medicine"})
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-slate-300 font-medium block max-w-xs truncate text-xs">
                            {v.chief_complaint || "Routine Checkup"}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {v.symptoms.slice(0, 3).map((sym) => (
                              <span key={sym} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px]">
                                {sym}
                              </span>
                            ))}
                            {v.symptoms.length > 3 && (
                              <span className="text-slate-500 text-[10px] pl-1 font-semibold">+{v.symptoms.length - 3} more</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {v.vitals ? (
                            <div className="space-y-0.5 text-slate-300 font-mono text-[11px]">
                              <div>BP: <span className="text-slate-200 font-bold">{v.vitals.blood_pressure || "N/A"}</span></div>
                              <div>HR: <span className="text-slate-200 font-bold">{v.vitals.heart_rate ? `${v.vitals.heart_rate} bpm` : "N/A"}</span></div>
                              <div>BMI: <span className="text-slate-200 font-bold">{v.vitals.bmi || "N/A"}</span></div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Not recorded</span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-100 block text-sm">
                            ₹{Number(v.bill.total_amount).toLocaleString("en-IN")}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 uppercase ${
                            v.bill.payment_status === "paid"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {v.bill.payment_status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => setSelectedVisit(v)}
                            className="bg-slate-800 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 border border-slate-800 bg-slate-950 rounded-xl">
            <p className="text-slate-500">No visits found matching criteria.</p>
          </div>
        )}
      </main>

      {/* Visit Details Overlay Drawer / Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-2xl relative text-slate-100 animate-slideOver">
            <button
              onClick={() => setSelectedVisit(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition"
              aria-label="Close details"
            >
              <X size={24} />
            </button>

            <div className="space-y-6">
              {/* Header */}
              <div>
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Clinical Case Sheet</span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Visit Details — {new Date(selectedVisit.visit_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Visit ID: {selectedVisit.visit_id}</p>
              </div>

              {/* Patient Profile Card */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-400 text-lg">
                  {selectedVisit.patient.first_name[0]}{selectedVisit.patient.last_name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center w-full">
                    <h3 className="font-bold text-white text-base">
                      {selectedVisit.patient.first_name} {selectedVisit.patient.last_name}
                    </h3>
                    <Link
                      href={`/reception/patient-profile/${selectedVisit.patient.unique_id}`}
                      className="px-3 py-1 bg-blue-650 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-colors ml-4 print:hidden"
                    >
                      Complete Profile
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                    <span>UHID: <strong className="text-slate-200">{selectedVisit.patient.unique_id}</strong></span>
                    <span>Mobile: <strong className="text-slate-200">{selectedVisit.patient.mobile}</strong></span>
                  </div>
                </div>
              </div>

              {/* Medical and Vitals Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <Activity size={14} className="text-blue-400" /> Patient Vitals
                  </h4>
                  {selectedVisit.vitals ? (
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
                      <div>BP: <strong className="text-white block mt-0.5 text-sm">{selectedVisit.vitals.blood_pressure || "N/A"}</strong></div>
                      <div>Pulse: <strong className="text-white block mt-0.5 text-sm">{selectedVisit.vitals.heart_rate ? `${selectedVisit.vitals.heart_rate} bpm` : "N/A"}</strong></div>
                      <div>Temp: <strong className="text-white block mt-0.5 text-sm">{selectedVisit.vitals.temperature ? `${selectedVisit.vitals.temperature} °C` : "N/A"}</strong></div>
                      <div>Weight: <strong className="text-white block mt-0.5 text-sm">{selectedVisit.vitals.weight ? `${selectedVisit.vitals.weight} kg` : "N/A"}</strong></div>
                      <div>Height: <strong className="text-white block mt-0.5 text-sm">{selectedVisit.vitals.height ? `${selectedVisit.vitals.height} cm` : "N/A"}</strong></div>
                      <div>BMI: <strong className="text-white block mt-0.5 text-sm">{selectedVisit.vitals.bmi || "N/A"}</strong></div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No vitals were captured for this visit.</p>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <Stethoscope size={14} className="text-blue-400" /> Consulting Specialist
                  </h4>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-white text-sm">
                      {selectedVisit.doctor ? `Dr. ${selectedVisit.doctor.first_name} ${selectedVisit.doctor.last_name}` : "General Duty Staff"}
                    </p>
                    <p className="text-slate-400">{selectedVisit.doctor?.specialization ?? "General OPD Services"}</p>
                    <p className="text-slate-500">Dept: {selectedVisit.doctor?.department?.name ?? "General Outpatient Clinic"}</p>
                  </div>
                </div>
              </div>

              {/* Chief Complaint, Symptoms, Diseases */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Chief Complaint</span>
                  <p className="text-sm font-medium text-white bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {selectedVisit.chief_complaint || "Routine consult / general wellness checks."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Presenting Symptoms</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVisit.symptoms.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-300 text-xs">
                          {s}
                        </span>
                      ))}
                      {selectedVisit.symptoms.length === 0 && <span className="text-xs italic text-slate-550">None specified</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Associated Diseases</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVisit.known_diseases.map((d) => (
                        <span key={d} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-300 text-xs">
                          {d}
                        </span>
                      ))}
                      {selectedVisit.known_diseases.length === 0 && <span className="text-xs italic text-slate-550">None specified</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing and Invoicing */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-blue-400" /> Invoice Breakdown
                </h4>
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Grand Total Bill Invoice</span>
                  <span className="text-base font-black text-white">₹{Number(selectedVisit.bill.total_amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>Payment status: <strong className="text-white uppercase">{selectedVisit.bill.payment_status}</strong></span>
                  <span>Payment method: <strong className="text-white uppercase">{selectedVisit.bill.payment_method || "Cash"}</strong></span>
                </div>
              </div>

              {/* Patient's Complete Medical Timeline */}
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-400" /> Patient Medical Timeline
                </h4>
                {loadingHistory ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-blue-500" /> Loading historical visits...
                  </div>
                ) : patientHistory.length > 0 ? (
                  <div className="relative border-l border-slate-800 pl-4 space-y-4 ml-2">
                    {patientHistory.map((h, i) => {
                      const hDate = new Date(h.visit_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      });
                      return (
                        <div key={h.visit_id} className="relative text-xs">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                            h.visit_id === selectedVisit.visit_id
                              ? "bg-blue-500 border-blue-500 ring-4 ring-blue-500/10"
                              : "bg-slate-950 border-slate-700"
                          }`} />
                          <div className="flex justify-between">
                            <span className={`font-bold ${h.visit_id === selectedVisit.visit_id ? "text-blue-400" : "text-white"}`}>
                              {hDate}
                            </span>
                            <span className="text-slate-500">{h.visit_type}</span>
                          </div>
                          <p className="text-slate-400 mt-0.5">
                            {h.doctor ? `Dr. ${h.doctor.first_name} ${h.doctor.last_name}` : "General Outpatient Check"}
                          </p>
                          {h.chief_complaint && <p className="text-slate-500 italic mt-0.5">"{h.chief_complaint}"</p>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No previous visit records found.</p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
