import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useIncidents,
  useUpdateIncidentStatus,
  useAssignIncident,
  useBulkUpdateIncidents,
  useUsers,
  useExportIncidents,
} from "../../hooks";
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
  Checkbox,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Typography,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import {
  Edit,
  Download,
  Assignment,
  CheckCircle,
  Visibility,
} from "@mui/icons-material";
import { format } from "date-fns";
import { toast } from "react-toastify";

const IncidentManagement: React.FC = () => {
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    sortBy: "-createdAt",
    search: "",
    page: 1,
    limit: 20,
  });

  // Selected incidents for bulk actions
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);

  // Dialog states
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    incidentId: string | null;
    currentStatus: string;
  }>({ open: false, incidentId: null, currentStatus: "" });

  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    incidentId: string | null;
  }>({ open: false, incidentId: null });

  const [bulkDialog, setBulkDialog] = useState<{
    open: boolean;
    action: "status" | "assign" | null;
  }>({ open: false, action: null });

  const [exportDialog, setExportDialog] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");

  const { data: incidents, isLoading, refetch } = useIncidents(filters);
  const { data: users } = useUsers({ role: "admin,superadmin", limit: 100 });
  const updateStatusMutation = useUpdateIncidentStatus();
  const assignMutation = useAssignIncident();
  const bulkUpdateMutation = useBulkUpdateIncidents();
  const exportMutation = useExportIncidents();

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = incidents?.data.map((inc) => inc._id) || [];
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

  const handleUpdateStatus = () => {
    if (!statusDialog.incidentId || !newStatus) return;

    updateStatusMutation.mutate(
      {
        id: statusDialog.incidentId,
        status: newStatus,
        resolutionNotes: resolutionNotes,
      },
      {
        onSuccess: () => {
          setStatusDialog({ open: false, incidentId: null, currentStatus: "" });
          setNewStatus("");
          setResolutionNotes("");
          refetch();
        },
      },
    );
  };

  const handleAssignIncident = () => {
    if (!assignDialog.incidentId || !selectedAdmin) return;

    assignMutation.mutate(
      {
        id: assignDialog.incidentId,
        assignedTo: selectedAdmin,
      },
      {
        onSuccess: () => {
          setAssignDialog({ open: false, incidentId: null });
          setSelectedAdmin("");
          refetch();
        },
      },
    );
  };

  const handleBulkAction = () => {
    if (selectedIncidents.length === 0) {
      toast.error("Please select at least one incident");
      return;
    }

    if (bulkDialog.action === "status") {
      if (!newStatus) {
        toast.error("Please select a status");
        return;
      }

      bulkUpdateMutation.mutate(
        {
          incidentIds: selectedIncidents,
          status: newStatus,
        },
        {
          onSuccess: () => {
            setBulkDialog({ open: false, action: null });
            setSelectedIncidents([]);
            setNewStatus("");
            setResolutionNotes("");
            refetch();
          },
        },
      );
    } else if (bulkDialog.action === "assign") {
      if (!selectedAdmin) {
        toast.error("Please select an admin");
        return;
      }

      bulkUpdateMutation.mutate(
        {
          incidentIds: selectedIncidents,
          assignedTo: selectedAdmin,
        },
        {
          onSuccess: () => {
            setBulkDialog({ open: false, action: null });
            setSelectedIncidents([]);
            setSelectedAdmin("");
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

  const getStatusColor = (
    status: string,
  ): "default" | "primary" | "success" | "warning" | "error" => {
    switch (status) {
      case "open":
        return "warning";
      case "in_progress":
        return "primary";
      case "resolved":
        return "success";
      case "closed":
        return "default";
      default:
        return "error";
    }
  };

  const getPriorityColor = (
    priority: string,
  ): "default" | "error" | "warning" | "info" => {
    switch (priority) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Incident Management
      </Typography>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
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
                setFilters({ ...filters, status: e.target.value, page: 1 })
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
                setFilters({ ...filters, category: e.target.value, page: 1 })
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
              label="Priority"
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value, page: 1 })
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
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
          <Grid item xs={12} sm={6} md={2}>
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

      {/* Bulk Actions Bar */}
      {selectedIncidents.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "primary.light" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="subtitle1" color="white">
              {selectedIncidents.length} incident(s) selected
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => {
                setNewStatus("resolved");
                setBulkDialog({ open: true, action: "status" });
              }}
            >
              Mark as Resolved
            </Button>
            <Button
              variant="contained"
              startIcon={<Assignment />}
              onClick={() => setBulkDialog({ open: true, action: "assign" })}
            >
              Assign to Admin
            </Button>
            <Button
              variant="outlined"
              sx={{ bgcolor: "white" }}
              onClick={() => setSelectedIncidents([])}
            >
              Clear Selection
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
                  indeterminate={
                    selectedIncidents.length > 0 &&
                    selectedIncidents.length < (incidents?.data.length || 0)
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : incidents?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
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
                    {incident.reportedBy?.username || "N/A"}
                  </TableCell>
                  <TableCell>
                    {incident.category.replace(/_/g, " ").toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.priority.toUpperCase()}
                      color={getPriorityColor(incident.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={`${incident.severity}/10`} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status.replace(/_/g, " ").toUpperCase()}
                      color={getStatusColor(incident.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {incident.assignedTo?.username || (
                      <Typography variant="caption" color="textSecondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(incident.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/incidents/${incident._id}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Update Status">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setStatusDialog({
                            open: true,
                            incidentId: incident._id,
                            currentStatus: incident.status,
                          });
                          setNewStatus(incident.status);
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Assign Admin">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setAssignDialog({
                            open: true,
                            incidentId: incident._id,
                          });
                          setSelectedAdmin(incident.assignedTo?._id || "");
                        }}
                      >
                        <Assignment fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {incidents?.pagination && incidents.pagination.totalPages > 1 && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={incidents.pagination.totalPages}
            page={filters.page}
            onChange={(e, page) => setFilters({ ...filters, page })}
            color="primary"
          />
        </Box>
      )}

      {/* Update Status Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() =>
          setStatusDialog({ open: false, incidentId: null, currentStatus: "" })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Incident Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>

          {(newStatus === "resolved" || newStatus === "closed") && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Resolution Notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              margin="normal"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setStatusDialog({
                open: false,
                incidentId: null,
                currentStatus: "",
              })
            }
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Admin Dialog */}
      <Dialog
        open={assignDialog.open}
        onClose={() => setAssignDialog({ open: false, incidentId: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Incident to Admin</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Admin</InputLabel>
            <Select
              value={selectedAdmin}
              label="Select Admin"
              onChange={(e) => setSelectedAdmin(e.target.value)}
            >
              {users?.data
                ?.filter((user) => ["admin", "superadmin"].includes(user.role))
                .map((admin) => (
                  <MenuItem key={admin._id} value={admin._id}>
                    {admin.username} ({admin.email}) -{" "}
                    {admin.role.toUpperCase()}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAssignDialog({ open: false, incidentId: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignIncident}
            variant="contained"
            disabled={assignMutation.isPending}
          >
            {assignMutation.isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog
        open={bulkDialog.open}
        onClose={() => setBulkDialog({ open: false, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bulk {bulkDialog.action === "status" ? "Status Update" : "Assignment"}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Apply to {selectedIncidents.length} selected incident(s)
          </Typography>

          {bulkDialog.action === "status" && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  label="New Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>

              {(newStatus === "resolved" || newStatus === "closed") && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Resolution Notes (Optional)"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  margin="normal"
                />
              )}
            </>
          )}

          {bulkDialog.action === "assign" && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Admin</InputLabel>
              <Select
                value={selectedAdmin}
                label="Select Admin"
                onChange={(e) => setSelectedAdmin(e.target.value)}
              >
                {users?.data
                  ?.filter((user) =>
                    ["admin", "superadmin"].includes(user.role),
                  )
                  .map((admin) => (
                    <MenuItem key={admin._id} value={admin._id}>
                      {admin.username} - {admin.role.toUpperCase()}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog({ open: false, action: null })}>
            Cancel
          </Button>
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
      <Dialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Incidents</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Export {incidents?.pagination.totalCount || 0} incident(s) with
            current filters
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              label="Format"
              onChange={(e) => setExportFormat(e.target.value as "csv" | "pdf")}
            >
              <MenuItem value="csv">CSV (Excel)</MenuItem>
              <MenuItem value="pdf">PDF Document</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exportMutation.isPending}
            startIcon={<Download />}
          >
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncidentManagement;
