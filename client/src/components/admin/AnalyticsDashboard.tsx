import React from "react";
import { useDashboardAnalytics } from "../../hooks";
import { Box, Grid, Paper, Typography, CircularProgress } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const COLORS = {
  open: "#FF6B6B",
  in_progress: "#FFA500",
  resolved: "#4ECDC4",
  closed: "#95E1D3",
  rejected: "#999999",
};

const AnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box p={4}>
        <Typography>No analytics data available</Typography>
      </Box>
    );
  }

  const statusData = Object.entries(analytics.statusStats).map(
    ([key, value]) => ({
      name: key.replace(/_/g, " ").toUpperCase(),
      value,
      color: COLORS[key as keyof typeof COLORS],
    }),
  );

  const openVsResolved = [
    { name: "Open", value: analytics.statusStats.open, color: COLORS.open },
    {
      name: "Resolved",
      value: analytics.statusStats.resolved,
      color: COLORS.resolved,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: "primary.main",
              color: "white",
            }}
          >
            <Typography variant="h3">{analytics.totalIncidents}</Typography>
            <Typography variant="subtitle1">Total Incidents</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: "warning.main",
              color: "white",
            }}
          >
            <Typography variant="h3">{analytics.statusStats.open}</Typography>
            <Typography variant="subtitle1">Open Incidents</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: "success.main",
              color: "white",
            }}
          >
            <Typography variant="h3">
              {analytics.statusStats.resolved}
            </Typography>
            <Typography variant="subtitle1">Resolved</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: "info.main",
              color: "white",
            }}
          >
            <Typography variant="h3">
              {analytics.averageResolutionTime.hours}h
            </Typography>
            <Typography variant="subtitle1">Avg Resolution Time</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Open vs Resolved Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Open vs Resolved Incidents
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={openVsResolved}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {openVsResolved.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
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
              <BarChart data={analytics.categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="#4ECDC4"
                  name="Number of Incidents"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Average Resolution Time Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Average Resolution Time Trend (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.resolutionTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{ value: "Hours", angle: -90, position: "insideLeft" }}
                />
                <Tooltip />
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

        {/* All Status Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              All Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export { AnalyticsDashboard };
