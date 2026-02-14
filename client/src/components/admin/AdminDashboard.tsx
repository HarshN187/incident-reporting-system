import React, { useState } from "react";

import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Download, Edit, CheckCircle } from "@mui/icons-material";
import { format } from "date-fns";
import {
  useBulkUpdateIncidents,
  useDashboardAnalytics,
  useExportIncidents,
  useIncidents,
} from "../../hooks";
import { useSocket } from "../../context/SocketContext";

const COLORS = {
  open: "#FF6B6B",
  in_progress: "#FFA500",
  resolved: "#4ECDC4",
  closed: "#95E1D3",
  rejected: "#999999",
};

const AdminDashboard: React.FC = () => {
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    sortBy: "-createdAt",
    search: "",
    page: 1,
    limit: 50,
  });

  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState({ type: "", value: "" });
  const [exportDialog, setExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");

  const { data: analytics, isLoading: analyticsLoading } =
    useDashboardAnalytics();
  const {
    data: incidents,
    isLoading: incidentsLoading,
    refetch,
  } = useIncidents(filters);
  const bulkUpdateMutation = useBulkUpdateIncidents();
  const exportMutation = useExportIncidents();
  const { socket } = useSocket();

  React.useEffect(() => {
    if (!socket) return;

    const onCreated = (data: any) => {
      // refetch incidents/analytics when new incident arrives
      refetch();
      // optional: refetch analytics hook if available
    };

    const onUpdated = (data: any) => {
      refetch();
    };

    socket.on("incident:created", onCreated);
    socket.on("incident:updated", onUpdated);

    return () => {
      socket.off("incident:created", onCreated);
      socket.off("incident:updated", onUpdated);
    };
  }, [socket, refetch]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = incidents?.data.map((inc: any) => inc._id) || [];
      setSelectedIncidents(allIds);
    } else {
      setSelectedIncidents([]);
    }
  };

  const handleSelectIncident = (id: string) => {
    setSelectedIncidents((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkAction = () => {
    if (selectedIncidents.length === 0) {
      alert("Please select at least one incident");
      return;
    }

    if (bulkAction.type === "status") {
      bulkUpdateMutation.mutate(
        {
          incidentIds: selectedIncidents,
          status: bulkAction.value,
        },
        {
          onSuccess: () => {
            setBulkActionDialog(false);
            setSelectedIncidents([]);
            refetch();
          },
        },
      );
    } else if (bulkAction.type === "assign") {
      bulkUpdateMutation.mutate(
        {
          incidentIds: selectedIncidents,
          assignedTo: bulkAction.value,
        },
        {
          onSuccess: () => {
            setBulkActionDialog(false);
            setSelectedIncidents([]);
            refetch();
          },
        },
      );
    }
  };

  const handleExport = () => {
    exportMutation.mutate(
      {
        format: exportFormat,
        filters,
      },
      {
        onSuccess: () => {
          setExportDialog(false);
        },
      },
    );
  };

  if (analyticsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  const statusData = analytics
    ? Object.entries(analytics.statusStats).map(([key, value]) => ({
        name: key.replace(/_/g, " ").toUpperCase(),
        value,
        color: COLORS[key as keyof typeof COLORS],
      }))
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Analytics Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: "center", bgcolor: "primary.light" }}>
            <Typography variant="h3" color="white">
              {analytics?.totalIncidents || 0}
            </Typography>
            <Typography variant="subtitle1" color="white">
              Total Incidents
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: "center", bgcolor: "warning.light" }}>
            <Typography variant="h3" color="white">
              {analytics?.statusStats.open || 0}
            </Typography>
            <Typography variant="subtitle1" color="white">
              Open Incidents
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: "center", bgcolor: "success.light" }}>
            <Typography variant="h3" color="white">
              {analytics?.statusStats.resolved || 0}
            </Typography>
            <Typography variant="subtitle1" color="white">
              Resolved Incidents
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: "center", bgcolor: "info.light" }}>
            <Typography variant="h3" color="white">
              {analytics?.averageResolutionTime.hours || 0}h
            </Typography>
            <Typography variant="subtitle1" color="white">
              Avg Resolution Time
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Open vs Resolved Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Open vs Resolved Incidents
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Most Common Categories Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Most Common Categories
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.categoryData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="count" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Average Resolution Time Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Average Resolution Time (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.resolutionTimeTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{ value: "Hours", angle: -90, position: "insideLeft" }}
                />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgResolutionTime"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Avg Resolution Time (hours)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Incident Filters & Sorting */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Incident Filters & Management
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Category"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="phishing">Phishing</MenuItem>
              <MenuItem value="malware">Malware</MenuItem>
              <MenuItem value="ransomware">Ransomware</MenuItem>
              <MenuItem value="unauthorized_access">
                Unauthorized Access
              </MenuItem>
              <MenuItem value="data_breach">Data Breach</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Sort By"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
            >
              <MenuItem value="-createdAt">Date (Newest)</MenuItem>
              <MenuItem value="createdAt">Date (Oldest)</MenuItem>
              <MenuItem value="-severity">Severity (High to Low)</MenuItem>
              <MenuItem value="severity">Severity (Low to High)</MenuItem>
              <MenuItem value="-priority">Priority (High to Low)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
              onClick={() => setExportDialog(true)}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Actions */}
      {selectedIncidents.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "info.light" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="subtitle1">
              {selectedIncidents.length} incidents selected
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setBulkAction({ type: "status", value: "resolved" });
                setBulkActionDialog(true);
              }}
            >
              Mark as Resolved
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setBulkAction({ type: "assign", value: "" });
                setBulkActionDialog(true);
              }}
            >
              Assign to Admin
            </Button>
          </Box>
        </Paper>
      )}

      {/* Incidents Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    selectedIncidents.length === incidents?.data.length &&
                    incidents?.data.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidentsLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : incidents?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No incidents found
                </TableCell>
              </TableRow>
            ) : (
              incidents?.data.map((incident: any) => (
                <TableRow key={incident._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIncidents.includes(incident._id)}
                      onChange={() => handleSelectIncident(incident._id)}
                    />
                  </TableCell>
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
                    <Chip label={incident.status.toUpperCase()} size="small" />
                  </TableCell>
                  <TableCell>{incident.severity}/10</TableCell>
                  <TableCell>
                    {incident.reportedBy?.username || "N/A"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(incident.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bulk Action Dialog */}
      <Dialog
        open={bulkActionDialog}
        onClose={() => setBulkActionDialog(false)}
      >
        <DialogTitle>Bulk Action</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Apply action to {selectedIncidents.length} selected incidents
          </Typography>
          {bulkAction.type === "status" && (
            <TextField
              fullWidth
              select
              margin="normal"
              label="New Status"
              value={bulkAction.value}
              onChange={(e) =>
                setBulkAction({ ...bulkAction, value: e.target.value })
              }
            >
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          )}
          {bulkAction.type === "assign" && (
            <TextField
              fullWidth
              margin="normal"
              label="Admin ID"
              value={bulkAction.value}
              onChange={(e) =>
                setBulkAction({ ...bulkAction, value: e.target.value })
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBulkAction}
            variant="contained"
            disabled={bulkUpdateMutation.isPending}
          >
            {bulkUpdateMutation.isPending ? "Processing..." : "Apply"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Incidents</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            margin="normal"
            label="Export Format"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "csv" | "pdf")}
          >
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
