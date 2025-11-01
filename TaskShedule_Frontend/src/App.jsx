import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./layouts/sidebar/sidebar";
import AnalyticsDashboard from "./pages/tasks/analytics/AnalyticsDashboard";
import TaskIndex from "./pages/tasks/taskIndex/TaskIndex";
import CronBuilder from "./pages/tasks/cronBuilder/CronBuilder";
import MonitoringDashboard from "./pages/tasks/monitoring/MonitoringDashboard";
import ExecutionLogs from "./pages/tasks/logs/ExecutionLogs";

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <section className="ml-72 flex-1 bg-gray-50 min-h-screen p-6">
          <Routes>
            <Route path="/" element={<AnalyticsDashboard />} />
            <Route path="/tasks" element={<TaskIndex />} />
            <Route path="/cron-builder" element={<CronBuilder />} />
            <Route path="/monitoring" element={<MonitoringDashboard />} />
            <Route path="/logs" element={<ExecutionLogs />} />
            {/* <Route path="/analytics" element={<AnalyticsDashboard />} /> */}
          </Routes>
        </section>
      </div>
    </Router>
  );
}

export default App;
