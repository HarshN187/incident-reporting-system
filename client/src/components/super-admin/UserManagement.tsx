import React, { useState } from "react";
import {
  useUsers,
  useChangeUserRole,
  useBlockUser,
  useUnblockUser,
  useDeleteUser,
  useCreateUser,
  useUpdateUser,
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
  Grid,
  Pagination,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PersonAdd,
} from "@mui/icons-material";
import { format } from "date-fns";
import type { User } from "../../types";

const UserManagement: React.FC = () => {
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    search: "",
    page: 1,
    limit: 20,
  });

  const { data, isLoading, refetch } = useUsers(filters);
  const changeRoleMutation = useChangeUserRole();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const deleteMutation = useDeleteUser();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user",
    department: "",
  });

  const handleChangeRole = () => {
    if (!selectedUser || !newRole) return;

    changeRoleMutation.mutate(
      { id: selectedUser._id, role: newRole },
      {
        onSuccess: () => {
          setRoleDialogOpen(false);
          setSelectedUser(null);
          setNewRole("");
          refetch();
        },
      },
    );
  };

  const handleBlockUser = (userId: string) => {
    if (window.confirm("Are you sure you want to block this user?")) {
      blockMutation.mutate(userId, {
        onSuccess: () => refetch(),
      });
    }
  };

  const handleUnblockUser = (userId: string) => {
    unblockMutation.mutate(userId, {
      onSuccess: () => refetch(),
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      deleteMutation.mutate(userId, {
        onSuccess: () => refetch(),
      });
    }
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      department: user.department || "",
    });
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "user",
      department: "",
    });
    setCreateDialogOpen(true);
  };

  const handleCreateUser = () => {
    if (!formData.username || !formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({
          username: "",
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          role: "user",
          department: "",
        });
        refetch();
      },
    });
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const updateData: Partial<User> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      department: formData.department,
    };

    updateMutation.mutate(
      { id: selectedUser._id, data: updateData },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedUser(null);
          refetch();
        },
      },
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h5">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add New User
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Role"
              value={filters.role}
              onChange={(e) =>
                setFilters({ ...filters, role: e.target.value, page: 1 })
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="superadmin">Super Admin</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((user: User) => (
                <TableRow key={user._id} hover>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.department || "-"}</TableCell>
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
                    {user.lastLogin
                      ? format(new Date(user.lastLogin), "MMM dd, yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit User">
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(user)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Change Role">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openRoleDialog(user)}
                      >
                        <PersonAdd fontSize="small" />
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

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={data.pagination.totalPages}
            page={filters.page}
            onChange={(e, page) => setFilters({ ...filters, page })}
            color="primary"
          />
        </Box>
      )}

      {/* Change Role Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Change role for: <strong>{selectedUser?.username}</strong>
          </Typography>
          <TextField
            select
            fullWidth
            label="New Role"
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
          <Button
            onClick={handleChangeRole}
            variant="contained"
            disabled={changeRoleMutation.isPending || !newRole}
          >
            {changeRoleMutation.isPending ? "Updating..." : "Update Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            margin="normal"
            disabled
            helperText="Username cannot be changed"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Department"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            required
            label="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            required
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            required
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            margin="normal"
            helperText="Minimum 8 characters"
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            margin="normal"
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">Super Admin</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Department"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
