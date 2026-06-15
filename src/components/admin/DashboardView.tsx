"use client";

import React, { useState, useEffect } from "react";
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
  Printer,
  Download,
  Filter,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { getAuditLogsRequest, getBillsReportRequest } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

interface DashboardViewProps {
  initialData: {
    success: boolean;
    metrics: {
      totalPatients: number;
      activeDoctors: number;
      departmentsCount: number;
      totalVisits: number;
      totalRevenue: number;
      todayPatients: number;
      todayRevenue: number;
      todayVisits: number;
      todayAdmissions: number;
      todayDischarges: number;
      pendingBills: number;
      labPending: number;
      lowStockMeds: number;
      emergencyCases: number;
      beds: {
        total: number;
        occupied: number;
        available: number;
      };
    };
    trends?: {
      dailyTrends: Array<{ date: string; patients: number; revenue: number }>;
      departmentLoad: Array<{ department: string; count: number }>;
      doctorWorkload: Array<{ doctor: string; visits: number }>;
      diseaseTrends: Array<{ disease: string; cases: number }>;
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Live tables fetched after mount
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [billsReport, setBillsReport] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);

  // Patient 360 viewer overlay in Admin Panel (Report Center)
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);
  const [viewingPatientData, setViewingPatientData] = useState<any>(null);
  const [loadingPatientData, setLoadingPatientData] = useState(false);

  const metrics = initialData.metrics;
  const trends = initialData.trends || {
    dailyTrends: [
      { date: "10 Jun", patients: 4, revenue: 2500 },
      { date: "11 Jun", patients: 6, revenue: 3800 },
      { date: "12 Jun", patients: 3, revenue: 1900 },
      { date: "13 Jun", patients: 8, revenue: 5100 },
      { date: "14 Jun", patients: 5, revenue: 2900 },
      { date: "15 Jun", patients: 7, revenue: 4200 },
    ],
    departmentLoad: [
      { department: "General Medicine", count: 12 },
      { department: "Cardiology", count: 8 },
      { department: "Pediatrics", count: 5 },
      { department: "Neurology", count: 3 },
    ],
    doctorWorkload: [
      { doctor: "Dr. Aarav Sharma", visits: 15 },
      { doctor: "Dr. Vikram Verma", visits: 12 },
    ],
    diseaseTrends: [
      { disease: "Diabetes", cases: 14 },
      { disease: "Hypertension", cases: 22 },
      { disease: "Asthma", cases: 8 },
      { disease: "Viral Fever", cases: 18 },
    ]
  };

