// stores/billStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Bill {
  bill_id: string;
  visit_id: string;
  consultation_fee: number;
  extra_charges: number;
  total_amount: number;
  payment_status: "paid" | "pending" | "partial";
  payment_method: "cash" | "card" | "insurance" | null;
  bill_date: Date;
  created_by: string | null;
  // Joined fields
  patient_name?: string;
  doctor_name?: string;
}

interface BillSummary {
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  totalBills: number;
  pendingBills: number;
  paidBills: number;
}

interface BillState {
  bills: Bill[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  // Actions
  setBills: (bills: Bill[]) => void;
  addBill: (bill: Bill) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  syncBills: (bills: Bill[]) => void;
  clearBills: () => void;
  getBillById: (id: string) => Bill | undefined;
  getBillsByVisit: (visitId: string) => Bill | undefined;
  getBillSummary: () => BillSummary;
  getBillsByDateRange: (startDate: Date, endDate: Date) => Bill[];
}

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      bills: [],
      loading: false,
      error: null,
      lastSync: null,

      setBills: (bills) => set({ bills }),

      addBill: (bill) =>
        set((state) => ({
          bills: [...state.bills, bill],
        })),

      updateBill: (id, updates) =>
        set((state) => ({
          bills: state.bills.map((bill) =>
            bill.bill_id === id ? { ...bill, ...updates } : bill,
          ),
        })),

      deleteBill: (id) =>
        set((state) => ({
          bills: state.bills.filter((bill) => bill.bill_id !== id),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      syncBills: (bills) =>
        set({ bills, lastSync: new Date(), loading: false, error: null }),

      clearBills: () => set({ bills: [], lastSync: null, error: null }),

      getBillById: (id) => get().bills.find((bill) => bill.bill_id === id),

      getBillsByVisit: (visitId) =>
        get().bills.find((bill) => bill.visit_id === visitId),

      getBillSummary: () => {
        const bills = get().bills;
        const summary: BillSummary = {
          totalRevenue: 0,
          pendingAmount: 0,
          paidAmount: 0,
          totalBills: bills.length,
          pendingBills: 0,
          paidBills: 0,
        };

        bills.forEach((bill) => {
          summary.totalRevenue += bill.total_amount;

          if (bill.payment_status === "paid") {
            summary.paidAmount += bill.total_amount;
            summary.paidBills++;
          } else if (bill.payment_status === "pending") {
            summary.pendingAmount += bill.total_amount;
            summary.pendingBills++;
          } else if (bill.payment_status === "partial") {
            // Handle partial payments if needed
            summary.pendingAmount += bill.total_amount * 0.5; // Example logic
          }
        });

        return summary;
      },

      getBillsByDateRange: (startDate, endDate) =>
        get().bills.filter(
          (bill) =>
            new Date(bill.bill_date) >= startDate &&
            new Date(bill.bill_date) <= endDate,
        ),
    }),
    {
      name: "bill-storage",
      partialize: (state) => ({
        bills: state.bills,
        lastSync: state.lastSync,
      }),
    },
  ),
);
