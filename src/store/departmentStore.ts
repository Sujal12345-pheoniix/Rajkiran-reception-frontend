// stores/departmentStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Department {
  department_id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  created_at: Date;
  created_by: string | null;
}

interface DepartmentState {
  departments: Department[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  // Actions
  setDepartments: (departments: Department[]) => void;
  addDepartment: (department: Department) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  syncDepartments: (departments: Department[]) => void;
  clearDepartments: () => void;
  getActiveDepartments: () => Department[];
  getDepartmentById: (id: string) => Department | undefined;
}

export const useDepartmentStore = create<DepartmentState>()(
  persist(
    (set, get) => ({
      departments: [],
      loading: false,
      error: null,
      lastSync: null,

      setDepartments: (departments) => set({ departments }),

      addDepartment: (department) =>
        set((state) => ({
          departments: [...state.departments, department],
        })),

      updateDepartment: (id, updates) =>
        set((state) => ({
          departments: state.departments.map((dept) =>
            dept.department_id === id ? { ...dept, ...updates } : dept,
          ),
        })),

      deleteDepartment: (id) =>
        set((state) => ({
          departments: state.departments.filter(
            (dept) => dept.department_id !== id,
          ),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      syncDepartments: (departments) =>
        set({ departments, lastSync: new Date(), loading: false, error: null }),

      clearDepartments: () =>
        set({ departments: [], lastSync: null, error: null }),

      getActiveDepartments: () =>
        get().departments.filter((dept) => dept.status === "active"),

      getDepartmentById: (id) =>
        get().departments.find((dept) => dept.department_id === id),
    }),
    {
      name: "department-storage",
      partialize: (state) => ({
        departments: state.departments,
        lastSync: state.lastSync,
      }),
    },
  ),
);
