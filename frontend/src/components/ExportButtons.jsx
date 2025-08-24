import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://data-check.onrender.com/api/sheet";

export default function ExportButtons({ filter, searchQuery, dateFrom, dateTo }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (mode = "all") => {
    try {
      setExporting(true);
      const params = { mode };
      if (mode === "range") {
        if (!dateFrom || !dateTo) return alert("Please select range first");
        params.dateFrom = dateFrom;
        params.dateTo = dateTo;
      }
      if (filter === "active") params.status = "Active";
      if (searchQuery) params.q = searchQuery;

      const res = await axios.get(`${API_BASE}/export`, { params, responseType: "blob" });
      const fileName =
        res.headers["content-disposition"]?.match(/filename="?([^"]+)"?/)?.[1] || `companies_${mode}.xlsx`;
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

  return (
    <div className="flex gap-2 items-center">
      <button onClick={() => handleExport("all")} disabled={exporting} className="px-3 py-2 bg-green-600 text-white rounded">
        {exporting ? "Exporting..." : "Export All"}
      </button>
      <button onClick={() => handleExport("today")} className="px-3 py-2 bg-blue-600 text-white rounded">
        Export Today
      </button>
      <button onClick={() => handleExport("datewise")} className="px-3 py-2 bg-purple-600 text-white rounded">
        Export Datewise
      </button>
      <button onClick={() => handleExport("range")} className="px-3 py-2 bg-gray-700 text-white rounded">
        Export Range
      </button>
    </div>
  );
}
