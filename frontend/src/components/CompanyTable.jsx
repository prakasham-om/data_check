// CompanyTable.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API_BASE = "https://data-check.onrender.com/api/sheet";

export default function CompanyTable() {
  // data + UI state
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filter, setFilter] = useState("all"); // all / active
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [zeroFilterActive, setZeroFilterActive] = useState(false);
  const [clientFilteredRows, setClientFilteredRows] = useState(null); // used for zero approach
  const [exporting, setExporting] = useState(false);

  const searchDebounce = useRef(null);
  const abortRef = useRef(null);

  const loggedInEmpId = localStorage.getItem("empId");
  const allowedEmpIds = ["prakash", "Prakash", "8910"];
  const isAdmin = allowedEmpIds.includes(loggedInEmpId);

  const todayISO = new Date().toISOString().split("T")[0];

  // fetch rows from server (server-side pagination & filters)
  const fetchRows = useCallback(async (opts = {}) => {
    setLoading(true);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const params = {
        page: opts.page ?? page,
        limit,
        status: filter === "active" ? "Active" : undefined,
        q: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const res = await axios.get(`${API_BASE}/list`, {
        params,
        signal: abortRef.current.signal,
      });

      const data = res.data?.data || [];
      setRows(data);
      setTotal(res.data?.total || 0);

      // If zero-approach toggle is active, apply client-side filter (status active + activeValue === 0)
      if (zeroFilterActive) {
        const zeroSet = data.filter((r) => r.status === "Active" && Number(r.activeValue) === 0);
        setClientFilteredRows(zeroSet);
      } else {
        setClientFilteredRows(null);
      }
    } catch (err) {
      if (!axios.isCancel?.(err)) {
        console.error("Fetch error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter, searchQuery, dateFrom, dateTo, zeroFilterActive]);

  // initial & dependency fetch
  useEffect(() => {
    // reset page when filters change
    setPage(1);
    fetchRows({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchQuery, dateFrom, dateTo, zeroFilterActive]);

  // debounce search input (local)
  const onSearchChange = (e) => {
    const v = e.target.value;
    setSearchQuery(v);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      // fetchRows will be triggered by searchQuery change effect
      // no-op here (we already rely on effect)
    }, 350);
  };

  // pagination change
  useEffect(() => {
    fetchRows({ page });
  }, [page, fetchRows]);

  // Toggle (activate/inactivate) — backend will flip or set to Inactive depending on implementation.
  const handleToggle = async (companyName) => {
    try {
      const res = await axios.post(`${API_BASE}/toggle/${encodeURIComponent(companyName)}`);
      if (res.data?.success) {
        fetchRows();
      }
      alert(res.data?.message || res.data?.error || "Toggled");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Toggle failed");
    }
  };

  // Delete row
  const handleDelete = async (companyName) => {
    if (!window.confirm(`Delete "${companyName}"? This is permanent.`)) return;
    try {
      const res = await axios.delete(`${API_BASE}/delete`, { data: { companyName } });
      if (res.data?.success) {
        // if last item on page removed, move to previous page if needed
        const newTotal = Math.max(0, total - 1);
        const maxPage = Math.max(1, Math.ceil(newTotal / limit));
        if (page > maxPage) setPage(maxPage);
        fetchRows();
      }
      alert(res.data?.message || res.data?.error || "Deleted");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  // Clear last sheet (admin)
  const handleClear = async () => {
    if (!isAdmin) return alert("Not authorized");
    if (!window.confirm("Clear the last sheet? This will delete all rows in that sheet.")) return;
    try {
      await axios.post(`${API_BASE}/clear`);
      alert("Sheet cleared");
      fetchRows();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Clear failed");
    }
  };

  // Export (download from backend). We fetch blob and prompt download (supports large files).
  const handleExport = async (mode = "all") => {
    try {
      setExporting(true);
      const params = { mode };
      if (mode === "range") {
        if (!dateFrom || !dateTo) return alert("Please provide dateFrom and dateTo for range export");
        params.dateFrom = dateFrom;
        params.dateTo = dateTo;
      }
      if (filter === "active") params.status = "Active";
      if (searchQuery) params.q = searchQuery;

      const res = await axios.get(`${API_BASE}/export`, {
        params,
        responseType: "blob",
      });

      const fileName = res.headers["content-disposition"]?.match(/filename="?([^"]+)"?/)?.[1] || `companies_${mode}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", fileName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert(err.response?.data?.error || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // stats
  const totalRecords = total;
  const addedToday = rows.filter((r) => r.createdAt?.split("T")[0] === todayISO).length;
  const zeroCount = (rows.filter((r) => r.status === "Active" && Number(r.activeValue) === 0) || []).length;

  // displayed rows (consider client-side zero filter)
  const displayedRows = clientFilteredRows ?? rows;

  // Simple pagination UI data
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const pageButtons = [];
  const maxButtons = 7;
  let startBtn = Math.max(1, page - Math.floor(maxButtons / 2));
  let endBtn = Math.min(totalPages, startBtn + maxButtons - 1);
  if (endBtn - startBtn < maxButtons - 1) startBtn = Math.max(1, endBtn - maxButtons + 1);
  for (let p = startBtn; p <= endBtn; p++) pageButtons.push(p);

  return (
    <div className="space-y-6 p-4">
      {/* header / controls */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFilter("all");
              setZeroFilterActive(false);
            }}
            className={`px-3 py-2 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter("active");
              setZeroFilterActive(false);
            }}
            className={`px-3 py-2 rounded ${filter === "active" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
          >
            Active
          </button>
          <button
            onClick={() => {
              // toggle zero approach
              setZeroFilterActive((v) => !v);
              setFilter("active");
              setPage(1);
            }}
            className={`px-3 py-2 rounded ${zeroFilterActive ? "bg-red-600 text-white" : "bg-red-100"}`}
            title="Show Active rows with activeValue === 0"
          >
            Zero Approach: {zeroCount}
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
          <input
            type="text"
            placeholder="Search company..."
            className="border px-3 py-2 rounded w-full md:w-64"
            value={searchQuery}
            onChange={onSearchChange}
          />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border px-2 py-2 rounded" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border px-2 py-2 rounded" />

          {isAdmin && (
            <button onClick={handleClear} className="px-3 py-2 bg-red-600 text-white rounded">
              Clear Sheet
            </button>
          )}
        </div>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white border rounded shadow-sm text-center">
          <div className="text-xs text-gray-500">Total Records</div>
          <div className="text-lg font-semibold">{totalRecords}</div>
        </div>
        <div className="p-3 bg-white border rounded shadow-sm text-center">
          <div className="text-xs text-gray-500">Added Today</div>
          <div className="text-lg font-semibold">{addedToday}</div>
        </div>
        <div className="p-3 bg-white border rounded shadow-sm text-center">
          <div className="text-xs text-gray-500">Zero Approach (on page)</div>
          <div className="text-lg font-semibold">{zeroCount}</div>
        </div>
        <div className="p-3 bg-white border rounded shadow-sm text-center">
          <div className="text-xs text-gray-500">Page</div>
          <div className="text-lg font-semibold">{page}/{totalPages}</div>
        </div>
      </div>

      {/* export buttons */}
      <div className="flex gap-2 items-center">
        <button onClick={() => handleExport("all")} disabled={exporting} className="px-3 py-2 bg-green-600 text-white rounded">
          {exporting ? "Exporting..." : "Export All"}
        </button>
        <button onClick={() => handleExport("today")} disabled={exporting} className="px-3 py-2 bg-blue-600 text-white rounded">
          Export Today
        </button>
        <button onClick={() => handleExport("datewise")} disabled={exporting} className="px-3 py-2 bg-purple-600 text-white rounded">
          Export Datewise
        </button>
        <button onClick={() => handleExport("range")} disabled={exporting} className="px-3 py-2 bg-gray-700 text-white rounded">
          Export Range
        </button>
        <div className="text-sm text-gray-500 ml-4">Tip: use date range then Export Range</div>
      </div>

      {/* table */}
      <div className="overflow-x-auto bg-white border rounded shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
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
            {loading ? (
              <tr><td colSpan="7" className="p-6 text-center">Loading...</td></tr>
            ) : displayedRows.length > 0 ? (
              displayedRows.map((r, idx) => (
                <tr key={`${r.sheetName}-${r.rowId || idx}`} className="border-t hover:bg-gray-50">
                  <td className="p-3">{(page - 1) * limit + idx + 1}</td>
                  <td className="p-3">
                    <a href={`https://${r.companyName}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {r.companyName}
                    </a>
                  </td>
                  <td className="p-3">{r.projectName || "—"}</td>
                  <td className="p-3">{r.empId}</td>
                  <td className="p-3">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${r.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-center space-x-2">
                    {r.status === "Active" ? (
                      <button onClick={() => handleToggle(r.companyName)} className="px-3 py-1 bg-yellow-500 text-white rounded">Deactivate</button>
                    ) : (
                      <button onClick={() => handleToggle(r.companyName)} className="px-3 py-1 bg-green-500 text-white rounded">Activate</button>
                    )}
                    {isAdmin && <button onClick={() => handleDelete(r.companyName)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="p-6 text-center text-gray-500">No data found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-100 rounded">Prev</button>
        {pageButtons.map((p) => (
          <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded ${p === page ? "bg-blue-600 text-white" : "bg-gray-100"}`}>{p}</button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 bg-gray-100 rounded">Next</button>
      </div>
    </div>
  );
}
