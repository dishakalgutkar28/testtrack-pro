import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Testcase from "./pages/Testcase";
import Bug from "./pages/Bug";
import DeveloperBug from "./pages/DeveloperBug";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTestcaseManagement from "./pages/AdminTestcaseManagement";
import AdminBugManagement from "./pages/AdminBugManagement";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Execute from "./pages/Execute";
import ExecutionHistory from "./pages/ExecutionHistory";
import ExecutionMode from "./pages/ExecutionMode";
import Reports from "./pages/Reports";
import TestSuites from "./pages/TestSuites";
import TestSuiteDetails from "./pages/TestSuiteDetails";
import Notifications from "./pages/Notifications";

import ProtectedRoute from "./components/protectedRouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer from "./components/ToastContainer";
import { ToastProvider, useToast } from "./context/ToastContext";
import { LoadingProvider } from "./context/LoadingContext";
import { ThemeProvider } from "./context/ThemeContext";
import { setToastHandler } from "./services/api";

// Inner App component that has access to toast context
function AppRoutes() {
  const toast = useToast();

  // Set up toast handler for API errors
  useEffect(() => {
    setToastHandler(toast);
  }, [toast]);

  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
            <ProtectedRoute allowedRoles={["tester", "developer"]}>
              <Testcase />
            </ProtectedRoute>
          }
        />

        {/* Testcase Details Page with ID */}
        <Route
          path="/testcases/:id"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer"]}>
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

        {/* Admin Testcase Management */}
        <Route
          path="/admin/testcase"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminTestcaseManagement />
            </ProtectedRoute>
          }
        />

        {/* Admin Bug Management */}
        <Route
          path="/admin/bug"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminBugManagement />
            </ProtectedRoute>
          }
        />

        {/* Projects Page */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer", "admin"]}>
              <Projects />
            </ProtectedRoute>
          }
        />

        {/* Project Details Page */}
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer", "admin"]}>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

        {/* Execute Testcase Page */}
        <Route
          path="/execute"
          element={
            <ProtectedRoute allowedRoles={["tester"]}>
              <Execute />
            </ProtectedRoute>
          }
        />

        {/* Execution History Page */}
        <Route
          path="/execution-history"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer", "admin"]}>
              <ExecutionHistory />
            </ProtectedRoute>
          }
        />

        {/* Reports & Analytics Page */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer", "admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Test Suites Page */}
        <Route
          path="/test-suites"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer"]}>
              <TestSuites />
            </ProtectedRoute>
          }
        />

        {/* Test Suite Details Page */}
        <Route
          path="/test-suites/:suiteId"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer"]}>
              <TestSuiteDetails />
            </ProtectedRoute>
          }
        />

        {/* Test Suite Execution Mode Page */}
        <Route
          path="/test-suites/:suiteId/execution/:executionId"
          element={
            <ProtectedRoute allowedRoles={["tester"]}>
              <ExecutionMode />
            </ProtectedRoute>
          }
        />

        {/* Notifications Page */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["tester", "developer", "admin"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

// Main App component with providers
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <LoadingProvider>
            <AppRoutes />
            <ToastContainer />
          </LoadingProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
