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
  ArrowRight,
  Trash2,
  Edit,
  Key,
  Database,
  UserPlus,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import {
  getAuditLogsRequest,
  getBillsReportRequest,
  backupDatabaseRequest,
  restoreDatabaseRequest,
  getUsersRequest,
  createUserRequest,
  updateUserRequest,
  resetUserPasswordRequest,
  createDoctorRequest,
  updateDoctorRequest,
  deleteDoctorRequest,
  createDepartmentRequest,
  updateDepartmentRequest,
  deleteDepartmentRequest,
  deletePatientRequest,
  getPatientImpactRequest,
  updatePatientRequest,
  updateVisitRequest,
  deleteVisitRequest,
  getDepartmentsRequest,
  getPatientsRequest
} from "@/lib/api-client";
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

  // User Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("receptionist");
  const [selectedResetUser, setSelectedResetUser] = useState<any | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");

  // Doctor & Department States
  const [doctorsRegistry, setDoctorsRegistry] = useState<any[]>(initialData.doctorsList);
  const [departmentsRegistry, setDepartmentsRegistry] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Patient Registry Pagination States
  const [patients, setPatients] = useState<any[]>(initialData.recentPatients);
  const [patientsPage, setPatientsPage] = useState(1);
  const [loadingMorePatients, setLoadingMorePatients] = useState(false);
  const [hasMorePatients, setHasMorePatients] = useState(
    initialData.recentPatients.length < (initialData.metrics?.totalPatients || 0)
  );

  // Doctor form modals
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [docForm, setDocForm] = useState({ first_name: "", last_name: "", email: "", mobile: "", specialization: "", qualification: "", consultation_fee: 500, department_id: "", status: "active" });
  const [showDocModal, setShowDocModal] = useState(false);

  // Department form modals
  const [selectedDept, setSelectedDept] = useState<any | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", status: "active" });
  const [showDeptModal, setShowDeptModal] = useState(false);

  // Delete Patient Modal States
  const [deletingPatient, setDeletingPatient] = useState<any | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<any | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [permanentDelete, setPermanentDelete] = useState(false);

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

    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const token = await getAccessToken();
        if (token) {
          const res = await getUsersRequest(1, 100, token);
          if (res.success && res.data) setUsersList(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingUsers(false);
      }
    }

    async function loadDepartments() {
      setLoadingDepartments(true);
      try {
        const token = await getAccessToken();
        if (token) {
          const res = await getDepartmentsRequest(token);
          if (res.success && res.data) {
            setDepartmentsRegistry(res.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDepartments(false);
      }
    }

    if (activeTab === "logs") {
      loadLogs();
    } else if (activeTab === "billing") {
      loadBills();
    } else if (activeTab === "admin-controls") {
      loadUsers();
      loadDepartments();
    } else if (activeTab === "departments") {
      loadDepartments();
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
    { id: "admin-controls", label: "Admin Operations", icon: Shield },
    { id: "logs", label: "System Audit Logs", icon: Clock },
  ];

  // Filters
  const filteredPatients = patients.filter((p) =>
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

  const loadMorePatients = async () => {
    if (loadingMorePatients) return;
    setLoadingMorePatients(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const nextPage = patientsPage + 1;
      const res = await getPatientsRequest(nextPage, 10, token);
      if (res && res.success && res.data) {
        setPatients((prev) => [...prev, ...res.data]);
        setPatientsPage(nextPage);
        if (res.meta) {
          setHasMorePatients(patients.length + res.data.length < res.meta.total);
        } else {
          setHasMorePatients(res.data.length === 10);
        }
      }
    } catch (err) {
      console.error("Failed fetching next page of patients:", err);
    } finally {
      setLoadingMorePatients(false);
    }
  };

  // 1. Backup DB Handler
  const handleBackup = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await backupDatabaseRequest(token);
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rajkiran-db-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      }
    } catch (e) {
      alert("Backup failed. Please try again.");
    }
  };

  // 2. Restore DB Handler
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        const token = await getAccessToken();
        if (!token) return;
        const res = await restoreDatabaseRequest(parsed, token);
        if (res.success) {
          alert("Database restored successfully!");
          window.location.reload();
        }
      } catch (err) {
        alert("Failed to restore database. Invalid backup file format.");
      }
    };
    reader.readAsText(file);
  };

  // 3. User Activation & Role updates
  const handleUserStatusChange = async (userId: string, active: boolean) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      await updateUserRequest(userId, { is_active: active }, token);
      setUsersList(prev => prev.map(u => u.user_id === userId ? { ...u, is_active: active } : u));
    } catch (err) {
      alert("Failed to update user status.");
    }
  };

  const handleUserRoleChange = async (userId: string, role: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      await updateUserRequest(userId, { role }, token);
      setUsersList(prev => prev.map(u => u.user_id === userId ? { ...u, role } : u));
    } catch (err) {
      alert("Failed to update user role.");
    }
  };

  // 4. Reset Password handler
  const handlePasswordReset = async () => {
    if (!selectedResetUser || !resetPasswordVal.trim()) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      await resetUserPasswordRequest(selectedResetUser.user_id, { password: resetPasswordVal.trim() }, token);
      alert("Password reset successfully!");
      setSelectedResetUser(null);
      setResetPasswordVal("");
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

  // 5. Add User Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserPassword.trim()) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await createUserRequest({ username: newUsername.trim(), password: newUserPassword.trim(), role: newUserRole }, token);
      if (res.success) {
        alert("User created successfully!");
        setNewUsername("");
        setNewUserPassword("");
        // Refresh users list
        const refreshed = await getUsersRequest(1, 100, token);
        if (refreshed.success && refreshed.data) setUsersList(refreshed.data);
      }
    } catch (err) {
      alert("Failed to create user. Username may already exist.");
    }
  };

  // 6. Doctor Management Handlers
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAccessToken();
      if (!token) return;
      if (selectedDoctor) {
        const res = await updateDoctorRequest(selectedDoctor.doctor_id, docForm, token);
        if (res.success) {
          alert("Doctor details updated!");
          setDoctorsRegistry(prev => prev.map(d => d.doctor_id === selectedDoctor.doctor_id ? res.data : d));
        }
      } else {
        const res = await createDoctorRequest(docForm, token);
        if (res.success) {
          alert("New doctor registered!");
          setDoctorsRegistry(prev => [...prev, res.data]);
        }
      }
      setShowDocModal(false);
      setSelectedDoctor(null);
    } catch (err) {
      alert("Failed to save doctor details.");
    }
  };

  const handleDeleteDoctor = async (docId: string, permanent: boolean) => {
    if (!confirm("Are you sure you want to remove this doctor?")) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      await deleteDoctorRequest(docId, permanent, token);
      setDoctorsRegistry(prev => prev.filter(d => d.doctor_id !== docId));
      alert("Doctor removed successfully.");
    } catch (err) {
      alert("Failed to delete doctor.");
    }
  };

  // 7. Department Management Handlers
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAccessToken();
      if (!token) return;
      if (selectedDept) {
        const res = await updateDepartmentRequest(selectedDept.department_id, deptForm, token);
        if (res.success) {
          alert("Department updated successfully!");
          setDepartmentsRegistry(prev => prev.map(d => d.department_id === selectedDept.department_id ? res.data : d));
        }
      } else {
        const res = await createDepartmentRequest(deptForm, token);
        if (res.success) {
          alert("Department created successfully!");
          setDepartmentsRegistry(prev => [...prev, res.data]);
        }
      }
      setShowDeptModal(false);
      setSelectedDept(null);
    } catch (err) {
      alert("Failed to save department details.");
    }
  };

  const handleDeleteDept = async (deptId: string, permanent: boolean) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      await deleteDepartmentRequest(deptId, permanent, token);
      setDepartmentsRegistry(prev => prev.filter(d => d.department_id !== deptId));
      alert("Department deleted.");
    } catch (err) {
      alert("Failed to delete department.");
    }
  };

  // 8. Patient Deletion Handler
  const handleInitiateDeletePatient = async (patient: any) => {
    setDeletingPatient(patient);
    setLoadingImpact(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await getPatientImpactRequest(patient.unique_id, token);
      if (res.success) {
        setDeleteImpact(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImpact(false);
    }
  };

  const handleConfirmDeletePatient = async () => {
    if (!deletingPatient) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      await deletePatientRequest(deletingPatient.unique_id, permanentDelete, token);
      alert(permanentDelete ? "Patient permanently deleted." : "Patient soft deleted.");
      setDeletingPatient(null);
      setDeleteImpact(null);
      window.location.reload();
    } catch (err) {
      alert("Failed to delete patient.");
    }
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
                    onClick={() => exportToCSV(patients, "patients_list.csv")}
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
                {hasMorePatients && (
                  <div className="flex justify-center p-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={loadMorePatients}
                      disabled={loadingMorePatients}
                      className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 disabled:opacity-50 rounded-lg transition shadow-sm flex items-center gap-2"
                    >
                      {loadingMorePatients ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "View More Patients"
                      )}
                    </button>
                  </div>
                )}
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

          {/* TAB 9: ADMIN CONTROLS OPERATIONS CENTER */}
          {activeTab === "admin-controls" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Row 1: Backup & Restore */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Database size={18} className="text-teal-600" /> Database Backup & Recovery
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Download full database table dumps in JSON format or restore the database schema records.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 md:justify-end">
                  <button
                    onClick={handleBackup}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download size={14} /> Download Backup JSON
                  </button>
                  <label className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                    <RefreshCw size={14} /> Upload & Restore DB
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestore}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Row 2: User management & Register User */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-sm">Active Staff Accounts</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                          <th className="px-5 py-3">Username</th>
                          <th className="px-5 py-3">Role</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingUsers ? (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-slate-400">Loading accounts...</td>
                          </tr>
                        ) : usersList.map(u => (
                          <tr key={u.user_id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3 font-semibold text-slate-800">{u.username}</td>
                            <td className="px-5 py-3 uppercase font-mono text-[10px] text-slate-500">{u.role}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                u.is_active ? "bg-green-50 text-green-700 border border-green-150" : "bg-red-50 text-red-700 border border-red-150"
                              }`}>{u.is_active ? "active" : "inactive"}</span>
                            </td>
                            <td className="px-5 py-3 text-right space-x-1.5">
                              <button
                                onClick={() => setSelectedResetUser(u)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition"
                              >
                                Reset Pass
                              </button>
                              {u.is_active ? (
                                <button
                                  onClick={() => handleUserStatusChange(u.user_id, false)}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-semibold transition"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserStatusChange(u.user_id, true)}
                                  className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded text-[10px] font-semibold transition"
                                >
                                  Activate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add User Form */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <UserPlus size={16} className="text-teal-600" /> Register New Account
                  </h3>
                  <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Username</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Password</label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Access Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="receptionist">Receptionist</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition"
                    >
                      Create User Account
                    </button>
                  </form>
                </div>
              </div>

              {/* Row 3: Doctors registry CRUD */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">Doctors Registry Management</h3>
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      setDocForm({ first_name: "", last_name: "", email: "", mobile: "", specialization: "", qualification: "", consultation_fee: 500, department_id: departmentsRegistry[0]?.department_id || "", status: "active" });
                      setShowDocModal(true);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    Add New Doctor
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                        <th className="px-6 py-3">Doctor</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Fee</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {doctorsRegistry.map(d => (
                        <tr key={d.doctor_id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-800">Dr. {d.first_name} {d.last_name} ({d.specialization})</td>
                          <td className="px-6 py-4 text-slate-600">{d.department?.name || "N/A"}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">₹{Number(d.consultation_fee)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              d.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>{d.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedDoctor(d);
                                setDocForm({ ...d });
                                setShowDocModal(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                              title="Edit Details"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteDoctor(d.doctor_id, false)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                              title="Soft Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 4: Department registry CRUD */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">Department Registry Management</h3>
                  <button
                    onClick={() => {
                      setSelectedDept(null);
                      setDeptForm({ name: "", description: "", status: "active" });
                      setShowDeptModal(true);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    Create Department
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                        <th className="px-6 py-3">Department Name</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentsRegistry.map(dept => (
                        <tr key={dept.department_id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-800">{dept.name}</td>
                          <td className="px-6 py-4 text-slate-500">{dept.description || "No description"}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              dept.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            }`}>{dept.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedDept(dept);
                                setDeptForm({ name: dept.name, description: dept.description || "", status: dept.status as any });
                                setShowDeptModal(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(dept.department_id, false)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 5: Patient search and deletion */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Administrative Patient Deletion</h3>
                <p className="text-xs text-slate-500">
                  Search patients by name or ID to initiate a soft delete or hard delete with full impact validation.
                </p>
                <div className="space-y-3">
                  {filteredPatients.map(p => (
                    <div key={p.patient_id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{p.first_name} {p.last_name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{p.unique_id} • {p.mobile}</span>
                      </div>
                      <button
                        onClick={() => handleInitiateDeletePatient(p)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold transition"
                      >
                        Delete Patient Record
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* OVERLAY MODAL: PASSWORD RESET */}
      {selectedResetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100 text-slate-800">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-1.5">
              <Key size={18} className="text-teal-600" /> Reset Password
            </h3>
            <p className="text-xs text-slate-500">
              Enter a new secure password for account: <strong>{selectedResetUser.username}</strong>
            </p>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button
                onClick={() => { setSelectedResetUser(null); setResetPasswordVal(""); }}
                className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition"
              >
                Reset Account Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: DOCTOR REGISTRATION FORM */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleDoctorSubmit} className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 text-slate-850 text-xs">
            <h3 className="font-black text-lg text-slate-900">
              {selectedDoctor ? "Edit Doctor Details" : "Register New Specialist Doctor"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={docForm.first_name}
                  onChange={(e) => setDocForm(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={docForm.last_name}
                  onChange={(e) => setDocForm(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={docForm.specialization}
                  onChange={(e) => setDocForm(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Qualification</label>
                <input
                  type="text"
                  required
                  value={docForm.qualification}
                  onChange={(e) => setDocForm(prev => ({ ...prev, qualification: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email</label>
              <input
                type="email"
                required
                value={docForm.email}
                onChange={(e) => setDocForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  required
                  value={docForm.mobile}
                  onChange={(e) => setDocForm(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Consultation Fee (INR)</label>
                <input
                  type="number"
                  required
                  value={docForm.consultation_fee}
                  onChange={(e) => setDocForm(prev => ({ ...prev, consultation_fee: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Department</label>
                <select
                  value={docForm.department_id}
                  onChange={(e) => setDocForm(prev => ({ ...prev, department_id: e.target.value }))}
                  className="w-full p-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select Department</option>
                  {departmentsRegistry.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
                <select
                  value={docForm.status}
                  onChange={(e) => setDocForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3 text-xs">
              <button
                type="button"
                onClick={() => { setShowDocModal(false); setSelectedDoctor(null); }}
                className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg"
              >
                Save Doctor Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OVERLAY MODAL: DEPARTMENT CREATE/EDIT */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleDeptSubmit} className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100 text-slate-800 text-xs">
            <h3 className="font-black text-lg text-slate-900">
              {selectedDept ? "Edit Department" : "Create Clinical Department"}
            </h3>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Department Name</label>
              <input
                type="text"
                required
                value={deptForm.name}
                onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Description</label>
              <textarea
                value={deptForm.description}
                onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
              <select
                value={deptForm.status}
                onChange={(e) => setDeptForm(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full p-2 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-3 text-xs">
              <button
                type="button"
                onClick={() => { setShowDeptModal(false); setSelectedDept(null); }}
                className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg"
              >
                Save Department
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OVERLAY MODAL: CONFIRM DELETE PATIENT WITH IMPACT SUMMARY */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 text-slate-800">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-1.5">
              <AlertCircle size={20} className="text-rose-600" /> Confirm Patient Deletion
            </h3>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
              <p>Warning: Deleting patient records cannot be undone. Please verify target details.</p>
              <p className="font-bold">Target: {deletingPatient.first_name} {deletingPatient.last_name} ({deletingPatient.unique_id})</p>
            </div>

            {loadingImpact ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" /> Verifying related visits impact...
              </div>
            ) : deleteImpact ? (
              <div className="text-xs space-y-2">
                <p className="font-semibold text-slate-700">Delete Impact Summary:</p>
                <ul className="list-disc pl-5 text-slate-500 space-y-1">
                  <li>Total Visits to remove: <strong>{deleteImpact.visitsCount} visits</strong></li>
                  <li>All vitals and bills attached to this record will be cleared.</li>
                </ul>
              </div>
            ) : null}

            <div className="space-y-2 pt-2 text-xs">
              <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permanentDelete}
                  onChange={(e) => setPermanentDelete(e.target.checked)}
                  className="rounded border-slate-350 focus:ring-teal-500 h-4 w-4"
                />
                Permanently purge data from database (Hard Delete)
              </label>
              <p className="text-[10px] text-slate-400 pl-6">
                Unchecked performs a soft delete, preserving records in archive but removing from all activeReception queues.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-3 text-xs">
              <button
                onClick={() => { setDeletingPatient(null); setDeleteImpact(null); setPermanentDelete(false); }}
                className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletePatient}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
              >
                Execute Record Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: GENERAL BILL VIEWER IN REVERE */}
    </div>
  );
}
