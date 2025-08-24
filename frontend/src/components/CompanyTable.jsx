import React, { memo } from "react";

function CompanyTable({ rows, loading, page, limit, isAdmin, onToggle, onDelete }) {
  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (rows.length === 0) return <div className="p-6 text-center text-gray-500">No data found</div>;

  return (
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
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const isActive = r.status === "Active";

            return (
              <tr key={r._id || idx} className="border-t hover:bg-gray-50">
                <td className="p-3">{(page - 1) * limit + idx + 1}</td>
                <td className="p-3"> 
                  <a
                      href={`https://${r.companyName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {r.companyName}
                    </a>
                </td>
                <td className="p-3">{r.projectName || "—"}</td>
                <td className="p-3">{r.empId}</td>
                <td className="p-3">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => onToggle(r.companyName)}
                    disabled={!isActive} // deactivate only active ones
                    className={`px-3 py-1 rounded text-white ${
                      isActive ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {isActive ? "Existing" : " Add "}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => onDelete(r.companyName)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(CompanyTable);
