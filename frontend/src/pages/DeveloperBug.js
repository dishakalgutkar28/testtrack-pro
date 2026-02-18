
import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Bug.css";

function DeveloperBug() {
  const [bugs, setBugs] = useState([]);

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    try {
      const res = await api.get("/bugs");
      setBugs(res.data || []);
    } catch {
      alert("Failed to load bugs");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/bugs/${id}`, { status });
      fetchBugs();
    } catch {
      alert("Failed to update bug");
    }
  };

  return (
    <div className="bug-container">
      <Navbar />

      <div className="bug-content">
        <h1>👨‍💻 Developer Bug Panel</h1>

        {bugs.map((bug) => (
          <div key={bug.id} className="bug-card">
            <div className="bug-header">
              <h3>{bug.title}</h3>

              <select
                className="status-dropdown"
                value={bug.status || "open"}
                onChange={(e) =>
                  updateStatus(bug.id, e.target.value)
                }
              >
                <option value="open">OPEN</option>
                <option value="progress">IN PROGRESS</option>
                <option value="closed">CLOSED</option>
              </select>
            </div>

            <p className="bug-description">
              {bug.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeveloperBug;
