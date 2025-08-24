// CompanyForm.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import industryLocations from "../data";

const API_BASE = "https://data-check.onrender.com/api/sheet";

export default function CompanyForm({ onAdd }) {
  const [companyName, setCompanyName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState("Inactive");
  const [empId, setEmpId] = useState("");
  const [activeValue, setActiveValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const debounceRef = useRef(null);

  // load stored emp id
  useEffect(() => {
    const stored = localStorage.getItem("empId");
    if (stored) setEmpId(stored);
  }, []);

  // suggestions (debounced)
  useEffect(() => {
    const q = companyName.trim();
    if (!q) return setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/search`, { params: { q } });
        const data = res.data || [];
        setSuggestions(data);
        setIsDuplicate(data.some((c) => c.companyName.toLowerCase() === q.toLowerCase()));
      } catch (err) {
        // ignore
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [companyName]);

  const validateURL = (url) => {
    const regex = /^(?!www\.)([a-z0-9\-]+)\.(com|com\.in)$/i;
    return regex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedCompany = companyName.trim();
    const trimmedEmp = empId.trim();
    const trimmedProject = projectName.trim();

    if (!trimmedCompany || !trimmedEmp) {
      return alert("Company Name and Employee ID required");
    }
    if (!validateURL(trimmedCompany)) {
      return alert("Company must be like abc.com or abc.com.in (no subdomains)");
    }
    if (isDuplicate) return alert("Duplicate company exists");

    if (!window.confirm(`Add company "${trimmedCompany}"?`)) return;

    setLoading(true);
    try {
      // NOTE: backend route should be /create
      const res = await axios.post(`${API_BASE}/create`, {
        companyName: trimmedCompany,
        projectName: trimmedProject || "",
        status,
        empId: trimmedEmp,
        activeValue: Number(activeValue) || 0,
      });

      if (res.data && (res.data.success || res.data.message || res.status === 200)) {
        localStorage.setItem("empId", trimmedEmp);
        setCompanyName("");
        setProjectName("");
        setStatus("Inactive");
        setActiveValue("");
        setSuggestions([]);
        setIsDuplicate(false);

        setSuccess(true);
        setTimeout(() => setSuccess(false), 1200);

        if (typeof onAdd === "function") onAdd(); // refresh parent
      } else {
        alert(res.data?.error || "Add failed");
      }
    } catch (err) {
      console.error("Create error:", err);
      alert(err.response?.data?.error || "Failed to add company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-6 bg-white rounded-xl shadow"
    >
      <div className="relative col-span-1 sm:col-span-2">
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company Name (e.g. abc.com)"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {companyName && (
          <button
            type="button"
            onClick={() => {
              setCompanyName("");
              setSuggestions([]);
              setIsDuplicate(false);
            }}
            className="absolute right-2 top-2 text-sm px-2 py-1 bg-gray-100 rounded"
          >
            Clear
          </button>
        )}
        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 bg-white border mt-1 max-h-40 overflow-auto z-20 rounded">
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => {
                  setCompanyName(s.companyName);
                  setSuggestions([]);
                  setIsDuplicate(true);
                }}
              >
                <div className="text-sm">{s.companyName}</div>
                <div className="text-xs text-gray-500">{s.projectName || "—"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <select
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="">Select Project (Optional)</option>
        {industryLocations.map((proj, i) => (
          <option key={i} value={proj}>
            {proj}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={empId}
        onChange={(e) => {
          setEmpId(e.target.value);
          localStorage.setItem("empId", e.target.value.trim());
        }}
        placeholder="Employee ID"
        className="border px-3 py-2 rounded"
      />

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="border px-3 py-2 rounded">
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      <input
        type="number"
        value={activeValue}
        onChange={(e) => setActiveValue(e.target.value)}
        placeholder="Approach (Active Value)"
        className="border px-3 py-2 rounded"
      />

      <div className="col-span-full flex items-center justify-end space-x-3">
        <button
          type="submit"
          disabled={isDuplicate || loading}
          className={`px-5 py-2 rounded font-medium ${
            isDuplicate || loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Adding..." : isDuplicate ? "Duplicate" : "Add"}
        </button>

        {success && <div className="px-3 py-2 bg-green-100 text-green-800 rounded">Added</div>}
      </div>
    </form>
  );
}
