import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useRegister } from "../../hooks";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  Grid,
} from "@mui/material";

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    department: "",
  });
  const [validationError, setValidationError] = useState("");

  const registerMutation = useRegister();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError("");

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return;
    }

    registerMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      department: formData.department,
    });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create Account
          </Typography>

          {(validationError || registerMutation.isError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError ||
                registerMutation.error?.response?.data?.message ||
                "Registration failed"}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={registerMutation.isPending}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={registerMutation.isPending}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={registerMutation.isPending}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={registerMutation.isPending}
                />
              </Grid>
            </Grid>
            <TextField
              margin="normal"
              fullWidth
              id="department"
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={registerMutation.isPending}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              disabled={registerMutation.isPending}
              helperText="Must be at least 8 characters"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={registerMutation.isPending}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <CircularProgress size={24} />
              ) : (
                "Sign Up"
              )}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
