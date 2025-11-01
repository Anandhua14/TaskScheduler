import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import axiosInstance from "../../../api/axiosInstance";


const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  //  Fetch stats from Django API
  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get("stats/");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return <p className="text-center text-gray-500 py-6">Loading analytics...</p>;
  }

  //  Compute Success Rate (avoid division by zero)
  const totalExecutions =
    stats.success_count + stats.fail_count + stats.retry_count + stats.pending_count;
  const successRateValue =
    totalExecutions > 0 ? ((stats.success_count / totalExecutions) * 100).toFixed(1) : 0;

  //  Charts setup
  const successRate = {
    series: [parseFloat(successRateValue)],
    options: {
      chart: { type: "radialBar" },
      labels: ["Success Rate"],
      colors: ["#22c55e"],
      plotOptions: {
        radialBar: {
          hollow: { size: "65%" },
          dataLabels: {
            name: { fontSize: "16px" },
            value: { fontSize: "20px", show: true, formatter: (val) => `${val}%` },
          },
        },
      },
    },
  };

  const taskDistribution = {
    series: [
      stats.success_count,
      stats.fail_count,
      stats.retry_count,
      stats.pending_count,
    ],
    options: {
      labels: ["Success", "Failed", "Retrying", "Pending"],
      chart: { type: "pie" },
      colors: ["#22c55e", "#ef4444", "#f59e0b", "#9ca3af"],
      legend: { position: "bottom" },
    },
  };

  const trends = {
    series: [
      {
        name: "Task Executions",
        data: [
          stats.success_count,
          stats.fail_count,
          stats.retry_count,
          stats.pending_count,
        ],
      },
    ],
    options: {
      chart: { type: "bar" },
      xaxis: {
        categories: ["Success", "Failed", "Retrying", "Pending"],
      },
      colors: ["#3b82f6"],
    },
  };

  return (
    <div className="p-6 grid grid-cols-3 gap-4">
      {/*  Success Rate */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-center items-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Task Success Rate
        </h2>
        <Chart
          options={successRate.options}
          series={successRate.series}
          type="radialBar"
          height={250}
        />
        <p className="text-sm text-gray-500 mt-2">
          {stats.success_count} / {totalExecutions} successful
        </p>
      </div>

      {/*  Distribution */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Task Status Distribution
        </h2>
        <Chart
          options={taskDistribution.options}
          series={taskDistribution.series}
          type="pie"
          height={250}
        />
      </div>

      {/*  Next Scheduled Run */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Next Scheduled Run
        </h2>
        <p className="text-2xl text-blue-600 font-bold">
          {new Date(stats.next_scheduled_run).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Total Tasks: {stats.total_tasks}
        </p>
      </div>

      {/*  Execution Trend */}
      <div className="bg-white rounded-lg shadow p-4 col-span-3">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Execution Summary
        </h2>
        <Chart
          options={trends.options}
          series={trends.series}
          type="bar"
          height={300}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
