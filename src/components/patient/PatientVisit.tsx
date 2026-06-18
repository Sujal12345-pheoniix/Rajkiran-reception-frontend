"use client";

import React, { useActionState, useEffect, useState, useMemo } from "react";
import { createVisit, type VisitFormState } from "@/lib/actions/visitAction";
import { getPatientById } from "@/lib/actions/patientForm";
import { getAllDoctorsWithDepartmentsRequest, type Department, type Doctor } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import {
  Heart,
  Activity,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign,
  Plus,
  Minus,
  Sparkles,
  ShieldAlert
} from "lucide-react";

const INITIAL_STATE: VisitFormState = {
  success: undefined,
  message: "",
  errors: {},
};

const SYMPTOMS_LIST = [
  "Fever",
  "Cold",
  "Cough",
  "Headache",
  "Chest Pain",
  "Vomiting",
  "Weakness",
  "Dizziness",
  "Body Pain",
  "Breathing Difficulty"
];

const KNOWN_DISEASES_LIST = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Cancer",
  "Heart Disease",
  "Kidney Disease",
  "Thyroid",
  "Tuberculosis"
];

export default function PatientVisit({ patientId }: { patientId: string }) {
  const [state, formAction, isPending] = useActionState(createVisit, INITIAL_STATE);

  // Loaded patient details
  const [patientData, setPatientData] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  // Departments & Doctors
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);

  // Selection states
  const [assignmentType, setAssignmentType] = useState<"OPD" | "IPD">("OPD");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Vitals states for BMI calculation
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);

  // Symptoms searchable selector
  const [symptomSearch, setSymptomSearch] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedKnownDiseases, setSelectedKnownDiseases] = useState<string[]>([]);

  // Billing states
  const [consultationFee, setConsultationFee] = useState(0);
  const [registrationFee, setRegistrationFee] = useState(100);
  const [testsFee, setTestsFee] = useState(0);
  const [medicinesFee, setMedicinesFee] = useState(0);
  const [extraCharge, setExtraCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [customCharges, setCustomCharges] = useState<{ id: string; name: string; value: number }[]>([]);
  const [customChargeName, setCustomChargeName] = useState("");
  const [customChargeValue, setCustomChargeValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Fetch patient profile & previous history
  useEffect(() => {
    async function loadPatient() {
      try {
        const res = await getPatientById(patientId);
        if (res.success && res.data) {
          setPatientData(res.data);
          
          // Workflows: If they have previous visits, registration fee is ₹0!
          const visits = res.data.visits || [];
          if (visits.length > 0) {
            setRegistrationFee(0);
            
            // Prefill with their last consulting doctor
            const lastVisit = visits[0];
            if (lastVisit.doctor) {
              const docId = lastVisit.doctor_id;
              const deptId = lastVisit.doctor.department_id || "";
              
              setSelectedDepartmentId(deptId);
              // Store doctor id to set in state once doctors list finishes loading
              setTimeout(() => {
                setSelectedDoctorId(docId);
              }, 500);
            }
          }
          
          // Preselect known chronic conditions
          const conditions = res.data.patient_chronic_conditions || [];
          if (conditions.length > 0) {
            setSelectedKnownDiseases(conditions.map((c: any) => c.condition?.condition_name).filter(Boolean));
          }
        }
      } catch (e) {
        console.error("Error loading patient info:", e);
      } finally {
        setLoadingPatient(false);
      }
    }
    loadPatient();
  }, [patientId]);

  // Fetch departments + doctors
  useEffect(() => {
    async function fetchDepartments() {
      setIsLoadingDepts(true);
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await getAllDoctorsWithDepartmentsRequest(token);
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      } catch (e) {
        console.error("Failed to load departments:", e);
      } finally {
        setIsLoadingDepts(false);
      }
    }
    fetchDepartments();
  }, []);

  // Update doctors when department changes
  useEffect(() => {
    if (selectedDepartmentId) {
      const dept = departments.find((d) => d.department_id === selectedDepartmentId);
      setFilteredDoctors(dept?.doctors ?? []);
    } else {
      setFilteredDoctors([]);
      setSelectedDoctorId("");
      setConsultationFee(0);
      setSelectedDoctor(null);
    }
  }, [selectedDepartmentId, departments]);

  // Update consulting fee when doctor is selected
  useEffect(() => {
    if (selectedDoctorId) {
      const doc = filteredDoctors.find((d) => d.doctor_id === selectedDoctorId);
      if (doc) {
        setSelectedDoctor(doc);
        setConsultationFee(Number(doc.consultation_fee));
      }
    } else {
      setSelectedDoctor(null);
      setConsultationFee(0);
    }
  }, [selectedDoctorId, filteredDoctors]);

  // Auto calculate BMI
  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // to meters
    if (w > 0 && h > 0) {
      const val = w / (h * h);
      setBmi(parseFloat(val.toFixed(2)));
    } else {
      setBmi(null);
    }
  }, [weight, height]);

  // Auto Disease Suggestions based on symptoms selector
  const diseaseSuggestions = useMemo(() => {
    const symptoms = selectedSymptoms.map(s => s.toLowerCase());
    const suggestions: string[] = [];

    if (symptoms.includes("fever") && symptoms.includes("headache")) {
      suggestions.push("Viral Fever", "Typhoid", "Dengue", "Malaria");
    } else if (symptoms.includes("fever") && symptoms.includes("cough")) {
      suggestions.push("Viral Bronchitis", "Influenza", "COVID-19");
    }

    if (symptoms.includes("chest pain") && symptoms.includes("breathing difficulty")) {
      suggestions.push("Acute Coronary Syndrome", "Pulmonary Embolism", "Asthma Flare-up");
    } else if (symptoms.includes("breathing difficulty") && symptoms.includes("cough")) {
      suggestions.push("Asthma", "COPD Exacerbation", "Pneumonia");
    }

    if (symptoms.includes("vomiting") && symptoms.includes("dizziness")) {
      suggestions.push("Gastroenteritis", "Food Poisoning", "Labyrinthitis");
    }

    return [...new Set(suggestions)];
  }, [selectedSymptoms]);

  // Total Billing calculation
  const customChargesTotal = customCharges.reduce((sum, c) => sum + c.value, 0);
  const subtotal = consultationFee + registrationFee + testsFee + medicinesFee + extraCharge + customChargesTotal;
  const tax = parseFloat((subtotal * 0.05).toFixed(2)); // 5% GST tax
  const grandTotal = parseFloat((subtotal + tax - discount).toFixed(2));

  const handleAddSymptom = (sym: string) => {
    if (!selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(prev => [...prev, sym]);
    }
    setSymptomSearch("");
  };

  const handleRemoveSymptom = (sym: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== sym));
  };

  const handleToggleDisease = (disease: string) => {
    setSelectedKnownDiseases(prev =>
      prev.includes(disease) ? prev.filter(d => d !== disease) : [...prev, disease]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (state.success) {
    // Renders custom invoice on successful visit registration
    const billItems = [
      { name: "Consultation Fee", value: consultationFee },
      { name: "Registration / OPD Card Fee", value: registrationFee },
      { name: "Diagnostic Tests Fee", value: testsFee },
      { name: "Pharmacy Medicines Fee", value: medicinesFee },
      { name: "Emergency / Extra Service Fee", value: extraCharge },
      ...customCharges.map(c => ({ name: c.name, value: c.value }))
    ].filter(item => item.value > 0);

    return (
      <div className="max-w-3xl mx-auto my-10 p-8 bg-white border border-slate-200 rounded-xl shadow-lg print:border-none print:shadow-none print:my-0 print:p-0">
        <div className="flex justify-between items-center pb-6 border-b border-slate-100 print:pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 text-white rounded-lg flex items-center justify-center font-bold text-lg">
              RH
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">RAJKIRAN CLINIC & HOSPITAL</h2>
              <p className="text-xs text-slate-500">Official Patient Registration Invoice</p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-green-50 text-green-700 font-bold rounded-full text-xs uppercase tracking-wide">
              {paymentStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 my-6 text-xs text-slate-600">
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">PATIENT DETAILS</h4>
            <p className="mt-1 font-semibold text-slate-800">{patientData?.first_name} {patientData?.last_name}</p>
            <p>Patient ID: <span className="font-mono">{patientData?.unique_id}</span></p>
            <p>Mobile: {patientData?.mobile}</p>
          </div>
          <div className="text-right">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">VISIT DETAILS</h4>
            <p className="mt-1">Visit ID: <span className="font-mono font-semibold">{state.data?.visit_id}</span></p>
            <p>Consultant: {selectedDoctor ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}` : "General Ward IPD"}</p>
            <p>Date: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-xs text-left my-6">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5">Billing Item Descriptions</th>
              <th className="py-2.5 text-right">Fee (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {billItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-medium">{item.name}</td>
                <td className="py-3 text-right font-semibold">₹{item.value.toLocaleString("en-IN")}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-100 text-slate-500 font-medium">
              <td className="py-2 text-right">Subtotal</td>
              <td className="py-2 text-right font-semibold">₹{subtotal.toLocaleString("en-IN")}</td>
            </tr>
            <tr className="text-slate-500 font-medium">
              <td className="py-1 text-right">Tax (5% GST)</td>
              <td className="py-1 text-right font-semibold">₹{tax.toLocaleString("en-IN")}</td>
            </tr>
            {discount > 0 && (
              <tr className="text-rose-600 font-medium">
                <td className="py-1 text-right">Discount Given</td>
                <td className="py-1 text-right font-semibold">-₹{discount.toLocaleString("en-IN")}</td>
              </tr>
            )}
            <tr className="border-t border-slate-300 font-bold text-slate-800 text-sm">
              <td className="py-3 text-right">Grand Total Paid</td>
              <td className="py-3 text-right text-blue-700 text-lg">₹{grandTotal.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-slate-100 pt-6 flex justify-between items-center print:hidden">
          <div className="text-xs text-slate-400">
            Method: <span className="font-bold text-slate-600 uppercase">{paymentMethod}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold text-xs transition flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" /> Print Invoice Receipt
            </button>
            <a
              href="/reception/visit-book"
              className="px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-semibold text-xs transition"
            >
              Close & View Visits
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Load previous clinical history details for reference/prefilling
  const previousVisit = patientData?.visits?.[0];
  const lastVitals = previousVisit?.vitals;

  return (
    <form action={formAction} className="max-w-4xl mx-auto p-6 space-y-6 print:hidden">
      {/* Hidden bindings */}
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="doctorId" value={selectedDoctorId} />
      <input type="hidden" name="assignmentType" value="OPD" />
      <input type="hidden" name="symptoms" value={selectedSymptoms.join(",")} />
      <input type="hidden" name="knownDiseases" value={selectedKnownDiseases.join(",")} />
      <input type="hidden" name="consultationFee" value={consultationFee} />
      <input type="hidden" name="registrationFee" value={registrationFee} />
      <input type="hidden" name="testsFee" value={testsFee} />
      <input type="hidden" name="medicinesFee" value={medicinesFee} />
      <input type="hidden" name="extraCharge" value={extraCharge + customChargesTotal} />
      <input type="hidden" name="discount" value={discount} />
      <input type="hidden" name="tax" value={tax} />
      <input type="hidden" name="grandTotal" value={grandTotal} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="paymentStatus" value={paymentStatus} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Patient Visit Registration</h1>
          <p className="text-xs text-slate-500">Register OPD consultation or IPD admissions file</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full">
            UHID: {patientData?.unique_id}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">
            Patient: {patientData?.first_name} {patientData?.last_name} ({patientData?.gender})
          </span>
        </div>
      </div>

      {/* WORKFLOW BANNER: FOLLOW-UP DETECTION */}
      {previousVisit && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wide">Follow-Up Visit Detected</h4>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Last seen by <strong>{previousVisit.doctor ? `Dr. ${previousVisit.doctor.first_name} ${previousVisit.doctor.last_name}` : "General Ward"}</strong> on {new Date(previousVisit.visit_date).toLocaleDateString()}.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded uppercase">
            Reg Fee: Waived (₹0)
          </span>
        </div>
      )}

      {/* Grid: Columns for form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Clinical Vitals */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Clinical Telemetry & Vitals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Blood Pressure</label>
                <input
                  type="text"
                  name="bloodPressure"
                  placeholder="e.g. 120/80"
                  defaultValue={lastVitals?.blood_pressure || ""}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  name="heartRate"
                  placeholder="e.g. 72"
                  defaultValue={lastVitals?.heart_rate || ""}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  placeholder="e.g. 98.6"
                  defaultValue={lastVitals?.temperature ? Number(lastVitals.temperature) : ""}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  placeholder="e.g. 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  placeholder="e.g. 170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">BMI (Auto)</label>
                <div className="w-full px-3 py-2 border rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                  {bmi !== null ? `${bmi} (${bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : 'Overweight'})` : "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Oxygen Saturation (SpO2)</label>
                <input
                  type="number"
                  name="oxygenSaturation"
                  placeholder="e.g. 98"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Respiratory Rate</label>
                <input
                  type="number"
                  name="respiratoryRate"
                  placeholder="e.g. 16"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Blood Sugar (mg/dL)</label>
                <input
                  type="number"
                  name="bloodSugar"
                  placeholder="e.g. 110"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Pain Scale (0 - 10)</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <label key={num} className="flex-1 cursor-pointer">
                      <input type="radio" name="painScale" value={num} className="sr-only peer" />
                      <div className="h-7 border border-slate-200 flex items-center justify-center text-[10px] font-bold rounded hover:bg-slate-50 peer-checked:bg-blue-600 peer-checked:text-white transition">
                        {num}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Symptoms & Suggestions */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              Symptoms Selector & Clinical Alerts
            </h3>
            
            {/* Search Symptoms box */}
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Search & Select Symptoms</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type fever, chest pain, cough, etc..."
                  value={symptomSearch}
                  onChange={(e) => setSymptomSearch(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none bg-slate-50/50"
                />
                {symptomSearch && (
                  <div className="absolute top-full left-0 right-0 border border-slate-200 bg-white rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto mt-1 divide-y divide-slate-100 text-xs">
                    {SYMPTOMS_LIST.filter(s => s.toLowerCase().includes(symptomSearch.toLowerCase())).map((sym) => (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => handleAddSymptom(sym)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 min-h-6">
              {selectedSymptoms.map((sym) => (
                <span key={sym} className="inline-flex items-center bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100 px-2.5 py-1 rounded-lg">
                  {sym}
                  <button type="button" onClick={() => handleRemoveSymptom(sym)} className="ml-1.5 text-blue-400 hover:text-blue-800 text-xs">×</button>
                </span>
              ))}
              {selectedSymptoms.length === 0 && <span className="text-slate-400 text-xs italic">Select symptoms to fetch clinical warnings.</span>}
            </div>

            {/* Suggestions banner */}
            {diseaseSuggestions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 items-start">
                <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-yellow-800 text-xs uppercase tracking-wide">Possible Differential Diagnosis (Suggestions Only)</h4>
                  <p className="text-[10px] text-yellow-600 font-semibold mt-0.5">
                    Suggested paths: {diseaseSuggestions.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Known chronic conditions */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
              Known Chronic Diseases Check
            </h3>
            <div className="flex flex-wrap gap-2">
              {KNOWN_DISEASES_LIST.map((disease) => {
                const isSelected = selectedKnownDiseases.includes(disease);
                return (
                  <button
                    type="button"
                    key={disease}
                    onClick={() => handleToggleDisease(disease)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm shadow-rose-200/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {disease}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 4: Complaints & Notes */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
              Chief Complaints & Registrar Notes
            </h3>
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Chief Complaint</label>
              <textarea
                name="chiefComplaint"
                rows={3}
                placeholder="Enter patient primary symptoms complaints details..."
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Visit / Consultation Notes</label>
              <textarea
                name="visitNotes"
                rows={3}
                placeholder="Enter doctor clinical advisory notes or internal reception comments..."
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none bg-slate-50/50"
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Billing panel */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Itemized Billing Charges</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Consultation Fee</span>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-20 text-right font-semibold border-b border-slate-200 py-0.5 focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Registration Card Fee</span>
                <input
                  type="number"
                  value={registrationFee}
                  onChange={(e) => setRegistrationFee(Number(e.target.value))}
                  className="w-20 text-right font-semibold border-b border-slate-200 py-0.5 focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Diagnostic Tests Fee</span>
                <input
                  type="number"
                  value={testsFee}
                  onChange={(e) => setTestsFee(Number(e.target.value))}
                  className="w-20 text-right font-semibold border-b border-slate-200 py-0.5 focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Pharmacy Meds Fee</span>
                <input
                  type="number"
                  value={medicinesFee}
                  onChange={(e) => setMedicinesFee(Number(e.target.value))}
                  className="w-20 text-right font-semibold border-b border-slate-200 py-0.5 focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Extra Charge / ICU Fee</span>
                <input
                  type="number"
                  value={extraCharge}
                  onChange={(e) => setExtraCharge(Number(e.target.value))}
                  className="w-20 text-right font-semibold border-b border-slate-200 py-0.5 focus:outline-none"
                />
              </div>

              {/* Custom Charges List */}
              {customCharges.map((cc) => (
                <div key={cc.id} className="flex justify-between items-center text-slate-700">
                  <span className="font-medium flex items-center gap-1.5">
                    {cc.name}
                    <button
                      type="button"
                      onClick={() => setCustomCharges(prev => prev.filter(c => c.id !== cc.id))}
                      className="text-rose-500 hover:text-rose-700 font-bold"
                    >
                      ×
                    </button>
                  </span>
                  <span className="font-semibold text-right">₹{cc.value}</span>
                </div>
              ))}

              {/* Add Custom Charge Inline Section */}
              <div className="border-t border-dashed border-slate-100 pt-2.5 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Add Additional Charge Item</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Suture Fee"
                    value={customChargeName}
                    onChange={(e) => setCustomChargeName(e.target.value)}
                    className="flex-1 p-1 bg-slate-50 border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={customChargeValue}
                    onChange={(e) => setCustomChargeValue(e.target.value)}
                    className="w-16 p-1 bg-slate-50 border border-slate-200 rounded text-right text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseFloat(customChargeValue);
                      if (customChargeName.trim() && !isNaN(val) && val > 0) {
                        setCustomCharges(prev => [...prev, { id: Math.random().toString(), name: customChargeName.trim(), value: val }]);
                        setCustomChargeName("");
                        setCustomChargeValue("");
                      }
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />
              <div className="flex justify-between items-center text-slate-500">
                <span>Tax (5% GST)</span>
                <span className="font-semibold text-right w-20">₹{tax}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Discount given</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20 text-right text-rose-600 font-semibold border-b border-slate-200 py-0.5 focus:outline-none"
                />
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                <span>Grand Total</span>
                <span className="text-blue-700 text-base">₹{grandTotal}</span>
              </div>
            </div>
          </section>

          {/* Payment method panel */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Payment Process</h3>
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50/50 uppercase font-semibold text-slate-700"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partially Paid</option>
                <option value="insurance_claim">Insurance Claim</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50/50 uppercase font-semibold text-slate-700"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="net_banking">Net Banking</option>
                <option value="insurance">Insurance</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </section>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded-lg shadow-sm hover:shadow transition disabled:bg-blue-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1.5"
          >
            {isPending ? "Registering Visit File..." : "Register Visit"}
          </button>
        </div>
      </div>
    </form>
  );
}
