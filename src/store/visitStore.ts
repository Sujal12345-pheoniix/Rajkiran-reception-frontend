// stores/visitStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Visit {
  visit_id: string;
  patient_id: string;
  department_id: string | null;
  doctor_id: string | null;
  consultation_fee: number;
  created_by: string;
  created_at: Date;
  // Joined fields
  patient_name?: string;
  doctor_name?: string;
  department_name?: string;
}

interface VisitFilters {
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
  patientId?: string;
}

interface VisitState {
  visits: Visit[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  filters: VisitFilters;
  // Actions
  setVisits: (visits: Visit[]) => void;
  addVisit: (visit: Visit) => void;
  updateVisit: (id: string, updates: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  syncVisits: (visits: Visit[]) => void;
  clearVisits: () => void;
  setFilters: (filters: VisitFilters) => void;
  getVisitById: (id: string) => Visit | undefined;
  getFilteredVisits: () => Visit[];
  getVisitsByPatient: (patientId: string) => Visit[];
  getVisitsByDoctor: (doctorId: string) => Visit[];
  getTodayVisits: () => Visit[];
}

export const useVisitStore = create<VisitState>()(
  persist(
    (set, get) => ({
      visits: [],
      loading: false,
      error: null,
      lastSync: null,
      filters: {},

      setVisits: (visits) => set({ visits }),

      addVisit: (visit) =>
        set((state) => ({
          visits: [...state.visits, visit],
        })),

      updateVisit: (id, updates) =>
        set((state) => ({
          visits: state.visits.map((visit) =>
            visit.visit_id === id ? { ...visit, ...updates } : visit,
          ),
        })),

      deleteVisit: (id) =>
        set((state) => ({
          visits: state.visits.filter((visit) => visit.visit_id !== id),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      syncVisits: (visits) =>
        set({ visits, lastSync: new Date(), loading: false, error: null }),

      clearVisits: () => set({ visits: [], lastSync: null, error: null }),

      setFilters: (filters) => set({ filters }),

      getVisitById: (id) => get().visits.find((visit) => visit.visit_id === id),

      getFilteredVisits: () => {
        const { visits, filters } = get();
        let filtered = [...visits];

        if (filters.doctorId) {
          filtered = filtered.filter((v) => v.doctor_id === filters.doctorId);
        }
        if (filters.patientId) {
          filtered = filtered.filter((v) => v.patient_id === filters.patientId);
        }
        if (filters.startDate) {
          filtered = filtered.filter(
            (v) => new Date(v.created_at) >= filters.startDate!,
          );
        }
        if (filters.endDate) {
          filtered = filtered.filter(
            (v) => new Date(v.created_at) <= filters.endDate!,
          );
        }

        return filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      },

      getVisitsByPatient: (patientId) =>
        get().visits.filter((visit) => visit.patient_id === patientId),

      getVisitsByDoctor: (doctorId) =>
        get().visits.filter((visit) => visit.doctor_id === doctorId),

      getTodayVisits: () => {
        const today = new Date().toDateString();
        return get().visits.filter(
          (visit) => new Date(visit.created_at).toDateString() === today,
        );
      },
    }),
    {
      name: "visit-storage",
      partialize: (state) => ({
        visits: state.visits,
        lastSync: state.lastSync,
      }),
    },
  ),
);
