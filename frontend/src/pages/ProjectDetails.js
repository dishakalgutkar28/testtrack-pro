import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./ProjectDetails.css";

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [testcases, setTestcases] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        // Fetch project info
        const projectsRes = await api.get("/projects");
        console.log("Projects API Response:", projectsRes.data);
        // The API returns { projects: [...], success: true }
        const projectsData = projectsRes.data?.projects || projectsRes.data || [];
        console.log("Projects Data:", projectsData);
        console.log("Looking for project with ID:", id, "Type:", typeof id);
        const foundProject = projectsData.find(p => {
          console.log("Comparing project:", p.id, typeof p.id, "with", parseInt(id));
        return p.id === parseInt(id);
      });
      console.log("Found Project:", foundProject);
      setProject(foundProject);

      // Fetch test cases for this project
      const testcasesRes = await api.get(`/testcase?projectId=${id}`);
      console.log("Test Cases Response:", testcasesRes.data);
      setTestcases(testcasesRes.data || []);

      // Fetch bugs for this project
      const bugsRes = await api.get("/bugs");
      console.log("Bugs API Response:", bugsRes.data);
      const bugsData = Array.isArray(bugsRes.data) ? bugsRes.data : [];
      const projectBugs = bugsData.filter(b => b.project_id === parseInt(id));
      console.log("Filtered Bugs:", projectBugs);
      setBugs(projectBugs);
    } catch (err) {
      console.error("Failed to fetch project details", err);
    } finally {
      setLoading(false);
    }
    };

    fetchProjectDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="project-details-container">
        <Navbar />
        <div className="loading">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-details-container">
        <Navbar />
        <div className="not-found">Project not found</div>
      </div>
    );
  }

  const stats = {
    totalTestcases: testcases.length,
    totalBugs: bugs.length,
    openBugs: bugs.filter(b => b.status === "open").length,
    closedBugs: bugs.filter(b => b.status === "closed").length,
  };

  return (
    <div className="project-details-container">
      <Navbar />
      <div className="project-details-content">
        <button className="back-btn" onClick={() => navigate("/projects")}>
          ← Back to Projects
        </button>

        <div className="project-header">
          <div>
            <h1>📁 {project.name}</h1>
            {project.description && <p className="project-desc">{project.description}</p>}
          </div>
          <span className="project-id-badge">ID: {project.id}</span>
        </div>

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-box">
            <h3>Test Cases</h3>
            <p className="stat-number">{stats.totalTestcases}</p>
          </div>
          <div className="stat-box">
            <h3>Total Bugs</h3>
            <p className="stat-number">{stats.totalBugs}</p>
          </div>
          <div className="stat-box open">
            <h3>Open Bugs</h3>
            <p className="stat-number">{stats.openBugs}</p>
          </div>
          <div className="stat-box closed">
            <h3>Closed Bugs</h3>
            <p className="stat-number">{stats.closedBugs}</p>
          </div>
        </div>

        {/* Test Cases Section */}
        <div className="section">
          <h2>✅ Test Cases ({testcases.length})</h2>
          {testcases.length === 0 ? (
            <p className="empty">No test cases in this project</p>
          ) : (
            <div className="items-grid">
              {testcases.map(tc => (
                <div key={tc.id} className="item-card">
                  <h3>#{tc.id} - {tc.title}</h3>
                  <p className="description">{tc.description}</p>
                  <div className="footer">
                    <span className="badge">Expected: {tc.expected_result}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bugs Section */}
        <div className="section">
          <h2>🐛 Bugs ({bugs.length})</h2>
          {bugs.length === 0 ? (
            <p className="empty">No bugs in this project</p>
          ) : (
            <div className="items-grid">
              {bugs.map(bug => (
                <div key={bug.id} className="item-card">
                  <div className="item-header">
                    <h3>#{bug.id} - {bug.title}</h3>
                    <span className={`status-badge status-${bug.status || "open"}`}>
                      {(bug.status || "open").toUpperCase()}
                    </span>
                  </div>
                  <p className="description">{bug.description}</p>
                  <div className="footer">
                    <span className={`severity-badge severity-${bug.severity || "medium"}`}>
                      {(bug.severity || "medium").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
