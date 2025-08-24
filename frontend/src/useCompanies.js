import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API_BASE = "https://data-check.onrender.com/api/sheet";

export function useCompanies({ filter, searchQuery, dateFrom, dateTo, zeroFilterActive, page, limit }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const params = {
        page,
        limit,
        status: filter === "active" ? "Active" : undefined,
        q: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const res = await axios.get(`${API_BASE}/list`, { params, signal: abortRef.current.signal });
      let data = res.data?.data || [];

      // Apply zeroApproach filter on client
      if (zeroFilterActive) {
        data = data.filter(r => r.status === "Active" && Number(r.activeValue) === 0);
      }

      setRows(data);
      setTotal(res.data?.total || 0);
    } catch (err) {
      if (!axios.isCancel?.(err)) console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter, searchQuery, dateFrom, dateTo, zeroFilterActive]);

  // Toggle status
  const toggleStatus = useCallback(async (companyName) => {
    try {
      await axios.post(`${API_BASE}/toggle/${companyName}`);
      fetchRows(); // Refresh table after toggle
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to toggle status");
    }
  }, [fetchRows]);

  // Delete company
  const deleteCompany = useCallback(async (companyName) => {
    try {
      await axios.delete(`${API_BASE}/delete/${companyName}`);
      fetchRows(); // Refresh table after deletion
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete company");
    }
  }, [fetchRows]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return { rows, total, loading, fetchRows, toggleStatus, deleteCompany };
}
