import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { useNotifications } from '../../hooks';
import incidentService from '../../services/incident.service';
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
} from '@mui/material';
import { format } from 'date-fns';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await incidentService.getIncidents({ limit: 5 });

      if (response.success && response.data) {
        const incidents = response.data.data;
        setRecentIncidents(incidents);

        // Calculate stats
        setStats({
          total: response.data.pagination.totalCount,
          open: incidents.filter((i: any) => i.status === 'open').length,
          inProgress: incidents.filter((i: any) => i.status === 'in_progress')
            .length,
          resolved: incidents.filter((i: any) => i.status === 'resolved').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'success' | 'warning' => {
    switch (status) {
      case 'open':
        return 'warning';
      case 'in_progress':
        return 'primary';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4">
          Welcome, {user?.firstName || user?.username}!
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/incidents/new')}
        >
          Report New Incident
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Incidents
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Open
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.open}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.inProgress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Resolved
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.resolved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Incidents */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="h6">Recent Incidents</Typography>
              <Button size="small" onClick={() => navigate('/incidents')}>
                View All
              </Button>
            </Box>

            {loading ? (
              <Typography>Loading...</Typography>
            ) : recentIncidents.length === 0 ? (
              <Typography color="textSecondary">
                No incidents reported yet
              </Typography>
            ) : (
              <List>
                {recentIncidents.map((incident, index) => (
                  <React.Fragment key={incident._id}>
                    <ListItem
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/incidents/${incident._id}`)}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
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
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              component="span"
                            >
                              {incident.category.replace(/_/g, ' ')} •{' '}
                              {format(
                                new Date(incident.createdAt),
                                'MMM dd, yyyy'
                              )}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentIncidents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Notifications
            </Typography>

            {notifications.length === 0 ? (
              <Typography color="textSecondary">No new notifications</Typography>
            ) : (
              <List>
                {notifications.slice(0, 5).map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem>
                      <ListItemText
                        primary={notification.message}
                        secondary={format(
                          notification.timestamp,
                          'MMM dd, HH:mm'
                        )}
                      />
                    </ListItem>
                    {index < Math.min(notifications.length, 5) - 1 && (
                      <Divider />
                    )}
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
