import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../../services/analytics.service';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  Report as ReportIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [analyticsRes] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setStats(analyticsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Super Admin Dashboard
      </Typography>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/superadmin/users')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h6">User Management</Typography>
              </Box>
              <Button size="small" variant="outlined" fullWidth>
                Manage Users
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/dashboard')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReportIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Typography variant="h6">Incidents</Typography>
              </Box>
              <Button size="small" variant="outlined" fullWidth>
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/analytics')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon
                  sx={{ fontSize: 40, color: 'success.main', mr: 2 }}
                />
                <Typography variant="h6">Analytics</Typography>
              </Box>
              <Button size="small" variant="outlined" fullWidth>
                View Reports
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/superadmin/audit-logs')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Typography variant="h6">Audit Logs</Typography>
              </Box>
              <Button size="small" variant="outlined" fullWidth>
                View Logs
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stats Overview */}
      {stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {stats.totalIncidents}
              </Typography>
              <Typography variant="subtitle1">Total Incidents</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main">
                {stats.statusStats.open}
              </Typography>
              <Typography variant="subtitle1">Open Incidents</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {stats.statusStats.resolved}
              </Typography>
              <Typography variant="subtitle1">Resolved</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">
                {stats.averageResolutionTime.hours}h
              </Typography>
              <Typography variant="subtitle1">Avg Resolution</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
