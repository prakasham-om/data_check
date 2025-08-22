import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import industryLocations from "../data";

const API_BASE = "https://data-check.onrender.com/api/csv";

export default function CompanyForm({ onAdd }) {
  const [companyName, setCompanyName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState("Inactive");
  const [empId, setEmpId] = useState("");
  const [activeValue, setActiveValue] = useState(NaN);
  const [suggestions, setSuggestions] = useState([]);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const debounceRef = useRef(null);

  // Load Emp ID from localStorage
  useEffect(() => {
    const storedEmp = localStorage.getItem("empId");
    if (storedEmp) setEmpId(storedEmp);
  }, []);

  // Company name suggestions with debounce
  useEffect(() => {
    const trimmed = companyName.trim();
    if (!trimmed) return setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/search?q=${trimmed}`);
        setSuggestions(res.data.data || []);
        setIsDuplicate(
          res.data.data.some(
            (c) => c.companyName.toLowerCase() === trimmed.toLowerCase()
          )
        );
      } catch (err) {}
    }, 400);
  }, [companyName]);

  const validateURL = (url) => {
    // Only allow abc.com, abc.com.in, no subdomains, no https
    const regex = /^(?!www\.)([a-z0-9\-]+)\.(com|com\.in)$/i;
    return regex.test(url);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  const trimmedCompany = companyName.trim();
  const trimmedProject = projectName.trim();
  const trimmedEmp = empId.trim();

  if (!trimmedCompany || !trimmedEmp) {
    return alert("Company Name and Employee ID are required");
  }

  if (!validateURL(trimmedCompany)) {
    return alert(
      "Invalid company URL! Only abc.com, abc.com.in allowed. No subdomains or https."
    );
  }

  if (isDuplicate) return alert("Duplicate company exists!");

  if (!window.confirm(`Add company "${trimmedCompany}"?`)) return;

  setLoading(true);
  try {
    const res = await axios.post(`${API_BASE}/creat`, {
      companyName: trimmedCompany,
      projectName: trimmedProject || null,
      status,
      empId: trimmedEmp,
      activeValue: Number(activeValue) || 0,
    });

    if (res.data.success) {
      localStorage.setItem("empId", trimmedEmp);
      setCompanyName("");
      setProjectName("");
      setStatus("Inactive");
      setActiveValue(0);
      setSuggestions([]);
      setIsDuplicate(false);

      // Trigger success animation
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);

      onAdd(); // refresh parent table

     // alert(res.data.message || "Company added successfully!");
    } 
  } catch (err) {
    //alert(err.response?.data?.error || "Failed to add company");
  } finally {
    setLoading(false);
  }
};
 if (activevalue === NaN){
   setStatus('Active')
 }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-6 bg-white rounded-xl shadow-md"
    >
      {/* Company Name */}
      <div className="relative">
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company Name (URL)"
          className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400"
        />
        {suggestions.length > 0 && (
          <ul className="absolute bg-white w-full border max-h-40 overflow-y-auto mt-1 z-10 rounded">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="p-2 cursor-pointer hover:bg-gray-200"
                onMouseDown={() => {
                  setCompanyName(s.companyName);
                  setSuggestions([]);
                  setIsDuplicate(true);
                }}
              >
                {s.companyName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Project Dropdown */}
      <select
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Select Project (Optional)</option>
        {industryLocations.map((proj, i) => (
          <option key={i} value={proj}>
            {proj}
          </option>
        ))}
      </select>

      {/* Employee ID */}
      <input
        type="text"
        value={empId}
        onChange={(e) => {
          setEmpId(e.target.value);
          localStorage.setItem("empId", e.target.value.trim());
        }}
        placeholder="Employee ID"
        className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400"
      />

      {/* Status */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400"
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      {/* Active Value */}
      <input
        type="number"
        value={activeValue}
        onChange={(e) => setActiveValue(e.target.value)}
        placeholder="Approach"
        className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400"
      />

      {/* Submit Button */}
      <div className="col-span-full flex justify-end relative">
        <button
          type="submit"
          disabled={isDuplicate || loading}
          className={`px-6 py-2 rounded font-medium ${
            isDuplicate || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Adding..." : isDuplicate ? "Duplicate" : "Add"}
        </button>

        {success && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded font-semibold animate-bounce shadow-lg">
              Added Successfully!
            </span>
          </div>
        )}
      </div>
    </form>
  );
}
