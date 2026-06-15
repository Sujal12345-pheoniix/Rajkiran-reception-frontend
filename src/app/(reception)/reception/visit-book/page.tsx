"use client";

import {
  Search,
  Loader2,
  AlertCircle,
  Filter,
  Calendar,
  Stethoscope,
  Activity,
  RefreshCw,
  X,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getVisitsRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import Link from "next/link";

type VisitFromAPI = {
  visit_id: string;
  visit_type: string;
  visit_date: string;
  consultation_fee: number;
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
  } | null;
  vitals: {
    blood_pressure: string | null;
    heart_rate: number | null;
    age: number | null;
  } | null;
  bill: {
    total_amount: number;
    payment_status: string;
    payment_method: string | null;
  };
};

type FilterState = {
  search: string;
  visitType: "all" | "OPD" | "IPD";
  date: string;
  paymentStatus: "all" | "paid" | "pending" | "partial";
};

function VisitCard({ visit }: { visit: VisitFromAPI }) {
  const patientName = `${visit.patient.first_name} ${visit.patient.last_name}`;
  const doctorName = visit.doctor
    ? `Dr. ${visit.doctor.first_name} ${visit.doctor.last_name}`
    : "No Doctor Assigned";

  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    partial: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 hover:bg-gray-50 transition-all border-b border-border last:border-0 gap-3">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
          {patientName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{patientName}</h3>
          <p className="text-xs text-gray-500">ID: {visit.patient.unique_id} • {visit.patient.mobile}</p>
        </div>
        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
          visit.visit_type === "OPD" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
        }`}>
          {visit.visit_type}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:flex-1 md:grid-cols-none md:flex text-sm">
        <div className="md:border-l md:border-gray-200 md:pl-4">
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
            <Stethoscope size={10} /> Doctor
          </p>
          <p className="font-medium text-gray-700 text-xs truncate max-w-32">{doctorName}</p>
        </div>
        <div className="md:border-l md:border-gray-200 md:pl-4">
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
            <Calendar size={10} /> Date
          </p>
          <p className="font-medium text-gray-700 text-xs">
            {new Date(visit.visit_date).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="md:border-l md:border-gray-200 md:pl-4">
          <p className="text-xs text-gray-400 mb-0.5">Amount</p>
          <p className="font-semibold text-gray-800">₹{Number(visit.bill.total_amount).toLocaleString("en-IN")}</p>
        </div>
        <div className="md:border-l md:border-gray-200 md:pl-4">
          <p className="text-xs text-gray-400 mb-0.5">Payment</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            statusColors[visit.bill.payment_status] ?? "bg-gray-100 text-gray-600"
          }`}>
            {visit.bill.payment_status}
          </span>
        </div>
        <div className="md:border-l md:border-gray-200 md:pl-4 flex items-center">
          <Link
            href={`/reception/patient-profile/${visit.patient.unique_id}`}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VisitBookPage() {
  const [visits, setVisits] = useState<VisitFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    visitType: "all",
    date: new Date().toISOString().split("T")[0],
    paymentStatus: "all",
  });

  const loadVisits = useCallback(async (currentPage: number, currentFilters: FilterState) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Session expired. Please log in again.");
        return;
      }

      const params: Record<string, any> = {
        page: currentPage,
        limit: 20,
      };
      if (currentFilters.date) params.date = currentFilters.date;

      const res = await getVisitsRequest(params, token);
      if (res.success) {
        setVisits(res.data as VisitFromAPI[]);
        setTotalPages(res.meta?.totalPages ?? 1);
        setTotal(res.meta?.total ?? 0);
      }
    } catch (e: any) {
      setError("Failed to load visits. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisits(page, filters);
  }, [page, filters, loadVisits]);

  // Client-side filtering for search + type + payment
  const filteredVisits = useMemo(() => {
    let result = [...visits];
    const q = filters.search.toLowerCase().trim();

    if (q) {
      result = result.filter((v) =>
        `${v.patient.first_name} ${v.patient.last_name}`.toLowerCase().includes(q) ||
        v.patient.unique_id.toLowerCase().includes(q) ||
        v.patient.mobile.includes(q) ||
        (v.doctor && `${v.doctor.first_name} ${v.doctor.last_name}`.toLowerCase().includes(q))
      );
    }

    if (filters.visitType !== "all") {
      result = result.filter((v) => v.visit_type === filters.visitType);
    }

    if (filters.paymentStatus !== "all") {
      result = result.filter((v) => v.bill.payment_status === filters.paymentStatus);
    }

    return result;
  }, [visits, filters]);

  const handleRefresh = () => loadVisits(page, filters);

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ search: "", visitType: "all", date: "", paymentStatus: "all" });
    setPage(1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-body-md text-foreground">
      <Header activeItem="Visit Book" />

      <main className="mx-auto w-full max-w-7xl grow px-4 py-6 md:px-8">
        {/* Search & Filter Bar */}
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-white"
                placeholder="Search by patient name, ID, or mobile..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2.5 border rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                  showFilters ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter size={14} /> Filters
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 items-center">
              <select
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
                value={filters.visitType}
                onChange={(e) => handleFilterChange("visitType", e.target.value as any)}
              >
                <option value="all">All Types</option>
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
              </select>
              <select
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
                value={filters.paymentStatus}
                onChange={(e) => handleFilterChange("paymentStatus", e.target.value as any)}
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
              <button
                onClick={handleResetFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X size={12} /> Reset
              </button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <span>
            {loading ? "Loading..." : `${filteredVisits.length} of ${total} visits`}
            {filters.date && ` for ${new Date(filters.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-red-700 border border-red-200 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="p-5 border-b border-gray-100 flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visit List */}
        {!loading && filteredVisits.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {filteredVisits.map((visit) => (
              <VisitCard key={visit.visit_id} visit={visit} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredVisits.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No visits found</h3>
            <p className="text-gray-400 text-sm">
              {filters.search || filters.visitType !== "all" || filters.paymentStatus !== "all"
                ? "Try adjusting your filters"
                : filters.date
                  ? "No visits recorded for this date"
                  : "No visits have been recorded yet"}
            </p>
            {(filters.search || filters.visitType !== "all") && (
              <button onClick={handleResetFilters} className="mt-4 text-blue-600 hover:underline text-sm">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
