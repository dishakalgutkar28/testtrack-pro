import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

 if (allowedRoles && (!role || !allowedRoles.includes(role))) {
  return <Navigate to="/dashboard" replace />;
}

  return children;
};

export default ProtectedRoute;
