import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIncidents } from "../../hooks";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  Pagination,
} from "@mui/material";
import { format } from "date-fns";

export const IncidentList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isError, error, refetch } = useIncidents(filters);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setFilters((prev) => ({ ...prev, page: value }));
  };

  const getStatusColor = (
    status: string,
  ): "default" | "primary" | "success" | "warning" => {
    switch (status) {
      case "open":
        return "warning";
      case "in_progress":
        return "primary";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={4}>
        <Typography color="error">
          {error?.message || "Failed to load incidents"}
        </Typography>
        <Button onClick={() => refetch()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h5">My Incidents</Typography>
        <Button variant="contained" onClick={() => navigate("/incidents/new")}>
          Report New Incident
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </TextField>
          <TextField
            size="small"
            select
            label="Priority"
            value={filters.priority}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={() => refetch()}>
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>No incidents found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((incident: any) => (
                <TableRow key={incident._id} hover>
                  <TableCell>{incident.title}</TableCell>
                  <TableCell>
                    {incident.category.replace(/_/g, " ").toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.priority.toUpperCase()}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status.toUpperCase()}
                      color={getStatusColor(incident.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(incident.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => navigate(`/incidents/${incident._id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={data.pagination.totalPages}
            page={filters.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
