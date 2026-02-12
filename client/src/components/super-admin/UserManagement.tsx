import React, { useState, useEffect } from "react";
import axios from "axios";
import type { User } from "../../types";
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
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";

const API_URL = import.meta.env.REACT_APP_API_URL;

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      if (response.data.success) {
        setUsers(response.data.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.patch(
        `${API_URL}/users/${selectedUser._id}/role`,
        { role: newRole },
      );

      if (response.data.success) {
        toast.success("User role updated successfully");
        setRoleDialogOpen(false);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${userId}/block`);
      if (response.data.success) {
        toast.success("User blocked successfully");
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to block user");
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${userId}/unblock`);
      if (response.data.success) {
        toast.success("User unblocked successfully");
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await axios.delete(`${API_URL}/users/${userId}`);
      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.toUpperCase()}
                      color={
                        user.role === "superadmin"
                          ? "error"
                          : user.role === "admin"
                            ? "primary"
                            : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status.toUpperCase()}
                      color={user.status === "active" ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Change Role">
                      <IconButton
                        size="small"
                        onClick={() => openRoleDialog(user)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {user.status === "active" ? (
                      <Tooltip title="Block User">
                        <IconButton
                          size="small"
                          onClick={() => handleBlockUser(user._id)}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Unblock User">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleUnblockUser(user._id)}
                        >
                          <UnblockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Delete User">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            margin="normal"
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">Super Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleChangeRole} variant="contained">
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
