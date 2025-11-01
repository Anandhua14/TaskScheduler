import React, { useState, useEffect } from "react";
import cronstrue from "cronstrue";
import { parseExpression } from "cron-parser";

const CronBuilder = () => {
  const [expression, setExpression] = useState("*/5 * * * * *"); // every 5 seconds
  const [error, setError] = useState("");
  const [nextRuns, setNextRuns] = useState([]);

  useEffect(() => {
    // run console log every 5 seconds
    const interval = setInterval(() => {
      console.log("Task executed at:", new Date().toLocaleTimeString());
    }, 5000);

    // cleanup when component unmounts
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setExpression(value);

    try {
      const interval = parseExpression(value);
      const runs = [];
      for (let i = 0; i < 5; i++) {
        runs.push(interval.next().toString());
      }
      setNextRuns(runs);
      setError("");
    } catch (err) {
      setError("Invalid cron expression");
      setNextRuns([]);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Cron Expression Builder</h1>
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <input
          type="text"
          value={expression}
          onChange={handleChange}
          className="border w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Enter cron expression"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!error && (
          <>
            <p className="text-gray-600">
              Description: {cronstrue.toString(expression)}
            </p>
            <div>
              <h2 className="font-medium mb-2">Next 5 Run Times:</h2>
              <ul className="list-disc list-inside text-gray-700">
                {nextRuns.map((time, i) => (
                  <li key={i}>{time}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CronBuilder;
