// CompanyTable.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = "https://data-check.onrender.com/api/sheet";

export default function CompanyTable() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all/active
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportMode, setExportMode] = useState("all"); // all | today | datewise | range
  const searchDebounce = useRef(null);

  const rowsPerPage = 20;

  const fetchRows = async () => {
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        q: searchQuery || undefined,
        status: filter === "active" ? "Active" : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      const res = await axios.get(`${API_BASE}/list`, { params });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Fetch rows error:", err);
    }
  };

  useEffect(() => { fetchRows(); }, [filter, currentPage, dateFrom, dateTo]);

  // debounce search
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setCurrentPage(1);
      fetchRows();
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  const today = new Date().toISOString().split("T")[0];
  const addedToday = rows.filter((r) => (r.createdAt || "").slice(0,10) === today).length;

  // ---------- EXPORT XLSX ----------
  const downloadExcel = async () => {
    try {
      const params = {
        mode: exportMode, // all | today | datewise | range
        q: searchQuery || undefined,
        status: filter === "active" ? "Active" : undefined,
        dateFrom: exportMode === "range" ? (dateFrom || undefined) : undefined,
        dateTo: exportMode === "range" ? (dateTo || undefined) : undefined,
      };

      const res = await axios.get(`${API_BASE}/export`, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const tag =
        exportMode === "today" ? "today" :
        exportMode === "range" ? `${dateFrom || "from"}_${dateTo || "to"}` :
        exportMode === "datewise" ? "datewise" : "all";
      a.download = `companies_${tag}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {["all", "active"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === f ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
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
          className="ml-auto border border-gray-300 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />

        {/* Date range (optional for filtering & export range) */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 px-3 py-2 rounded-xl text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 px-3 py-2 rounded-xl text-sm"
        />

        {/* Export controls */}
        <select
          value={exportMode}
          onChange={(e) => setExportMode(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded-xl text-sm"
        >
          <option value="all">Export: All (multi-sheet)</option>
          <option value="today">Export: Today</option>
          <option value="datewise">Export: Date-wise (one sheet per date)</option>
          <option value="range">Export: Date Range</option>
        </select>
        <button
          onClick={downloadExcel}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          Download XLSX
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-blue-50 border rounded-xl text-center shadow-sm">
          <p className="text-xs text-gray-500">Total (filtered)</p>
          <p className="text-lg font-semibold text-blue-600">{total}</p>
        </div>
        <div className="p-3 bg-green-50 border rounded-xl text-center shadow-sm">
          <p className="text-xs text-gray-500">Added Today (on page)</p>
          <p className="text-lg font-semibold text-green-600">{addedToday}</p>
        </div>
        <div className="p-3 bg-purple-50 border rounded-xl text-center shadow-sm">
          <p className="text-xs text-gray-500">Page</p>
          <p className="text-lg font-semibold text-purple-600">
            {currentPage}/{totalPages}
          </p>
        </div>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((item, i) => (
              <tr key={item.companyName + i} className="hover:bg-gray-50 transition border-t">
                <td className="p-3">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                <td className="p-3 font-medium">
                  <a
                    href={`https://${item.companyName}`}
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
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-500 italic">No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
