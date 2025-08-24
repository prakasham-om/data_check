import React, { useState } from "react";
import CompanyForm from "./components/CompanyForm";
import CompanyTable from "./components/CompanyTable";
import ExportButtons from "./components/ExportButtons";
import Pagination from "./components/Pagination";
import { useCompanies } from "./useCompanies";

export default function App() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [zeroFilterActive, setZeroFilterActive] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const loggedInEmpId = localStorage.getItem("empId");
  const allowedEmpIds = ["prakash", "Prakash", "8910"];
  const isAdmin = allowedEmpIds.includes(loggedInEmpId);

  const { rows, total, loading, fetchRows } = useCompanies({
    filter,
    searchQuery,
    dateFrom,
    dateTo,
    zeroFilterActive,
    page,
    limit,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <h1 className="text-3xl font-bold text-center">Company Project Tracker</h1>

      <CompanyForm onAdd={fetchRows} />

      <div className="flex gap-2 items-center">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="border p-2 rounded" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border p-2 rounded" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border p-2 rounded" />
        <ExportButtons filter={filter} searchQuery={searchQuery} dateFrom={dateFrom} dateTo={dateTo} />
      </div>

      <CompanyTable rows={rows} loading={loading} page={page} limit={limit} isAdmin={isAdmin} onToggle={() => fetchRows()} onDelete={() => fetchRows()} />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
