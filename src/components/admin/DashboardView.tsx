"use client";

import React, { useState } from "react";
import {
  Users,
  Activity,
  Heart,
  TrendingUp,
  Clock,
  LogOut,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  Layers,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Search,
  Bell,
  CheckCircle,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

interface DashboardViewProps {
  initialData: {
    success: boolean;
    metrics: {
      totalPatients: number;
      activeDoctors: number;
      departmentsCount: number;
      totalVisits: number;
      revenue: number;
      beds: {
        total: number;
        occupied: number;
        available: number;
      };
      labPending: number;
      lowStockMeds: number;
      emergencyCases: number;
    };
    recentPatients: Array<{
      patient_id: string;
      unique_id: string;
      first_name: string;
      last_name: string;
      mobile: string;
      created_at: string;
    }>;
    doctorsList: Array<{
      doctor_id: string;
      first_name: string;
      last_name: string;
      specialization: string;
      qualification: string;
      mobile: string;
      email: string;
      consultation_fee: string;
      status: string;
      department?: {
        name: string;
      };
    }>;
  };
}

export default function DashboardView({ initialData }: DashboardViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const metrics = initialData.metrics;

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  // Sidebar items
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart2 },
    { id: "patients", label: "Patients Queue", icon: Users },
    { id: "doctors", label: "Doctor Registry", icon: Heart },
    { id: "departments", label: "Departments", icon: Layers },
    { id: "beds", label: "Ward & Bed Management", icon: Activity },
    { id: "billing", label: "Revenue & Billing", icon: DollarSign },
    { id: "inventory", label: "Inventory & Meds", icon: Package },
    { id: "logs", label: "System Audit Logs", icon: Shield },
  ];

  // Search filter for lists
  const filteredPatients = initialData.recentPatients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.unique_id}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = initialData.doctorsList.filter((d) =>
    `${d.first_name} ${d.last_name} ${d.specialization}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CSV Export Utility
  const exportToCSV = (data: any[], filename: string) => {
    const csvRows = [];
    const headers = Object.keys(data[0] || {});
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    a.click();
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside
        className={`flex flex-col bg-slate-900 text-white transition-all duration-300 border-r border-slate-800 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white shadow-md shadow-teal-500/20">
                RH
              </div>
              <span className="font-semibold text-lg tracking-wider text-teal-400">RAJKIRAN</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 py-4 px-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                {!sidebarCollapsed && <span className="ml-3 truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User profile footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col gap-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-white">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">Administrator</p>
                <p className="text-[10px] text-slate-500 truncate">admin@hospital.com</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full py-2 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 rounded-lg text-xs font-medium transition"
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span className="ml-2">Logout Console</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="flex h-16 w-full items-center justify-between px-6 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">Hospital Control Center</h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
              Live Connection
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input bar */}
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search metrics, registry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            {/* Action icons */}
            <button className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              <Bell size={18} />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            </button>
            <span className="h-6 w-px bg-slate-200"></span>
            <span className="text-xs font-medium text-slate-600">Rajkiran Enterprise ERP v1.2</span>
          </div>
        </header>

        {/* CONTAINER MAIN SCROLL */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Patients</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalPatients}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-teal-600 font-semibold mt-2">
                      <TrendingUp size={12} />
                      <span>+12% vs last month</span>
                    </div>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                    <Users size={22} />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Staff Doctors</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.activeDoctors}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-teal-600 font-semibold mt-2">
                      <CheckCircle size={12} />
                      <span>100% available</span>
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <Heart size={22} />
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Revenue</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{metrics.revenue.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-teal-600 font-semibold mt-2">
                      <TrendingUp size={12} />
                      <span>+8% growth trend</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <DollarSign size={22} />
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Beds Occupancy</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                      {metrics.beds.occupied} / {metrics.beds.total}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-2">
                      <span>{metrics.beds.available} Available beds</span>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                    <Activity size={22} />
                  </div>
                </div>
              </div>

              {/* Sub grid details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bed Allocation Panel */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900 text-sm">Real-time Emergency & Bed status</h3>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>ICU Capacity</span>
                        <span>78% occupied</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: "78%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>General Wards</span>
                        <span>42% occupied</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: "42%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>Pediatrics Ward</span>
                        <span>15% occupied</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: "15%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Dashboard Summary */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h3 className="font-semibold text-slate-900 text-sm pb-2 border-b border-slate-100">
                    Operating System Widgets
                  </h3>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">Pending Lab Reports</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 font-semibold">
                      {metrics.labPending} reports
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">Low Stock Medicines</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 font-semibold">
                      {metrics.lowStockMeds} meds
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">ICU Admissions Today</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 font-semibold">
                      {metrics.emergencyCases} cases
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "patients" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 text-sm">Hospital Registry Queue</h3>
                <button
                  onClick={() => exportToCSV(initialData.recentPatients, "patients_list.csv")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Export Data (CSV)
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                      <th className="px-6 py-3">Patient ID</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Mobile Contact</th>
                      <th className="px-6 py-3">Register Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.patient_id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono font-semibold text-teal-600">{patient.unique_id}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {patient.first_name} {patient.last_name}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{patient.mobile}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(patient.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400">
                          No patients matched your search queries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "doctors" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 text-sm">Doctor Roster & Availability</h3>
                <button
                  onClick={() => exportToCSV(initialData.doctorsList, "doctors_list.csv")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Export Data (CSV)
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                      <th className="px-6 py-3">Doctor</th>
                      <th className="px-6 py-3">Specialization</th>
                      <th className="px-6 py-3">Qualification</th>
                      <th className="px-6 py-3">Consultation Fee</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.doctor_id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          Dr. {doc.first_name} {doc.last_name}
                        </td>
                        <td className="px-6 py-4 text-slate-700">{doc.specialization}</td>
                        <td className="px-6 py-4 text-slate-600">{doc.qualification}</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">₹{Number(doc.consultation_fee)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              doc.status === "active"
                                ? "bg-teal-50 text-teal-700 border border-teal-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredDoctors.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">
                          No doctors found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fallback default screen details */}
          {!["dashboard", "patients", "doctors"].includes(activeTab) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
              <Layers className="mx-auto text-slate-400" size={32} />
              <h3 className="font-semibold text-slate-900 text-sm">Section under maintenance</h3>
              <p className="text-xs text-slate-500">
                This administrative section ({activeTab}) is scheduled to be connected to live database integrations.
                Refer to your main Dashboard for general telemetry parameters.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
