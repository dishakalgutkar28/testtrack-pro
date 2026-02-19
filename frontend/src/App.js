import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Testcase from "./pages/Testcase";
import Bug from "./pages/Bug";
import DeveloperBug from "./pages/DeveloperBug";
import AdminDashboard from "./pages/AdminDashboard";
import Projects from "./pages/Projects";

import ProtectedRoute from "./components/protectedRouter";

function App() {
  // Root redirect component
  const RootRedirect = () => {
    const token = localStorage.getItem("token");
    return <Navigate to={token ? "/dashboard" : "/login"} replace />;
  };

  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Tester / Developer Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Testcase Page */}
        <Route
          path="/testcase"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer", "admin"]}>
              <Testcase />
            </ProtectedRoute>
          }
        />

        {/* Tester Bug Reporting Page */}
        <Route
          path="/bug"
          element={
            <ProtectedRoute allowedRoles={["tester"]}>
              <Bug />
            </ProtectedRoute>
          }
        />

        {/* Developer Bug Management Page */}
        <Route
          path="/developer-bugs"
          element={
            <ProtectedRoute allowedRoles={["developer", "admin"]}>
              <DeveloperBug />
            </ProtectedRoute>
          }
        />

        {/* Admin Panel */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Projects Page */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer", "admin"]}>
              <Projects />RootRedirect
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

      </Routes>
    </Router>
  );
}

export default App;
