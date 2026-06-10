import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {
  const [role, setRole] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("role") || "tester";
    setRole(userRole);
  }, []);

  // Admin role navigation
  if (role === "admin") {
    return (
      <nav>
        <Link to="/dashboard">Dashboard</Link> |
        <Link to="/projects">Projects</Link> |
        <Link to="/admin/testcase">Manage TestCase</Link> |
        <Link to="/admin/bug">Manage Bug</Link>
      </nav>
    );
  }

  // Other roles (tester, developer) navigation
  return (
    <nav>
       <Link to="/dashboard">Dashboard</Link> |
      <Link to="/testcase">Testcase</Link> |
      <Link to="/bug">Bug</Link> |
      <Link to="/execute">Execute</Link> |
      <Link to="/execution-history">History</Link> |
      <Link to="/reports">Reports</Link>
    </nav>
  );
  
}

export default Navbar;
