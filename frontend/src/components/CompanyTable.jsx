import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const API_BASE = "https://data-check.onrender.com/api/csv";

export default function CompanyTable() {
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredRows, setFilteredRows] = useState(null);
  const [filter, setFilter] = useState("all"); // all / active
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounce = useRef(null);
  const rowsPerPage = 20;

  const loggedInEmpId = localStorage.getItem("empId");
  const allowedEmpIds = ["prakash", "Prakash", "8910"];
  const canEditGlobal = allowedEmpIds.includes(loggedInEmpId);

  // Fetch rows from backend
  const fetchRows = async () => {
    try {
      const res = await axios.get(`${API_BASE}/list`);
      let data = res.data.data || [];

      // Apply filter
      if (filter === "active") {
        data = data.filter((r) => r.status.toLowerCase() === "active");
      }

      // Apply search
      if (searchQuery.trim() !== "") {
        data = data.filter((r) =>
          r.companyName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setRows(data);
      setFilteredRows(null); // reset filteredRows when fetching
    } catch (err) {
      console.error("Fetch rows error:", err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [filter, searchQuery]);

  // Pagination helpers
  const displayedRows = filteredRows ?? rows;
  const totalPages = Math.ceil(displayedRows.length / rowsPerPage);
  const paginatedRows = displayedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => setCurrentPage(1), [rows.length, filteredRows]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Toggle company
  const handleToggle = async (companyName) => {
    try {
      const res = await axios.post(`${API_BASE}/toggle/${companyName}`);
      if (res.data.success) {
        fetchRows();
        alert(res.data.message || "Status toggled successfully");
      } else {
        alert(res.data.error || "Failed to toggle");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to toggle status");
    }
  };

  // Delete company
  const handleDelete = async (companyName) => {
    if (!window.confirm(`Delete "${companyName}"?`)) return;
    try {
      const res = await axios.delete(`${API_BASE}/delete`, { data: { companyName } });
      if (res.data.success) {
        fetchRows();
        alert(res.data.message || "Deleted successfully");
      } else {
        alert(res.data.error || "Failed to delete");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const addedToday = rows.filter((r) => r.createdAt?.split("T")[0] === today).length;
  const zeroCount = rows.filter((r) => r.status === "Active" && r.activeValue === "0").length;

  // Handle search input with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchRows(), 300);
  };
   const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    XLSX.writeFile(wb, "companies.xlsx");
  };

  return (
    <div className="space-y-5">
      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {["all", "active"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === f
                ? "bg-blue-600 text-white shadow-md"
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
          onChange={handleSearch}
          className="ml-auto border border-gray-300 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />

        <div
          onClick={() => setFilteredRows(rows.filter((r) => r.activeValue === "0"))}
          className="px-4 py-2 rounded-xl bg-red-100 text-red-700 cursor-pointer hover:bg-red-200 text-sm font-medium shadow-sm"
        >
          Zero Approach: {zeroCount}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className="p-3 bg-blue-50 border rounded-xl text-center shadow-sm">
        <button onClick={exportCSV} className="text-lg text-gray-900">
          Download XCEL

        </button>
      </div>
        <div className="p-3 bg-blue-50 border rounded-xl text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Records</p>
          
          <p className="text-lg font-semibold text-blue-600">{rows.length}</p>
        </div>
        <div className="p-3 bg-green-50 border rounded-xl text-center shadow-sm">
          <p className="text-xs text-gray-500">Added Today</p>
          <p className="text-lg font-semibold text-green-600">{addedToday}</p>
        </div>
        <div className="p-3 bg-purple-50 border rounded-xl text-center shadow-sm">
          <p className="text-xs text-gray-500">Page</p>
          <p className="text-lg font-semibold text-purple-600">
            {currentPage}/{totalPages || 1}
          </p>
        </div>
      </div>

      {filteredRows && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setFilteredRows(null)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-md border">
        <table className="w-full text-sm text-gray-700 border-collapse">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs sticky top-0">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Project</th>
              <th className="p-3 text-left">Emp ID</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((item, i) => (
                <tr key={item.companyName + i} className="hover:bg-gray-50 transition border-t">
                  <td className="p-3">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                  <td className="p-3 font-medium">
                    <a
                      href={item.companyName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.companyName}
                    </a>
                  </td>
                  <td className="p-3">{item.projectName || "No Project"}</td>
                  <td className="p-3">{item.empId}</td>
                  <td className="p-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-center flex justify-center gap-2">
                    {item.status === "Active" ? (
                      <button
                        onClick={() => handleToggle(item.companyName)}
                        className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-1 rounded-lg bg-gray-400 text-white text-sm cursor-not-allowed"
                      >
                        Existing
                      </button>
                    )}
                    {canEditGlobal && (
                      <button
                        onClick={() => handleDelete(item.companyName)}
                        className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-500 italic">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-3">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i + 1)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === i + 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
