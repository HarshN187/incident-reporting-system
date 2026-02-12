import React, { useState, type FormEvent,type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import incidentService from '../../services/incident.service';
import type { IncidentCategory, IncidentPriority, EvidenceFile } from '../../types';
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
  Container,
} from '@mui/material';
import { toast } from 'react-toastify';

const categories: IncidentCategory[] = [
  'phishing',
  'malware',
  'ransomware',
  'unauthorized_access',
  'data_breach',
  'ddos',
  'social_engineering',
  'insider_threat',
  'other',
];

const priorities: IncidentPriority[] = ['low', 'medium', 'high', 'critical'];

export const IncidentForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IncidentCategory | '',
    priority: 'medium' as IncidentPriority,
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);

    try {
      const response = await incidentService.createIncident({
        ...formData,
        category: formData.category as IncidentCategory,
        evidenceFiles,
        tags,
      });

      if (response.success) {
        toast.success('Incident created successfully');
        navigate('/incidents');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Report New Incident
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            required
            label="Incident Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            required
            multiline
            rows={4}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            required
            select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat.replace(/_/g, ' ').toUpperCase()}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          >
            {priorities.map((priority) => (
              <MenuItem key={priority} value={priority}>
                {priority.toUpperCase()}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                label="Add Tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={loading}
              />
              <Button onClick={handleAddTag} variant="outlined" disabled={loading}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                  disabled={loading}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Incident'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/incidents')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
