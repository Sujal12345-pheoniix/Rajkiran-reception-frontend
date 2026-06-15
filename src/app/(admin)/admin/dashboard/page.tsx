import React from "react";
import { requireAdmin, getAccessToken } from "@/lib/auth";
import { getAnalyticsRequest } from "@/lib/api-client";
import DashboardView from "@/components/admin/DashboardView";

export default async function page() {
  const admin = await requireAdmin();

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-10 bg-slate-900 text-white">
        <div className="rounded-lg p-8 border border-slate-800 bg-slate-950 flex-1 max-w-lg shadow-xl text-center">
          <h1 className="text-2xl font-bold text-slate-100">Access Restricted</h1>
          <p className="mt-2 text-sm text-slate-400">
            You do not have permissions to access the Admin Control Center.
          </p>
        </div>
      </div>
    );
  }

  // Fetch live stats from API client forwarding access token
  const token = await getAccessToken();
  let dashboardData = {
    success: false,
    metrics: {
      totalPatients: 0,
      activeDoctors: 0,
      departmentsCount: 0,
      totalVisits: 0,
      totalRevenue: 0,
      todayPatients: 0,
      todayRevenue: 0,
      todayVisits: 0,
      todayAdmissions: 0,
      todayDischarges: 0,
      pendingBills: 0,
      labPending: 0,
      lowStockMeds: 0,
      emergencyCases: 0,
      beds: { total: 150, occupied: 0, available: 150 },
    },
    recentPatients: [],
    doctorsList: [],
  };

  if (token) {
    try {
      const response = await getAnalyticsRequest(token);
      if (response && response.success) {
        dashboardData = response as any;
      }
    } catch (err) {
      console.error("Failed fetching live admin metrics:", err);
    }
  }

  return <DashboardView initialData={dashboardData} />;
}
