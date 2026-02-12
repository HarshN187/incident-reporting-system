import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, SocketProvider } from "./context";
import {
  AdminDashboard,
  IncidentDetail,
  IncidentForm,
  IncidentList,
  Login,
  ProtectedRoute,
  Register,
  SuperAdminDashboard,
  UserDashboard,
  UserManagement,
} from "./components";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/react-query";

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

                {/* User Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/incidents"
                  element={
                    <ProtectedRoute>
                      <IncidentList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/incidents/new"
                  element={
                    <ProtectedRoute>
                      <IncidentForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/incidents/:id"
                  element={
                    <ProtectedRoute>
                      <IncidentDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Super Admin Routes */}
                <Route
                  path="/superadmin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/superadmin/users"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Default Route */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>

              <ToastContainer position="bottom-right" autoClose={3000} />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
