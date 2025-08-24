import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API_BASE = "https://data-check.onrender.com/api/sheet";

export function useCompanies({ filter, searchQuery, dateFrom, dateTo, zeroFilterActive, page, limit }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef(null);

  // Fetch rows
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
      if (zeroFilterActive) data = data.filter((r) => r.status === "Active" && Number(r.activeValue) === 0);
      setRows(data);
      setTotal(res.data?.total || 0);
    } catch (err) {
      if (!axios.isCancel?.(err)) console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filter, searchQuery, dateFrom, dateTo, zeroFilterActive]);

  // Toggle Active/Inactive
  const toggleCompany = useCallback(async (companyName, currentStatus) => {
    if (currentStatus !== "Active") return; // only active can be deactivated
    try {
      const res = await axios.post(`${API_BASE}/toggle`, { companyName });
      if (res.data?.success) {
        setRows((prev) =>
          prev.map((r) =>
            r.companyName === companyName ? { ...r, status: "Inactive" } : r
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Delete Company (admin only)
  const deleteCompany = useCallback(async (companyName) => {
    try {
      const res = await axios.delete(`${API_BASE}/delete`, { data: { companyName } });
      if (res.data?.success) {
        setRows((prev) => prev.filter((r) => r.companyName !== companyName));
        setTotal((prev) => prev - 1);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  return { rows, total, loading, fetchRows, toggleCompany, deleteCompany };
}
