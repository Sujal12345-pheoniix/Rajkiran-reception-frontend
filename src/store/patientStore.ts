// stores/patientStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Patient {
  patient_id: string;
  first_name: string;
  last_name: string;
  dob: Date;
  gender: "Male" | "Female" | "Other";
  mobile: string;
  email: string | null;
  alternate_mobile: string | null;
  created_at: Date;
  full_name?: string;
  age?: number;
}

interface PatientState {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  searchQuery: string;
  // Actions
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  syncPatients: (patients: Patient[]) => void;
  clearPatients: () => void;
  setSearchQuery: (query: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  searchPatients: () => Patient[];
  calculateAge: (dob: Date) => number;
}

export const usePatientStore = create<PatientState>()(
  persist(
    (set, get) => ({
      patients: [],
      loading: false,
      error: null,
      lastSync: null,
      searchQuery: "",

      setPatients: (patients) =>
        set({
          patients: patients.map((p) => ({
            ...p,
            full_name: `${p.first_name} ${p.last_name}`,
            age: get().calculateAge(p.dob),
          })),
        }),

      addPatient: (patient) =>
        set((state) => ({
          patients: [
            ...state.patients,
            {
              ...patient,
              full_name: `${patient.first_name} ${patient.last_name}`,
              age: get().calculateAge(patient.dob),
            },
          ],
        })),

      updatePatient: (id, updates) =>
        set((state) => ({
          patients: state.patients.map((patient) =>
            patient.patient_id === id
              ? {
                ...patient,
                ...updates,
                full_name:
                  updates.first_name && updates.last_name
                    ? `${updates.first_name} ${updates.last_name}`
                    : patient.full_name,
                age: updates.dob
                  ? get().calculateAge(updates.dob)
                  : patient.age,
              }
              : patient,
          ),
        })),

      deletePatient: (id) =>
        set((state) => ({
          patients: state.patients.filter(
            (patient) => patient.patient_id !== id,
          ),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      syncPatients: (patients) =>
        set({
          patients: patients.map((p) => ({
            ...p,
            full_name: `${p.first_name} ${p.last_name}`,
            age: get().calculateAge(p.dob),
          })),
          lastSync: new Date(),
          loading: false,
          error: null,
        }),

      clearPatients: () => set({ patients: [], lastSync: null, error: null }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      getPatientById: (id) =>
        get().patients.find((patient) => patient.patient_id === id),

      searchPatients: () => {
        const { patients, searchQuery } = get();
        if (!searchQuery) return patients;

        const query = searchQuery.toLowerCase();
        return patients.filter(
          (patient) =>
            patient.first_name.toLowerCase().includes(query) ||
            patient.last_name.toLowerCase().includes(query) ||
            patient.mobile.includes(query) ||
            patient.email?.toLowerCase().includes(query),
        );
      },

      calculateAge: (dob: Date) => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        return age;
      },
    }),
    {
      name: "patient-storage",
      partialize: (state) => ({
        patients: state.patients,
        lastSync: state.lastSync,
      }),
    },
  ),
);