  useEffect(() => {
    if (activeTab === "logs") {
      async function loadLogs() {
        setLoadingLogs(true);
        try {
          const token = await getAccessToken();
          if (token) {
            const res = await getAuditLogsRequest(token);
            if (res.success && res.data) setAuditLogs(res.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingLogs(false);
        }
      }
      loadLogs();
    } else if (activeTab === "billing") {
      async function loadBills() {
        setLoadingBills(true);
        try {
          const token = await getAccessToken();
          if (token) {
            const res = await getBillsReportRequest(token);
            if (res.success && res.data) setBillsReport(res.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingBills(false);
        }
      }
      loadBills();
    }
  }, [activeTab]);

  const handlePatientClick = async (uniqueId: string) => {
    setViewingPatientId(uniqueId);
    setLoadingPatientData(true);
    try {
      const { getPatientById } = await import("@/lib/actions/patientForm");
      const res = await getPatientById(uniqueId);
      if (res.success && res.data) {
        setViewingPatientData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPatientData(false);
    }
  };

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

  // Filters
  const filteredPatients = initialData.recentPatients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.unique_id} ${p.mobile}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = initialData.doctorsList.filter((d) =>
    `${d.first_name} ${d.last_name} ${d.specialization}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CSV Export Utility
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
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
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden relative">
      {/* MOBILE SIDEBAR OVERLAY BACKDROP */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`flex flex-col bg-slate-900 text-white border-r border-slate-800 transition-all duration-300 fixed inset-y-0 left-0 z-50 lg:static ${
          mobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
          {(!sidebarCollapsed || mobileSidebarOpen) ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white shadow-md shadow-teal-500/20">
                RH
              </div>
              <span className="font-semibold text-lg tracking-wider text-teal-400">RAJKIRAN</span>
            </div>
          ) : (
            <div className="mx-auto h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white" />
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false); // Close on mobile click
                }}
                className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                {(!sidebarCollapsed || mobileSidebarOpen) && <span className="ml-3 truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User profile footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col gap-2">
          {(!sidebarCollapsed || mobileSidebarOpen) && (
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
            {(!sidebarCollapsed || mobileSidebarOpen) && <span className="ml-2">Logout Console</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="flex h-16 w-full items-center justify-between px-4 lg:px-6 border-b border-slate-200 bg-white shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden transition"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base lg:text-lg font-semibold text-slate-900 truncate">Hospital Control Center</h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
              Live Connection
            </span>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="relative w-40 sm:w-48 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search registry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <button className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              <Bell size={18} />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            </button>
            <span className="hidden md:block h-6 w-px bg-slate-200"></span>
            <span className="hidden md:block text-xs font-medium text-slate-600">Rajkiran Enterprise ERP</span>
          </div>
        </header>

        {/* CONTAINER MAIN SCROLL */}
        <main className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* KPI 1 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Today's Patients</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.todayPatients}</h3>
                    <span className="text-[10px] text-teal-600 font-semibold block mt-1">Total database: {metrics.totalPatients}</span>
                  </div>
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Today's Revenue</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">₹{metrics.todayRevenue.toLocaleString("en-IN")}</h3>
                    <span className="text-[10px] text-teal-600 font-semibold block mt-1">Total revenue: ₹{metrics.totalRevenue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl">
                    <DollarSign size={20} />
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Emergency Cases</span>
                    <h3 className="text-2xl font-black text-rose-600 mt-1">{metrics.emergencyCases}</h3>
                    <span className="text-[10px] text-rose-500 font-semibold block mt-1">Critical alerts active</span>
                  </div>
                  <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertCircle size={20} />
                  </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Beds Occupancy</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.beds.occupied} / {metrics.beds.total}</h3>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-1">{metrics.beds.available} general beds free</span>
                  </div>
                  <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Activity size={20} />
                  </div>
                </div>
              </div>

              {/* Sub Grid 2: Today's Telemetry & Bed capacity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex justify-between items-center">
                    <span>Clinical Revenue & Patient Load Trends (Last 7 Days)</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">EHR Telemetry</span>
                  </h3>
                  <div className="h-44 flex items-end gap-3 pt-4 border-b border-slate-100 pb-2">
                    {trends.dailyTrends.map((t, idx) => {
                      const maxPatients = Math.max(...trends.dailyTrends.map(x => x.patients)) || 10;
                      const heightPercent = Math.min(100, Math.max(15, (t.patients / maxPatients) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                          <div className="text-[9px] text-slate-400 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {t.patients} pts
                          </div>
                          <div className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-t" style={{ height: `${heightPercent}%` }}></div>
                          <span className="text-[10px] text-slate-500 font-bold mt-2">{t.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Operational Status</h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Pending Lab Reports</span>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{metrics.labPending} reports</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Today's OPD Admissions</span>
                      <span className="font-bold text-slate-800">{metrics.todayVisits} consults</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Today's IPD Admissions</span>
                      <span className="font-bold text-slate-800">{metrics.todayAdmissions} files</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Today's Discharges</span>
                      <span className="font-bold text-slate-800">{metrics.todayDischarges} files</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Unpaid / Pending Bills</span>
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{metrics.pendingBills} pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disease load & doctor workload grids */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">Department Consult Load</h4>
                  <div className="space-y-2.5">
                    {trends.departmentLoad.map((dept, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex justify-between font-medium text-slate-700 mb-1">
                          <span>{dept.department}</span>
                          <span>{dept.count} cases</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min(100, (dept.count / 20) * 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">Common Pathologies / Diseases</h4>
                  <div className="space-y-2.5">
                    {trends.diseaseTrends.map((dis, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex justify-between font-medium text-slate-700 mb-1">
                          <span>{dis.disease}</span>
                          <span>{dis.cases} cases</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, (dis.cases / 30) * 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">Doctor Workload Load</h4>
                  <div className="space-y-2.5">
                    {trends.doctorWorkload.map((doc, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex justify-between font-medium text-slate-700 mb-1">
                          <span>{doc.doctor}</span>
                          <span>{doc.visits} visits</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, (doc.visits / 25) * 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PATIENT QUEUE (Report Center Search) */}
          {activeTab === "patients" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">Patients Registry (Report Center)</h3>
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
                      <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                        <th className="px-6 py-3">Patient ID</th>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Mobile Contact</th>
                        <th className="px-6 py-3">Register Date</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredPatients.map((patient) => (
                        <tr key={patient.patient_id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-teal-600">{patient.unique_id}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {patient.first_name} {patient.last_name}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{patient.mobile}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(patient.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handlePatientClick(patient.unique_id)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 font-bold rounded-lg text-[10px] transition"
                            >
                              Report Viewer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* REPORT VIEWER SLIDEOVER PANEL (Module 2 Admin Report Center) */}
              {viewingPatientId && (
                <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Patient Report Viewer: <span className="font-mono text-blue-700">{viewingPatientId}</span></h3>
                      <p className="text-[10px] text-slate-500">Full medical timelines and clinical trends</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                        title="Print Report"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => setViewingPatientId(null)}
                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition text-xs font-bold"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {loadingPatientData ? (
                    <div className="py-12 flex justify-center items-center gap-2 text-slate-400">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Assembling EHR record...</span>
                    </div>
                  ) : viewingPatientData ? (
                    <div className="space-y-6 text-xs text-slate-700">
                      {/* Timeline Flow Chart */}
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                        <h4 className="font-bold text-slate-800 text-[10px] uppercase mb-4 tracking-wider">EHR Medical Timeline Sequence</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-1 rounded font-bold">First Visit</span>
                          <ChevronRight size={14} className="text-slate-400" />
                          <span className="bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-1 rounded font-bold">Diagnosis</span>
                          <ChevronRight size={14} className="text-slate-400" />
                          <span className="bg-indigo-50 text-indigo-800 border border-indigo-100 px-2.5 py-1 rounded font-bold">Prescription</span>
                          <ChevronRight size={14} className="text-slate-400" />
                          <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-1 rounded font-bold">Follow-up</span>
                          <ChevronRight size={14} className="text-slate-400" />
                          <span className="bg-purple-50 text-purple-800 border border-purple-100 px-2.5 py-1 rounded font-bold">Admissions</span>
                          <ChevronRight size={14} className="text-slate-400" />
                          <span className="bg-rose-50 text-rose-800 border border-rose-100 px-2.5 py-1 rounded font-bold">Discharges</span>
                        </div>
                      </div>

                      {/* Timeline Table */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold text-slate-800 text-[10px] uppercase mb-3 tracking-wider">Clinical Trends (Vitals)</h4>
                          <div className="space-y-2 border border-slate-100 rounded-lg p-3 bg-white max-h-48 overflow-y-auto">
                            {viewingPatientData.visits?.map((v: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] py-1.5 border-b border-slate-50 last:border-0">
                                <span className="font-bold text-slate-500">{new Date(v.visit_date).toLocaleDateString()}</span>
                                <span className="font-semibold text-slate-700">BP: {v.vitals?.blood_pressure || "N/A"} | Temp: {v.vitals?.temperature || "N/A"}°F</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-800 text-[10px] uppercase mb-3 tracking-wider">Diagnosis & Prescriptions</h4>
                          <div className="space-y-2 border border-slate-100 rounded-lg p-3 bg-white max-h-48 overflow-y-auto">
                            {viewingPatientData.visits?.map((v: any, idx: number) => (
                              <div key={idx} className="text-[11px] py-2 border-b border-slate-50 last:border-0">
                                <div className="flex justify-between font-bold text-slate-800">
                                  <span>{v.doctor ? `Dr. ${v.doctor.first_name} ${v.doctor.last_name}` : "GeneralWard"}</span>
                                  <span className="text-blue-600 text-[10px]">{v.visit_type}</span>
                                </div>
                                <p className="text-slate-500 mt-1"><strong>Complaint:</strong> {v.chief_complaint || "N/A"}</p>
                                <p className="text-slate-500"><strong>Advised Notes:</strong> {v.visit_notes || "N/A"}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs">Patient details not found.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCTORS REGISTRY */}
          {activeTab === "doctors" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Doctors Roster</h3>
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
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <th className="px-6 py-3">Doctor</th>
                      <th className="px-6 py-3">Specialization</th>
                      <th className="px-6 py-3">Contact Email</th>
                      <th className="px-6 py-3">Consultation Fee</th>
                      <th className="px-6 py-3">Availability Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.doctor_id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-900">Dr. {doc.first_name} {doc.last_name}</td>
                        <td className="px-6 py-4 text-slate-700">{doc.specialization} ({doc.qualification})</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{doc.email}</td>
                        <td className="px-6 py-4 text-slate-900 font-bold">₹{Number(doc.consultation_fee)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.status === "active" ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>{doc.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DEPARTMENTS */}
          {activeTab === "departments" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Seeded Hospital Departments</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "General Medicine", desc: "General health, diagnoses, and primary care", code: "GM" },
                  { name: "Cardiology", desc: "Heart and circulatory health care", code: "CAR" },
                  { name: "Neurology", desc: "Brain, spinal cord, and nervous system disorders", code: "NEUR" },
                  { name: "Orthopedics", desc: "Bones, joints, ligaments, tendons, and muscles", code: "ORTH" },
                  { name: "ENT", desc: "Ear, Nose, and Throat specialties", code: "ENT" },
                  { name: "Dermatology", desc: "Skin, hair, and nail health and diseases", code: "DERM" },
                  { name: "Pediatrics", desc: "Care of infants, children, and adolescents", code: "PED" },
                  { name: "Psychiatry", desc: "Mental health and behavioral disorders", code: "PSY" },
                  { name: "Urology", desc: "Urinary tract and male reproductive system", code: "UROL" },
                  { name: "Oncology", desc: "Cancer diagnosis, treatment, and care", code: "ONCO" },
                  { name: "Pulmonology", desc: "Respiratory system and lung conditions", code: "PULM" },
                  { name: "Emergency", desc: "Immediate acute care and trauma response", code: "ER" },
                  { name: "Radiology", desc: "Imaging diagnostics (X-ray, MRI, CT)", code: "RAD" },
                  { name: "Pathology", desc: "Laboratory diagnostics and tests", code: "PATH" },
                  { name: "Gynecology", desc: "Female reproductive health and pregnancy", code: "GYN" },
                ].map((dept, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition bg-slate-50/30 flex gap-4">
                    <div className="w-10 h-10 bg-teal-500 text-white rounded-lg flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 shadow shadow-teal-500/10">
                      {dept.code}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{dept.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{dept.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: WARD & BEDS */}
          {activeTab === "beds" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Ward & Bed Management</h3>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {[
                  { num: "ICU-101", status: "Occupied", patient: "Sujal Kumar" },
                  { num: "ICU-102", status: "Available", patient: "" },
                  { num: "ICU-103", status: "Occupied", patient: "Arman khan" },
                  { num: "GW-201", status: "Occupied", patient: "Anas Khan" },
                  { num: "GW-202", status: "Available", patient: "" },
                  { num: "GW-203", status: "Available", patient: "" },
                  { num: "GW-204", status: "Available", patient: "" },
                  { num: "PED-301", status: "Occupied", patient: "testi kumar" },
                  { num: "PED-302", status: "Available", patient: "" },
                  { num: "CARD-401", status: "Available", patient: "" },
                  { num: "CARD-402", status: "Available", patient: "" },
                ].map((bed, idx) => (
                  <div key={idx} className={`border rounded-xl p-3.5 text-center transition flex flex-col justify-between h-28 ${
                    bed.status === "Occupied" ? "bg-rose-50/50 border-rose-200 text-rose-800" : "bg-teal-50/30 border-teal-200 text-teal-800"
                  }`}>
                    <span className="font-mono font-bold text-xs">{bed.num}</span>
                    <span className="text-[10px] font-semibold uppercase">{bed.status}</span>
                    <span className="text-[9px] font-bold truncate text-slate-600 block mt-1">{bed.patient || "Vacant"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: BILLING */}
          {activeTab === "billing" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Revenue Ledger Reports</h3>
                <button
                  onClick={() => exportToCSV(billsReport, "billing_report.csv")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Export LEDGER (CSV)
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <th className="px-6 py-3">Bill ID</th>
                      <th className="px-6 py-3">Patient Account</th>
                      <th className="px-6 py-3">Itemized Subtotals</th>
                      <th className="px-6 py-3">Tax / Discount</th>
                      <th className="px-6 py-3">Grand Total</th>
                      <th className="px-6 py-3">Status / Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loadingBills ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">Loading ledger records...</td>
                      </tr>
                    ) : billsReport.map((b) => {
                      const v = b.visits?.[0];
                      const patientName = v?.patient ? `${v.patient.first_name} ${v.patient.last_name}` : "Walk-in";
                      const uniqueId = v?.patient?.unique_id || "N/A";

                      return (
                        <tr key={b.bill_id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono text-slate-500">{b.bill_id.slice(0, 8)}...</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{patientName} ({uniqueId})</td>
                          <td className="px-6 py-4 text-slate-600">
                            Consult: ₹{Number(b.consultation_fee)} | Reg: ₹{Number(b.registration_fee)} | Tests: ₹{Number(b.tests_fee)} | Meds: ₹{Number(b.medicines_fee)} | Extra: ₹{Number(b.extra_charges)}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            Tax: ₹{Number(b.tax)} | Disc: -₹{Number(b.discount)}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">₹{Number(b.total_amount).toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.payment_status === "paid" ? "bg-green-50 text-green-700 border border-green-150" : "bg-amber-50 text-amber-700 border border-amber-150"
                            }`}>{b.payment_status}</span>
                            <span className="block text-[10px] font-mono text-slate-400 uppercase mt-0.5">{b.payment_method}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Essential Meds Pharmacy Stock</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <th className="px-6 py-3">Medicine Name</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Current Stock</th>
                      <th className="px-6 py-3">Unit Cost</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {[
                      { name: "Tab. Metformin 500mg", cat: "Anti-Diabetic", qty: 450, cost: 5 },
                      { name: "Tab. Amlodipine 5mg", cat: "Anti-Hypertensive", qty: 380, cost: 4 },
                      { name: "Tab. Paracetamol 650mg", cat: "Analgesic", qty: 80, cost: 2 }, // Low stock!
                      { name: "Tab. Cetirizine 10mg", cat: "Anti-Allergic", qty: 250, cost: 3 },
                      { name: "Tab. Metoprolol 25mg", cat: "Cardio Beta-Blocker", qty: 150, cost: 6 },
                      { name: "Tab. Pantoprazole 40mg", cat: "Antacid", qty: 500, cost: 5 },
                    ].map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-900">{med.name}</td>
                        <td className="px-6 py-4 text-slate-700">{med.cat}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">{med.qty} tabs</td>
                        <td className="px-6 py-4 text-slate-900">₹{med.cost}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            med.qty < 100 ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse" : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}>
                            {med.qty < 100 ? "LOW STOCK" : "IN STOCK"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {activeTab === "logs" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Database System Audit Trail</h3>
                <button
                  onClick={() => exportToCSV(auditLogs, "audit_trail.csv")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Export Audit Trail (CSV)
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Account User</th>
                      <th className="px-6 py-3">Action Type</th>
                      <th className="px-6 py-3">Object / Entity</th>
                      <th className="px-6 py-3">Detailed Log Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400">Loading audit trail logs...</td>
                      </tr>
                    ) : auditLogs.map((log) => (
                      <tr key={log.log_id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{log.admin?.username} ({log.admin?.role})</td>
                        <td className="px-6 py-4 font-bold text-teal-700">{log.action_type}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600 font-mono">{log.target_type}</td>
                        <td className="px-6 py-4 text-slate-700 max-w-sm whitespace-normal break-words">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
