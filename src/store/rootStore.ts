// stores/rootStore.ts
import { useDepartmentStore } from "./departmentStore";
import { useDoctorStore } from "./doctorStore";
import { usePatientStore } from "./patientStore";
import { useVisitStore } from "./visitStore";
import { useBillStore } from "./billStore";

export const useRootStore = () => {
  const departments = useDepartmentStore();
  const doctors = useDoctorStore();
  const patients = usePatientStore();
  const visits = useVisitStore();
  const bills = useBillStore();

  return {
    departments,
    doctors,
    patients,
    visits,
    bills,
  };
};

// Utility function to sync all stores from API
export const syncAllStores = async () => {
  // This would typically fetch from your API
  // const departments = await fetchDepartments();
  // const doctors = await fetchDoctors();
  // etc.
  // useDepartmentStore.getState().syncDepartments(departments);
  // useDoctorStore.getState().syncDoctors(doctors);
  // usePatientStore.getState().syncPatients(patients);
  // useVisitStore.getState().syncVisits(visits);
  // useBillStore.getState().syncBills(bills);
};

// Utility to clear all stores
export const clearAllStores = () => {
  useDepartmentStore.getState().clearDepartments();
  useDoctorStore.getState().clearDoctors();
  usePatientStore.getState().clearPatients();
  useVisitStore.getState().clearVisits();
  useBillStore.getState().clearBills();
};
