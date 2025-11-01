import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";

const TaskIndex = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [enable, setEnable] = useState(false);
  const [dependency, setDependency] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  //  Fetch all tasks
  const fetchTasks = async () => {
    try {
      const res = await axiosInstance.get("tasks/");
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  //  Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dependency && editingId === parseInt(dependency))
      return alert(" A task cannot depend on itself!");

    const dependentTask = tasks.find((t) => t.id === parseInt(dependency));
    if (dependentTask?.dependency === editingId)
      return alert(" Circular dependency detected!");

    const payload = {
      name: title,
      task_type: "ETL",
      cron_expression: "*/5 * * * *",
      dependency: dependency || null,
      enabled: enable, //  correctly send boolean
    };

    const url = editingId ? `tasks/${editingId}/` : "tasks/";
    const method = editingId ? "patch" : "post";

    try {
      await axiosInstance[method](url, payload);
      fetchTasks();
      setTitle("");
      setDependency("");
      setEnable(false);
      setEditingId(null);
    } catch (error) {
      console.error(`Error ${editingId ? "updating" : "creating"} task:`, error);
      alert(" Failed to save task");
    }
  };

  //  Edit existing task
  const handleEdit = (id) => {
    const task = tasks.find((t) => t.id === id);
    setTitle(task.name);
    setDependency(task.dependency || "");
    setEnable(Boolean(task.enabled)); //  read from backend
    setEditingId(id);
  };

  //  Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axiosInstance.delete(`tasks/${id}/`);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  //  Manual Trigger Simulation
  const handleManualTrigger = async (id) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isRunning: true } : t))
      );
      const res = await axiosInstance.post(`tasks/${id}/run/`);
      const updated = res.data;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...updated, isRunning: false } : t
        )
      );
      alert(updated.message);
    } catch (err) {
      alert(err.response?.data?.error || " Failed to run task");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isRunning: false } : t
        )
      );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Paused":
        return "bg-yellow-100 text-yellow-700";
      case "Running":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Task Management</h1>

      {/* Form Section */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-3 mb-6 bg-white shadow p-4 rounded-lg"
      >
        {/* Task Name */}
        <div className="flex flex-col flex-1">
          <label className="text-sm text-gray-600 mb-1">Task Name</label>
          <input
            type="text"
            placeholder="Enter task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Dependency Dropdown */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Depends On</label>
          <select
            value={dependency}
            onChange={(e) => setDependency(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-52"
          >
            <option value="">None</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        </div>

        {/* Enable/Disable Dropdown */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Enable/Disable</label>
          <select
            value={enable ? "true" : "false"}
            onChange={(e) => setEnable(e.target.value === "true")}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-52"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      {/* Task List */}
      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks yet. Create one above.</p>
      ) : (
        <div className="bg-white shadow rounded-lg divide-y">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 hover:bg-gray-50 transition-all"
            >
              <div>
                <p className="font-medium text-gray-800">{task.name}</p>
                <p className="text-xs text-gray-400">
                  Created:{" "}
                  {new Date(task.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {task.dependency && (
                  <p className="text-xs text-gray-500">
                    Depends on:{" "}
                    {tasks.find((t) => t.id === task.dependency)?.name ||
                      "(Deleted Task)"}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2 md:mt-0 items-center">
                {/* Status */}
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>

                {/* Enable Badge */}
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    task.enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {task.enabled ? "Enabled" : "Disabled"}
                </span>

                {/* Run Button */}
                <button
                  onClick={() => handleManualTrigger(task.id)}
                  disabled={task.isRunning || !task.enabled}
                  className={`px-3 py-1 text-sm rounded ${
                    task.isRunning
                      ? "bg-blue-300 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:opacity-50`}
                >
                  {task.isRunning ? "Running..." : "Run Now"}
                </button>

                {/* Edit/Delete */}
                <button
                  onClick={() => handleEdit(task.id)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskIndex;
