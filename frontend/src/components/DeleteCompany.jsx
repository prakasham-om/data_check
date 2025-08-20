import React from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/company";

export default function DeleteCompany({ companyName, onSuccess }) {
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${companyName}?`)) return;

    try {
      await axios.delete(`${API_BASE}/delete/${companyName}`);
      alert("Deleted successfully");
      onSuccess(); // <-- trigger refresh in parent
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 transition"
    >
      Delete
    </button>
  );
}
