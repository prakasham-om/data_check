import React, { useState } from "react";
import axios from "axios";
import { FiTrash2, FiCheckCircle } from "react-icons/fi";

const API_BASE = "http://localhost:5000/api/company";

export default function ClearSheetButton({ sheetName, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClear = async () => {
    if (!window.confirm(`Are you sure you want to clear sheet ${sheetName}?`))
      return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/clear/${sheetName}`);
      setSuccess(true);
      onSuccess();
      setTimeout(() => setSuccess(false), 1500);
    } catch (err) {
      alert(err.response?.data?.error || "Clear failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClear}
        disabled={loading}
        className="flex items-center px-3 py-1 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600 disabled:opacity-50 transition"
      >
        <FiTrash2 className="mr-1" /> Clear Sheet
      </button>

      {success && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white p-2 rounded-full shadow-lg animate-bounce">
          <FiCheckCircle className="text-green-500 w-6 h-6" />
        </div>
      )}
    </div>
  );
}
