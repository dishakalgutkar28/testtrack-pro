import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Testcase from "./pages/Testcase";
import Bug from "./pages/Bug";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/protectedRouter";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/testcase" element={<ProtectedRoute allowedRoles={["tester", "developer", "admin"]}><Testcase /></ProtectedRoute>} />
        <Route path="/bug" element={<ProtectedRoute allowedRoles={["tester", "developer", "admin"]}><Bug /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
