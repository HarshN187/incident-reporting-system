import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateIncident } from "../../hooks";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
} from "@mui/material";
import { Delete, CloudUpload } from "@mui/icons-material";
import { toast } from "react-toastify";
import axios from "axios";
import type { IncidentCategory, IncidentPriority } from "../../types";

const API_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const categories = [
  { value: "phishing", label: "Phishing" },
  { value: "malware", label: "Malware" },
  { value: "ransomware", label: "Ransomware" },
  { value: "unauthorized_access", label: "Unauthorized Access" },
  { value: "data_breach", label: "Data Breach" },
  { value: "ddos", label: "DDoS Attack" },
  { value: "social_engineering", label: "Social Engineering" },
  { value: "insider_threat", label: "Insider Threat" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const IncidentForm: React.FC = () => {
  const navigate = useNavigate();
  const createIncidentMutation = useCreateIncident();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    severity: 5,
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState("");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (
      tagInput.trim() &&
      !tags.includes(tagInput.trim()) &&
      tags.length < 10
    ) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const MAX_FILES = 5;
  const MAX_SIZE = 10 * 1024 * 1024;

  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.target;
    const files = input.files;

    if (!files?.length) return;

    const selectedFiles = Array.from(files);

    if (evidenceFiles.length + selectedFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      input.value = "";
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        input.value = "";
        return;
      }

      if (!allowedTypes.has(file.type)) {
        toast.error(`${file.name} type is not allowed`);
        input.value = "";
        return;
      }
    }

    try {
      setUploadingFiles(true);
      setUploadProgress(0);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("evidence", file);
      });

      const response = await axios.post(
        `${API_URL}/upload/evidence`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(percent);
            }
          },
        },
      );

      if (!response.data.success) {
        toast.error(response.data.message || "Upload failed");
        return;
      }

      setEvidenceFiles((prev) => [...prev, ...response.data.data]);
      toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
      input.value = "";
    } catch (error: any) {
      toast.error(error.response?.data?.message || "File upload failed");
    } finally {
      setUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = (index: number) => {
    const newFiles = evidenceFiles.filter((_, i) => i !== index);
    setEvidenceFiles(newFiles);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setValidationError("");

    if (!formData.title || formData.title.length < 5) {
      setValidationError("Title must be at least 5 characters");
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      setValidationError("Description must be at least 10 characters");
      return;
    }

    if (!formData.category) {
      setValidationError("Please select a category");
      return;
    }

    const incidentData = {
      title: formData.title,
      description: formData.description,
      category: formData.category as IncidentCategory,
      priority: formData.priority as IncidentPriority,
      severity: Number(formData.severity),
      tags: tags,
      evidenceFiles: evidenceFiles,
    };

    createIncidentMutation.mutate(incidentData, {
      onSuccess: () => {
        navigate("/incidents");
      },
      onError: () => {
        setValidationError("Failed to create incident");
      },
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Report New Incident
        </Typography>

        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        {createIncidentMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            "Failed to create incident"
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <TextField
            fullWidth
            required
            label="Incident Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            disabled={createIncidentMutation.isPending}
            helperText="Minimum 5 characters"
          />

          {/* Description */}
          <TextField
            fullWidth
            required
            multiline
            rows={4}
            label="Detailed Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            disabled={createIncidentMutation.isPending}
            helperText="Minimum 10 characters. Describe what happened, when, and any other relevant details."
          />

          {/* Category */}
          <TextField
            fullWidth
            required
            select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            margin="normal"
            disabled={createIncidentMutation.isPending}
          >
            {categories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Priority */}
          <TextField
            fullWidth
            select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            margin="normal"
            disabled={createIncidentMutation.isPending}
          >
            {priorities.map((priority) => (
              <MenuItem key={priority.value} value={priority.value}>
                {priority.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Severity */}
          <TextField
            fullWidth
            type="number"
            label="Severity (1-10)"
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            margin="normal"
            disabled={createIncidentMutation.isPending}
            inputProps={{ min: 1, max: 10 }}
            helperText="Rate the severity from 1 (low) to 10 (critical)"
          />

          {/* Tags */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tags (Optional - Max 10)
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                size="small"
                label="Add Tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={createIncidentMutation.isPending || tags.length >= 10}
              />
              <Button
                onClick={handleAddTag}
                variant="outlined"
                disabled={createIncidentMutation.isPending || tags.length >= 10}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                  disabled={createIncidentMutation.isPending}
                />
              ))}
            </Box>
          </Box>

          {/* Evidence Upload */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Evidence Files (Optional - Max 5 files, 10MB each)
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              display="block"
              gutterBottom
            >
              Accepted formats: JPG, PNG, GIF, PDF, DOC, DOCX
            </Typography>

            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              disabled={
                uploadingFiles ||
                createIncidentMutation.isPending ||
                evidenceFiles.length >= 5
              }
              fullWidth
              sx={{ mt: 1, mb: 2 }}
            >
              {uploadingFiles
                ? `Uploading... ${uploadProgress.toFixed(0)}%`
                : "Upload Evidence"}
              <input
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/gif,application/pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploadingFiles || evidenceFiles.length >= 5}
              />
            </Button>

            {uploadingFiles && (
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ mb: 2 }}
              />
            )}

            {evidenceFiles.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Files ({evidenceFiles.length}/5)
                </Typography>
                <List dense>
                  {evidenceFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={file.originalName || file.filename}
                        secondary={`${(file.size / 1024).toFixed(2)} KB`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteFile(index)}
                          disabled={createIncidentMutation.isPending}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* Submit Buttons */}
          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={uploadingFiles}
            >
              {createIncidentMutation.isPending ? (
                <CircularProgress size={24} />
              ) : (
                "Submit Incident"
              )}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate("/incidents")}
              disabled={createIncidentMutation.isPending || uploadingFiles}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default IncidentForm;
