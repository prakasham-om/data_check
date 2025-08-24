import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = "https://data-check.onrender.com/api/sheet";

export default function CompanyTable() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all"); // all / active
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const searchDebounce = useRef(null);

  const loggedInEmpId = localStorage.getItem("empId");
  const allowedEmpIds = ["prakash", "Prakash", "8910"];
  const canEditGlobal = allowedEmpIds.includes(loggedInEmpId);

  // Fetch rows with backend filters
  const fetchRows = async () => {
    try {
      const res = await axios.get(`${API_BASE}/list`, {
        params: {
          status: filter === "active" ? "Active" : undefined,
          q: searchQuery || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      });
      setRows(res.data.data || []);
    } catch (err) {
      console.error("Fetch rows error:", err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [filter, searchQuery, dateFrom, dateTo]);

  // Toggle status
  const handleToggle = async (companyName) => {
    try {
      const res = await axios.post(`${API_BASE}/toggle/${companyName}`);
      if (res.data.success) fetchRows();
      alert(res.data.message || res.data.error);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to toggle");
    }
  };

  // Delete
  const handleDelete = async (companyName) => {
    if (!window.confirm(`Delete "${companyName}"?`)) return;
    try {
      const res = await axios.delete(`${API_BASE}/delete`, { data: { companyName } });
      if (res.data.success) fetchRows();
      alert(res.data.message || res.data.error);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  // Clear sheet (admin only)
  const handleClear = async () => {
    if (!window.confirm("Clear last sheet?")) return;
    try {
      const res = await axios.post(`${API_BASE}/clear`);
      alert(res.data.message || res.data.error);
      fetchRows();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to clear sheet");
    }
  };

  // Download Excel via backend
  const handleExport = (mode) => {
    let url = `${API_BASE}/export?mode=${mode}`;
    if (mode === "range") {
      url += `&dateFrom=${dateFrom || ""}&dateTo=${dateTo || ""}`;
    }
    window.open(url, "_blank"); // trigger download
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {["all", "active"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${filter === f ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            {f.toUpperCase()}
          </button>
        ))}

        <input
          type="text"
          placeholder="Search company..."
          value={searchQuery}
          onChange={(e) => {
            const v = e.target.value;
            setSearchQuery(v);
            if (searchDebounce.current) clearTimeout(searchDebounce.current);
            searchDebounce.current = setTimeout(() => fetchRows(), 400);
          }}
          className="border px-3 py-2 rounded-lg"
        />

        {/* Date range filter */}
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border p-2 rounded-lg"/>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border p-2 rounded-lg"/>

        {/* Admin clear button */}
        {canEditGlobal && (
          <button onClick={handleClear} className="px-4 py-2 bg-red-500 text-white rounded-lg">
            Clear Sheet
          </button>
        )}

        {/* Export buttons */}
        <div className="flex gap-2 ml-auto">
          <button onClick={() => handleExport("all")} className="px-4 py-2 bg-green-500 text-white rounded-lg">
            Export All
          </button>
          <button onClick={() => handleExport("today")} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            Export Today
          </button>
          <button onClick={() => handleExport("datewise")} className="px-4 py-2 bg-purple-500 text-white rounded-lg">
            Export Datewise
          </button>
          <button onClick={() => handleExport("range")} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
            Export Range
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Company</th>
              <th className="p-2 text-left">Project</th>
              <th className="p-2 text-left">Emp ID</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-2">{r.companyName}</td>
                  <td className="p-2">{r.projectName || "-"}</td>
                  <td className="p-2">{r.empId}</td>
                  <td className="p-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded-full ${r.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2 text-center space-x-2">
                    {r.status === "Active" ? (
                      <button onClick={() => handleToggle(r.companyName)} className="px-3 py-1 bg-yellow-500 text-white rounded">
                        Deactivate
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-gray-300 text-gray-600 rounded">Inactive</span>
                    )}
                    {canEditGlobal && (
                      <button onClick={() => handleDelete(r.companyName)} className="px-3 py-1 bg-red-500 text-white rounded">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="text-center p-4 text-gray-500">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
