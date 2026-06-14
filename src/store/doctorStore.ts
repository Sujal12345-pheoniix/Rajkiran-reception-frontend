// stores/doctorStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Doctor {
  doctor_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  specialization: string | null;
  department_id: string | null;
  qualification: string | null;
  mobile: string | null;
  email: string | null;
  consultation_fee: number;
  status: "active" | "on_leave" | "inactive";
  joining_date: Date;
  created_by: string | null;
  created_at: Date;
  // Computed/Joined fields
  department_name?: string;
  full_name?: string;
}

interface DoctorState {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  // Actions
  setDoctors: (doctors: Doctor[]) => void;
  addDoctor: (doctor: Doctor) => void;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  syncDoctors: (doctors: Doctor[]) => void;
  clearDoctors: () => void;
  getActiveDoctors: () => Doctor[];
  getDoctorsByDepartment: (departmentId: string) => Doctor[];
  getDoctorById: (id: string) => Doctor | undefined;
}

export const useDoctorStore = create<DoctorState>()(
  persist(
    (set, get) => ({
      doctors: [],
      loading: false,
      error: null,
      lastSync: null,

      setDoctors: (doctors) =>
        set({
          doctors: doctors.map((d) => ({
            ...d,
            full_name: `${d.first_name} ${d.last_name}`,
          })),
        }),

      addDoctor: (doctor) =>
        set((state) => ({
          doctors: [
            ...state.doctors,
            {
              ...doctor,
              full_name: `${doctor.first_name} ${doctor.last_name}`,
            },
          ],
        })),

      updateDoctor: (id, updates) =>
        set((state) => ({
          doctors: state.doctors.map((doctor) =>
            doctor.doctor_id === id
              ? {
                ...doctor,
                ...updates,
                full_name:
                  updates.first_name && updates.last_name
                    ? `${updates.first_name} ${updates.last_name}`
                    : doctor.full_name,
              }
              : doctor,
          ),
        })),

      deleteDoctor: (id) =>
        set((state) => ({
          doctors: state.doctors.filter((doctor) => doctor.doctor_id !== id),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      syncDoctors: (doctors) =>
        set({
          doctors: doctors.map((d) => ({
            ...d,
            full_name: `${d.first_name} ${d.last_name}`,
          })),
          lastSync: new Date(),
          loading: false,
          error: null,
        }),

      clearDoctors: () => set({ doctors: [], lastSync: null, error: null }),

      getActiveDoctors: () =>
        get().doctors.filter((doctor) => doctor.status === "active"),

      getDoctorsByDepartment: (departmentId) =>
        get().doctors.filter((doctor) => doctor.department_id === departmentId),

      getDoctorById: (id) =>
        get().doctors.find((doctor) => doctor.doctor_id === id),
    }),
    {
      name: "doctor-storage",
      partialize: (state) => ({
        doctors: state.doctors,
        lastSync: state.lastSync,
      }),
    },
  ),
);
