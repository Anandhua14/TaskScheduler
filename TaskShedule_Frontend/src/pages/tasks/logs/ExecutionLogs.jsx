import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";

const ExecutionLogs = () => {
  const [logs, setLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchName, setSearchName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch logs from Django API using axiosInstance
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("logs/"); // baseURL already included
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchLogs();
    // const interval = setInterval(fetchLogs, 0);
    // return () => clearInterval(interval);
  }, []);

  // ✅ Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesStatus = !statusFilter || log.status === statusFilter;
    const matchesName =
      !searchName ||
      log.task_name.toLowerCase().includes(searchName.toLowerCase());
    const logDate = log.finished_at ? log.finished_at.split("T")[0] : "";
    const matchesDate =
      (!dateFrom || logDate >= dateFrom) && (!dateTo || logDate <= dateTo);
    return matchesStatus && matchesName && matchesDate;
  });

  // ✅ Status color helper
  const getStatusColor = (status) => {
    if (!status) return "bg-gray-200 text-gray-600";

    const normalized = status.trim().toLowerCase();

    console.log(normalized)

    switch (normalized) {
      case "success":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "retrying":
        return "bg-yellow-100 text-yellow-700";
      case "running":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };



  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6 text-blue-600">
        Execution Logs
      </h1>

      {/* Filters Section */}
      <div className="bg-white shadow p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-40 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Running">Running</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Task Name</label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by task name"
            className="border border-gray-300 rounded px-3 py-2 w-56 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <button
          onClick={() => {
            setStatusFilter("");
            setSearchName("");
            setDateFrom("");
            setDateTo("");
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-all ml-auto"
        >
          Clear Filters
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-center py-6 text-gray-500">Loading logs...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-600 uppercase text-xs bg-gray-100">
              <tr>
                <th className="px-3 py-3 text-left">Task Name</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Finished At</th>
                <th className="px-3 py-3 text-left">Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {log.task_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.finished_at
                        ? new Date(log.finished_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.message}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center px-4 py-6 text-gray-400 italic"
                  >
                    No logs found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExecutionLogs;
