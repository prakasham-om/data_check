import React from "react";

export default function Pagination({ page, totalPages, onChange }) {
  const pageButtons = [];
  const maxButtons = 7;
  let startBtn = Math.max(1, page - Math.floor(maxButtons / 2));
  let endBtn = Math.min(totalPages, startBtn + maxButtons - 1);
  if (endBtn - startBtn < maxButtons - 1) startBtn = Math.max(1, endBtn - maxButtons + 1);
  for (let p = startBtn; p <= endBtn; p++) pageButtons.push(p);

  return (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="px-3 py-1 bg-gray-100 rounded">
        Prev
      </button>
      {pageButtons.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded ${p === page ? "bg-blue-600 text-white" : "bg-gray-100"}`}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="px-3 py-1 bg-gray-100 rounded">
        Next
      </button>
    </div>
  );
}
