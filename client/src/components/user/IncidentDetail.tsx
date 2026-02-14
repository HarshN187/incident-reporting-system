import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import incidentService from "../../services/incident.service";
import type { Incident } from "../../types";
import { useAuth } from "../../context";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Divider,
  Grid,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import { format } from "date-fns";

export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchIncident();
    }
  }, [id]);

  const fetchIncident = async () => {
    try {
      const response = await incidentService.getIncident(id!);
      if (response.success && response.data) {
        setIncident(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch incident");
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !incident) {
    return (
      <Box p={4}>
        <Typography color="error">{error || "Incident not found"}</Typography>
        <Button onClick={() => navigate("/incidents")} sx={{ mt: 2 }}>
          Back to Incidents
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate("/incidents")} sx={{ mb: 2 }}>
        ← Back to Incidents
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {incident.title}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Chip
              label={incident.status.toUpperCase()}
              color={getStatusColor(incident.status)}
            />
            <Chip
              label={incident.priority.toUpperCase()}
              color={getPriorityColor(incident.priority)}
            />
            <Chip
              label={incident.category.replace(/_/g, " ").toUpperCase()}
              variant="outlined"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {incident.description}
                </Typography>
              </CardContent>
            </Card>

            {incident.resolutionNotes && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resolution Notes
                  </Typography>
                  <Typography variant="body1">
                    {incident.resolutionNotes}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {incident.tags && incident.tags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {incident.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Incident ID
                  </Typography>
                  <Typography variant="body2">{incident._id}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Severity
                  </Typography>
                  <Typography variant="body2">
                    {incident.severity}/10
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Reported By
                  </Typography>
                  <Typography variant="body2">
                    {typeof incident.reportedBy === "object"
                      ? incident.reportedBy.username
                      : "N/A"}
                  </Typography>
                </Box>

                {incident.assignedTo && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Assigned To
                    </Typography>
                    <Typography variant="body2">
                      {typeof incident.assignedTo === "object"
                        ? incident.assignedTo.username
                        : "N/A"}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(incident.createdAt), "PPpp")}
                  </Typography>
                </Box>

                {incident.resolvedAt && (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary">
                        Resolved
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(incident.resolvedAt), "PPpp")}
                      </Typography>
                    </Box>

                    {incident.resolutionTime && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Resolution Time
                        </Typography>
                        <Typography variant="body2">
                          {Math.floor(incident.resolutionTime / 60)} hours{" "}
                          {incident.resolutionTime % 60} minutes
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {incident.evidenceFiles && incident.evidenceFiles.length > 0 && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Evidence Files
                  </Typography>
                  {incident.evidenceFiles.map((file, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {file.originalName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {(file.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
