import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";


const MonitoringDashboard = () => {
  const [runningTasks, setRunningTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentExecutions, setRecentExecutions] = useState([]);

  const fetchLogs = async () => {
    try {
      const response = await axiosInstance.get("logs/");
      const logs = response.data;

      // Separate logs by status
      setRunningTasks(logs.filter((t) => t.status === "Running"));
      setUpcomingTasks(logs.filter((t) => t.status === "Pending" && t.enabled));
      setRecentExecutions(logs.filter((t) =>
        ["Success", "Failed", "Retrying"].includes(t.status)
      ));
    } catch (error) {
      console.error("Error fetching logs:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 grid grid-cols-3 gap-4">
      {/* Running Tasks */}
      {/* <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-3 text-blue-600">Running Tasks</h2>
        {runningTasks.length ? (
          runningTasks.map((t) => (
            <p key={t.id}>⚙️ {t.name} — {t.status}</p>
          ))
        ) : (
          <p className="text-gray-500">No running tasks</p>
        )}
      </div> */}

      {/* Upcoming Tasks */}
      {/* <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-3 text-yellow-600">Upcoming</h2>
        {upcomingTasks.length ? (
          upcomingTasks.map((t) => (
            <p key={t.id}>🕒 {t.name} — Next run: {new Date(t.next_run_time).toLocaleTimeString()}</p>
          ))
        ) : (
          <p className="text-gray-500">No upcoming tasks</p>
        )}
      </div> */}

      {/* Recent Executions */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-3 text-green-600">Recent Executions</h2>
        {recentExecutions.length ? (
          recentExecutions.map((t) => (
            <p key={t.id}>
              {t.status === "Success" ? "" : t.status === "Failed" ? "" : ""}{" "}
              {t.name} — {t.status}
            </p>
          ))
        ) : (
          <p className="text-gray-500">No recent executions</p>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
