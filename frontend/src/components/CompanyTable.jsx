import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/company";

export default function CompanyTable({ rows, setRows }) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;

  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const displayedRows = rows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Check if logged-in user can perform delete/clear
  const loggedInEmpId = localStorage.getItem("empId");
  const allowedEmpIds = ["prakash", "Prakash", "8910"];
  const canEditGlobal = allowedEmpIds.includes(loggedInEmpId);

  // Toggle Status
  const handleToggle = async (companyName) => {
    try {
      await axios.post(`${API_BASE}/toggle/${companyName}`);
      alert("Status updated");
      // Update locally
      setRows((prev) =>
        prev.map((r) =>
          r.companyName === companyName
            ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" }
            : r
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to toggle status");
    }
  };

  // Delete company
  const handleDelete = async (companyName) => {
    if (!window.confirm(`Are you sure you want to delete "${companyName}"?`)) return;

    try {
      const response = await axios.delete(`${API_BASE}/delete`, { data: { companyName } });
      if (response.data?.success || response.data === undefined) {
        alert(response.data?.message || "Company deleted successfully");
        setRows((prevRows) => prevRows.filter((r) => r.companyName !== companyName));
      } else {
        alert(response.data?.error || "Failed to delete company");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete company");
    }
  };

  // Clear Sheet
const handleClearSheet = async (sheetName) => {
  // Ask user to type the sheet name to confirm
  const input = window.prompt(`Type the sheet name "${sheetName}" to confirm clearing:`);

  if (!input || input.trim() !== sheetName) {
    alert("Sheet name mismatch. Deletion cancelled.");
    return;
  }

  try {
    await axios.post(`${API_BASE}/clear/${sheetName}`);
    alert(`Sheet "${sheetName}" cleared successfully`);

    // Remove all rows of that sheet locally
    setRows((prev) => prev.filter((r) => r.sheetName !== sheetName));
  } catch (err) {
    alert(err.response?.data?.error || "Failed to clear sheet");
  }
};


  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(totalPages || 1);
  }, [rows.length]);

  const uniqueSheets = [...new Set(rows.map((r) => r.sheetName))];

  return (
    <div>
      {/* Clear Sheet Buttons */}
      {canEditGlobal && uniqueSheets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {uniqueSheets.map((sheet) => (
            <button
              key={sheet}
              onClick={() => handleClearSheet(sheet)}
              className="px-3 py-1 rounded bg-orange-500 text-white text-sm hover:bg-orange-600 transition"
            >
              Clear {sheet}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm text-gray-700 border-collapse">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="p-2 text-left border-b">#</th>
              <th className="p-2 text-left border-b">Company</th>
              <th className="p-2 text-left border-b">Project</th>
              <th className="p-2 text-left border-b">Emp ID</th>
              <th className="p-2 text-left border-b">Date</th>
              <th className="p-2 text-center border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.length > 0 ? (
              displayedRows.map((item, i) => (
                <tr
                  key={item.companyName + i}
                  className={`hover:bg-gray-50 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-2">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                  <td className="p-2 font-medium">{item.companyName}</td>
                  <td className="p-2">{item.projectName}</td>
                  <td className="p-2">{item.empId}</td>
                  <td className="p-2">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-center flex justify-center gap-1">
                    {item.status === "Active" ? (
                      <button
                        onClick={() => handleToggle(item.companyName)}
                        className="px-3 py-1 rounded bg-green-500 text-white text-sm hover:bg-green-600 transition"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-1 rounded bg-gray-400 text-white text-sm cursor-not-allowed"
                      >
                        Active
                      </button>
                    )}
                    {/* Delete only if logged-in user is allowed */}
                    {canEditGlobal && (
                      <button
                        onClick={() => handleDelete(item.companyName)}
                        className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-3">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-3 py-1 rounded ${
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
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
