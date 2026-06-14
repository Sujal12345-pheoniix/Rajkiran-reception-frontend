"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { Search, Loader2, User, X, ArrowRight, AlertCircle } from "lucide-react";
import { searchPatient } from "@/lib/actions/patientForm";
import Link from "next/link";

type Patient = {
  first_name: string;
  last_name: string;
  dob: string;
  address: string | null;
  gender: string;
  mobile: string;
  email?: string;
  unique_id: string;
};

export default function PatientSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, startTransition] = useTransition();
  const [result, setResult] = useState<Patient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim() || query.trim().length < 1) return;

    setError(null);
    setHasSearched(true);

    startTransition(async () => {
      try {
        const { success, data, message } = await searchPatient(query.trim());
        if (success && data) {
          setResult(data as Patient[]);
        } else {
          setError(message ?? "Search failed. Please try again.");
          setResult([]);
        }
      } catch (e) {
        setError("An error occurred during search. Please try again.");
        setResult([]);
      }
    });
  }, []);

  // BUG FIX: Added debounce to avoid hammering API on every keystroke
  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setResult(null);
      setHasSearched(false);
      setError(null);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setResult(null);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-5">
      {/* Search Input */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 border flex p-2.5 gap-2.5 rounded-xl shadow-sm items-center bg-white focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-300 transition-all">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
            placeholder="Search by name, Patient ID, or mobile..."
            className="w-full text-gray-700 text-sm bg-transparent focus:outline-none"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleSearch(searchTerm)}
          disabled={isLoading || !searchTerm.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Search</span>
            </>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result !== null && !error && (
        <div className="mt-4">
          {result.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Found {result.length} patient{result.length !== 1 ? "s" : ""}
              </p>
              <ul className="space-y-3">
                {result.map((patient) => (
                  <li
                    key={patient.unique_id}
                    className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                          <span>ID: {patient.unique_id}</span>
                          <span>•</span>
                          <span>{patient.gender}</span>
                          <span>•</span>
                          <span>{patient.mobile}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/reception/${patient.unique_id}`}
                      className="text-blue-600 hover:text-blue-700 transition flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50"
                    >
                      Visit
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            hasSearched && !isLoading && (
              <div className="mt-4 p-6 border rounded-xl bg-gray-50 text-center">
                <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No patients found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try searching by a different name or Patient ID
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Help text */}
      {!hasSearched && (
        <p className="mt-3 text-xs text-gray-400">
          💡 Search by Patient ID (e.g., PT2406ABC), first name, last name, or mobile number
        </p>
      )}
    </div>
  );
}
