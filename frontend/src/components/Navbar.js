import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setRole(localStorage.getItem("role") || "tester");
    setEmail(localStorage.getItem("email") || "");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">🎯 TestTrack Pro</h1>
      </div>

      <div className="navbar-center">
        <button className="nav-btn" onClick={() => navigate("/dashboard")}>
          Dashboard
        </button>

        {/* Tester can create testcases and report bugs */}
        {role === "tester" && (
          <>
            <button className="nav-btn" onClick={() => navigate("/testcase")}>
              Test Cases
            </button>
            <button className="nav-btn" onClick={() => navigate("/bug")}>
              Report Bug
            </button>
          </>
        )}

        {/* Developer can view testcases and fix bugs */}
        {role === "developer" && (
          <>
            <button className="nav-btn" onClick={() => navigate("/testcase")}>
              Test Cases
            </button>
            <button className="nav-btn" onClick={() => navigate("/bug")}>
              Fix Bugs
            </button>
          </>
        )}

        {/* Admin can manage everything */}
        {role === "admin" && (
          <>
            <button className="nav-btn" onClick={() => navigate("/admin/users")}>
              Manage Users
            </button>
            <button className="nav-btn" onClick={() => navigate("/testcase")}>
              Test Cases
            </button>
            <button className="nav-btn" onClick={() => navigate("/bug")}>
              Bugs
            </button>
          </>
        )}
      </div>

      <div className="navbar-right">
        <span className="user-info">
          {email} <span className="role-badge">{role.toUpperCase()}</span>
        </span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
