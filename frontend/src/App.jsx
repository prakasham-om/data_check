import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CompanyForm from "./components/CompanyForm";
import CompanyTable from "./components/CompanyTable";

const API_BASE = "https://data-check.onrender.com/api/company";

export default function App() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchList = async (statusFilter = filter, search = "") => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 1000 };
      if (statusFilter === "active") params.status = "Active";
      const res = await axios.get(`${API_BASE}/list`, { params });
      let data = res.data.data || [];
      if (search) {
        data = data.filter((d) =>
          d.companyName.toLowerCase().includes(search.toLowerCase())
        );
      }
      setRows(data);
    } catch (err) {
      alert("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(filter, searchQuery);
  }, [filter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchList(filter, searchQuery);
    }, 400);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 p-4">
      {/* Header */}
      <h1 className="text-3xl font-extrabold mb-4 text-center text-gray-800">
        Company Project Tracker
      </h1>

      {/* Form Section */}
      <div className="w-full bg-white rounded-xl shadow-md p-4 mb-4">
        <CompanyForm onAdd={() => fetchList(filter, searchQuery)} />
      </div>

      {/* Filters & Search */}
{/*       <div className="w-full flex flex-wrap items-center gap-2 mb-4">
        {["all", "active"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto border border-gray-300 px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
 */}
      {/* Tables */}
      <div className="w-full space-y-3">
        {loading && <p className="text-center text-gray-500 text-sm">Loading...</p>}

        {!loading &&
          (filter === "active"
            ? [...new Set(rows.map((r) => r.projectName))].map((project) => (
                <div key={project} className="bg-white rounded-xl shadow p-3">
                  <h2 className="font-semibold text-lg mb-2 border-b pb-1">
                    {project}
                  </h2>
                  <CompanyTable rows={rows.filter((r) => r.projectName === project)} />
                </div>
              ))
            : <div className="bg-white rounded-xl shadow p-3">
                <CompanyTable rows={rows} />
              </div>)}
      </div>
    </div>
  );
}
