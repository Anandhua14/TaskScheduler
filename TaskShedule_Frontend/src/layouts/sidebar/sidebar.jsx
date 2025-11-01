import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const baseClasses =
    "flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium";

  const menuItems = [
    { name: "Dashboard", path: "/", icon: "🏠" },
    { name: "Task Management", path: "/tasks", icon: "🗂️" },
    { name: "Cron Builder", path: "/cron-builder", icon: "⏰" },
    { name: "Monitoring", path: "/monitoring", icon: "📡" },
    { name: "Execution Logs", path: "/logs", icon: "📝" },
    // { name: "Analytics", path: "/analytics", icon: "📊" },
  ];

  return (
    <div className="w-72 fixed top-0 left-0 h-screen bg-gray-900 text-white shadow-xl flex flex-col">
      {/* Logo / App Name */}
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400 tracking-wide">
          Task Scheduler
        </h1>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `${baseClasses} ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-300 hover:bg-blue-500 hover:text-white"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        © 2025 Task Scheduler
      </div>
    </div>
  );
};

export default Sidebar;
