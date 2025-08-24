// components/ExportMenu.jsx
import React, { useState } from "react";

export default function ExportMenu({ onExport, exporting }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 bg-green-600 text-white rounded"
      >
        {exporting ? "Exporting..." : "📥 Export"}
      </button>

      {open && (
        <div className="absolute mt-2 w-48 bg-white border rounded shadow z-10">
          <button
            onClick={() => { setOpen(false); onExport("all"); }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Export All
          </button>
          <button
            onClick={() => { setOpen(false); onExport("today"); }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Export Today
          </button>
          <button
            onClick={() => { setOpen(false); onExport("datewise"); }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Export Datewise
          </button>
          <button
            onClick={() => { setOpen(false); onExport("range"); }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Export Range
          </button>
        </div>
      )}
    </div>
  );
}
