import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Badge,
  TextField,
  MenuItem,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useIncidents } from "../../hooks";

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, clearNotifications, clearNotification } =
    useNotifications();

  const [filters, setFilters] = useState({
    status: "",
    category: "",
    sortBy: "-createdAt",
    limit: 5,
  });

  const { data: incidents, isLoading } = useIncidents(filters);

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    if (incidents?.pagination) {
      setStats({
        total: incidents.pagination.totalCount,
        open: incidents.data.filter((i: any) => i.status === "open").length,
        inProgress: incidents.data.filter(
          (i: any) => i.status === "in_progress",
        ).length,
        resolved: incidents.data.filter((i: any) => i.status === "resolved")
          .length,
      });
    }
  }, [incidents]);

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

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4">
          Welcome, {user?.firstName || user?.username}!
        </Typography>
        <Button variant="contained" onClick={() => navigate("/incidents/new")}>
          Report New Incident
        </Button>
      </Box>

      {/* Real-time Notification Alert */}
      {notifications.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <IconButton size="small" onClick={clearNotifications}>
              <ClearIcon />
            </IconButton>
          }
        >
          <strong>{notifications.length} new notification(s)</strong>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "primary.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4">{stats.total}</Typography>
              <Typography>Total Incidents</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "warning.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4">{stats.open}</Typography>
              <Typography>Open</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "info.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4">{stats.inProgress}</Typography>
              <Typography>In Progress</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "success.light", color: "white" }}>
            <CardContent>
              <Typography variant="h4">{stats.resolved}</Typography>
              <Typography>Resolved</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Incidents with Filters */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6">My Incidents</Typography>
              <Button size="small" onClick={() => navigate("/incidents")}>
                View All
              </Button>
            </Box>

            {/* Quick Filters */}
            <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
              <TextField
                size="small"
                select
                label="Status"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </TextField>

              <TextField
                size="small"
                select
                label="Sort By"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="-createdAt">Newest First</MenuItem>
                <MenuItem value="createdAt">Oldest First</MenuItem>
                <MenuItem value="-severity">Severity (High)</MenuItem>
                <MenuItem value="severity">Severity (Low)</MenuItem>
              </TextField>
            </Box>

            {isLoading ? (
              <Typography>Loading...</Typography>
            ) : incidents?.data.length === 0 ? (
              <Typography color="textSecondary">
                No incidents reported yet
              </Typography>
            ) : (
              <List>
                {incidents?.data.map((incident: any, index: number) => (
                  <React.Fragment key={incident._id}>
                    <ListItem
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/incidents/${incident._id}`)}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="subtitle1">
                              {incident.title}
                            </Typography>
                            <Chip
                              label={incident.status.toUpperCase()}
                              color={getStatusColor(incident.status)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="textSecondary">
                              {incident.category
                                .replace(/_/g, " ")
                                .toUpperCase()}{" "}
                              • Priority: {incident.priority.toUpperCase()} •
                              Severity: {incident.severity}/10
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {format(
                                new Date(incident.createdAt),
                                "MMM dd, yyyy HH:mm",
                              )}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < incidents.data.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Real-time Notifications Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6">
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon /> Notifications
                </Badge>
              </Typography>
              {notifications.length > 0 && (
                <Button size="small" onClick={clearNotifications}>
                  Clear All
                </Button>
              )}
            </Box>

            {notifications.length === 0 ? (
              <Typography color="textSecondary">
                No new notifications
              </Typography>
            ) : (
              <List>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem>
                      <ListItemText
                        primary={notification.message}
                        secondary={
                          <>
                            <Typography variant="caption">
                              {format(
                                notification.timestamp,
                                "MMM dd, HH:mm:ss",
                              )}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="primary">
                              {notification.type
                                .replace(/_/g, " ")
                                .toUpperCase()}
                            </Typography>
                          </>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={() => clearNotification(notification.id)}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;
