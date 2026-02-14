import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider, createTheme } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { queryClient } from "./lib/react-query";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import {
  AnalyticsDashboard,
  IncidentDetail,
  IncidentList,
  Layout,
  Login,
  ProtectedRoute,
  Register,
  SuperAdminDashboard,
} from "./components";
import UserDashboard from "./components/user/UserDashboard";
import IncidentForm from "./components/user/IncidentForm";
import AdminDashboard from "./components/admin/AdminDashboard";
import IncidentManagement from "./components/admin/IncidentManagement";
import UserManagement from "./components/super-admin/UserManagement";
import AuditLogs from "./components/super-admin/AuditLogs";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes - All Users */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  {/* User Routes */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<UserDashboard />} />
                  <Route path="incidents" element={<IncidentList />} />
                  <Route path="incidents/new" element={<IncidentForm />} />
                  <Route path="incidents/:id" element={<IncidentDetail />} />

                  {/* Admin Routes */}
                  <Route
                    path="admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/incidents"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                        <IncidentManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/analytics"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                        <AnalyticsDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Super Admin Routes */}
                  <Route
                    path="superadmin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["superadmin"]}>
                        <SuperAdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="superadmin/users"
                    element={
                      <ProtectedRoute allowedRoles={["superadmin"]}>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="superadmin/audit-logs"
                    element={
                      <ProtectedRoute allowedRoles={["superadmin"]}>
                        <AuditLogs />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* 404 Route */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>

              <ToastContainer position="bottom-right" autoClose={3000} />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
