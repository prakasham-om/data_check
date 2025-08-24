// App.jsx
import React, { useState, useCallback, lazy, Suspense } from "react";
import CompanyTable from "./components/CompanyTable";
import ExportButtons from "./components/ExportButtons";
import Pagination from "./components/Pagination";
import { useCompanies } from "./useCompanies";

const CompanyForm = lazy(() => import("./components/CompanyForm")); // lazy load

export default function App() {
  const [filters, setFilters] = useState({
    filter: "all",
    searchQuery: "",
    dateFrom: "",
    dateTo: "",
    zeroFilterActive: false,
    page: 1
  });
  const limit = 20;

  const loggedInEmpId = localStorage.getItem("empId");
  const allowedEmpIds = ["prakash", "Prakash", "8910"];
  const isAdmin = allowedEmpIds.includes(loggedInEmpId);

  const { rows, total, loading, toggleStatus, deleteCompany } = useCompanies({
    filter: filters.filter,
    searchQuery: filters.searchQuery,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    zeroFilterActive: filters.zeroFilterActive,
    page: filters.page,
    limit
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Stable handlers
  const handleSearchChange = useCallback(
    (e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value, page: 1 })),
    []
  );
  const handleDateFromChange = useCallback(
    (e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value, page: 1 })),
    []
  );
  const handleDateToChange = useCallback(
    (e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value, page: 1 })),
    []
  );
  const handleZeroToggle = useCallback(
    () => setFilters((prev) => ({ ...prev, zeroFilterActive: !prev.zeroFilterActive, page: 1 })),
    []
  );
  const handlePageChange = useCallback(
    (page) => setFilters((prev) => ({ ...prev, page })),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <h1 className="text-3xl font-bold text-center">Company Project Tracker</h1>

      {/* Lazy-loaded form */}
      <Suspense fallback={<div>Loading form...</div>}>
        <CompanyForm onAdd={() => {}} />
      </Suspense>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          value={filters.searchQuery}
          onChange={handleSearchChange}
          placeholder="Search..."
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={handleDateFromChange}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={handleDateToChange}
          className="border p-2 rounded"
        />
        <button
          className={`px-3 py-1 rounded ${
            filters.zeroFilterActive ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={handleZeroToggle}
        >
          Zero Approach
        </button>
        <ExportButtons
          filter={filters.filter}
          searchQuery={filters.searchQuery}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
        />
      </div>

      {/* Table */}
      <CompanyTable
        rows={rows}
        loading={loading}
        page={filters.page}
        limit={limit}
        isAdmin={isAdmin}
        onToggle={toggleStatus}
        onDelete={deleteCompany}
      />

      {/* Pagination */}
      <Pagination
        page={filters.page}
        totalPages={totalPages}
        onChange={handlePageChange}
      />
    </div>
  );
}
