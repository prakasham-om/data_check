import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://data-check.onrender.com/api/sheet";

export default function ExportButtons({ filter, searchQuery, dateFrom, dateTo }) {
  const [loadingMode, setLoadingMode] = useState(null); // track which button is loading

  const handleExport = async (mode = "all") => {
    try {
      setLoadingMode(mode);
      const params = { mode };

      if (mode === "range") {
        if (!dateFrom || !dateTo) {
          alert("Please select range first");
          setLoadingMode(null);
          return;
        }
        params.dateFrom = dateFrom;
        params.dateTo = dateTo;
      }
      if (filter === "active") params.status = "Active";
      if (searchQuery) params.q = searchQuery;

      const res = await axios.get(`${API_BASE}/export`, {
        params,
        responseType: "blob",
      });

      const fileName =
        res.headers["content-disposition"]?.match(/filename="?([^"]+)"?/)?.[1] ||
        `companies_${mode}.xlsx`;

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
      setLoadingMode(null);
    }
  };

  const buttonBase =
    "px-4 py-2 rounded text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <button
        onClick={() => handleExport("all")}
        disabled={loadingMode !== null}
        className={`${buttonBase} bg-green-600 hover:bg-green-700`}
      >
        {loadingMode === "all" ? "Exporting..." : "Export All"}
      </button>

      <button
        onClick={() => handleExport("today")}
        disabled={loadingMode !== null}
        className={`${buttonBase} bg-blue-600 hover:bg-blue-700`}
      >
        {loadingMode === "today" ? "Exporting..." : "Export Today"}
      </button>

      <button
        onClick={() => handleExport("datewise")}
        disabled={loadingMode !== null}
        className={`${buttonBase} bg-purple-600 hover:bg-purple-700`}
      >
        {loadingMode === "datewise" ? "Exporting..." : "Export Datewise"}
      </button>

      <button
        onClick={() => handleExport("range")}
        disabled={loadingMode !== null}
        className={`${buttonBase} bg-gray-700 hover:bg-gray-800`}
      >
        {loadingMode === "range" ? "Exporting..." : "Export Range"}
      </button>
    </div>
  );
}
