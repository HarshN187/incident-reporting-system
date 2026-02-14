import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLogout } from "../../hooks";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Report,
  Analytics,
  People,
  Security,
  Add,
  ExitToApp,
  AdminPanelSettings,
} from "@mui/icons-material";

const drawerWidth = 240;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    handleProfileMenuClose();
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
      roles: ["user", "admin", "superadmin"],
    },
    {
      text: "My Incidents",
      icon: <Report />,
      path: "/incidents",
      roles: ["user", "admin", "superadmin"],
    },
    {
      text: "Report Incident",
      icon: <Add />,
      path: "/incidents/new",
      roles: ["user", "admin", "superadmin"],
    },
  ];

  const adminMenuItems = [
    {
      text: "Admin Dashboard",
      icon: <Dashboard />,
      path: "/admin/dashboard",
      roles: ["admin", "superadmin"],
    },
    {
      text: "Manage Incidents",
      icon: <Report />,
      path: "/admin/incidents",
      roles: ["admin", "superadmin"],
    },
    {
      text: "Analytics",
      icon: <Analytics />,
      path: "/admin/analytics",
      roles: ["admin", "superadmin"],
    },
  ];

  const superAdminMenuItems = [
    {
      text: "Super Admin Panel",
      icon: <AdminPanelSettings />,
      path: "/superadmin/dashboard",
      roles: ["superadmin"],
    },
    {
      text: "User Management",
      icon: <People />,
      path: "/superadmin/users",
      roles: ["superadmin"],
    },
    {
      text: "Audit Logs",
      icon: <Security />,
      path: "/superadmin/audit-logs",
      roles: ["superadmin"],
    },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          IR System
        </Typography>
      </Toolbar>
      <Divider />

      {/* User Menu */}
      <List>
        <ListItem>
          <Typography variant="caption" color="textSecondary">
            USER MENU
          </Typography>
        </ListItem>
        {menuItems
          .filter((item) => item.roles.includes(user?.role || ""))
          .map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
      </List>

      {/* Admin Menu */}
      {["admin", "superadmin"].includes(user?.role || "") && (
        <>
          <Divider />
          <List>
            <ListItem>
              <Typography variant="caption" color="textSecondary">
                ADMIN MENU
              </Typography>
            </ListItem>
            {adminMenuItems
              .filter((item) => item.roles.includes(user?.role || ""))
              .map((item) => (
                <ListItemButton
                  key={item.text}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              ))}
          </List>
        </>
      )}

      {/* Super Admin Menu */}
      {user?.role === "superadmin" && (
        <>
          <Divider />
          <List>
            <ListItem>
              <Typography variant="caption" color="textSecondary">
                SUPER ADMIN
              </Typography>
            </ListItem>
            {superAdminMenuItems.map((item) => (
              <ListItemButton
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Incident Reporting System
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">{user?.username}</Typography>
            <IconButton onClick={handleProfileMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="body2">
            Role: {user?.role?.toUpperCase()}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export { Layout };
