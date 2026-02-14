import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  Pagination,
  CircularProgress,
  Grid,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import { format } from "date-fns";
import type { AxiosResponse } from "axios";

const AuditLogs: React.FC = () => {
  const [filters, setFilters] = useState({
    action: "",
    performedBy: "",
    targetType: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response: AxiosResponse = await api.get(
        `/audit-logs?${params.toString()}`,
      );
      return response.data;
    },
  });
  console.log("🚀 ~ AuditLogs ~ data:", data);

  const handleExport = async () => {
    try {
      const response: AxiosResponse = await api.post("/audit-logs/export", {
        format: "csv",
        filters,
      });
      // Handle download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const getActionColor = (
    action: string,
  ): "default" | "primary" | "success" | "error" | "warning" => {
    if (action.includes("created")) return "success";
    if (action.includes("deleted")) return "error";
    if (action.includes("updated")) return "primary";
    if (action.includes("failed")) return "error";
    return "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Audit Logs
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Action"
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="incident_created">Incident Created</MenuItem>
              <MenuItem value="incident_updated">Incident Updated</MenuItem>
              <MenuItem value="incident_deleted">Incident Deleted</MenuItem>
              <MenuItem value="user_created">User Created</MenuItem>
              <MenuItem value="user_updated">User Updated</MenuItem>
              <MenuItem value="user_deleted">User Deleted</MenuItem>
              <MenuItem value="user_role_changed">Role Changed</MenuItem>
              <MenuItem value="user_blocked">User Blocked</MenuItem>
              <MenuItem value="login_success">Login Success</MenuItem>
              <MenuItem value="login_failed">Login Failed</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Target Type"
              value={filters.targetType}
              onChange={(e) =>
                setFilters({ ...filters, targetType: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="incident">Incident</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Performed By</TableCell>
              <TableCell>Target Type</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data?.data?.logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((log: any) => (
                <TableRow key={log._id} hover>
                  <TableCell>
                    {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action.replace(/_/g, " ").toUpperCase()}
                      color={getActionColor(log.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {log.performedBy?.username || "System"}
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {log.userRole?.toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>{log.targetType.toUpperCase()}</TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.status.toUpperCase()}
                      color={log.status === "success" ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.description || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={data.data.pagination.totalPages}
            page={filters.page}
            onChange={(e, page) => setFilters({ ...filters, page })}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default AuditLogs;
