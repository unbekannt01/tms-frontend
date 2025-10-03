"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Checkbox,
} from "@mui/material";
import { Search, Delete, Logout } from "@mui/icons-material";
import API from "../api";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers(page + 1, rowsPerPage, selectedRole, searchTerm);
  }, [page, rowsPerPage, selectedRole, searchTerm]);

  const fetchRoles = async () => {
    try {
      const res = await API.get("/roles"); // Adjust endpoint as needed
      setRoles(res.data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchUsers = async (page, limit, roleId = "", search = "") => {
    try {
      setLoading(true);
      let url = `/users/getAllUsers?page=${page}&limit=${limit}`;
      if (roleId) {
        url += `&roleId=${roleId}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await API.get(url);
      setUsers(res.data.users);
      setTotalUsers(res.data.pagination.total);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      setSearchTerm(value);
      setPage(0); // Reset to first page when search changes
    }, 500); // 500ms delay

    setSearchTimeout(newTimeout);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const pageIds = users.map((u) => u._id);
      setSelectedIds(pageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleRowSelect = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkDeleteClick = () => setBulkDeleteDialogOpen(true);
  const handleBulkDeleteCancel = () => setBulkDeleteDialogOpen(false);

  const handleBulkDeleteConfirm = async () => {
    try {
      await API.post(`/users/bulk-delete`, { ids: selectedIds });
      setSnackbar({
        open: true,
        message: `Deleted ${selectedIds.length} user(s)`,
        severity: "success",
      });
      setSelectedIds([]);
      setBulkDeleteDialogOpen(false);
      // Refresh current page
      fetchUsers(page + 1, rowsPerPage, selectedRole, searchTerm);
    } catch (err) {
      console.error("Error bulk deleting users:", err);
      setSnackbar({
        open: true,
        message: "Failed to bulk delete users",
        severity: "error",
      });
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    try {
      await API.post("/admin/sessions/logout-all");
      setSnackbar({
        open: true,
        message: "All sessions have been logged out",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to logout all sessions",
        severity: "error",
      });
    }
  };

  const handleLogoutUserSessions = async (userId) => {
    try {
      await API.post(`/admin/sessions/logout-user/${userId}`);
      setSnackbar({
        open: true,
        message: "User sessions have been logged out",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to logout user sessions",
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && users.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress sx={{ color: "#059669" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/dashboard")}
            sx={{
              mb: 2,
              borderColor: "#059669",
              color: "#059669",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#047857",
                backgroundColor: "rgba(5, 150, 105, 0.04)",
              },
            }}
          >
            ← Back to Dashboard
          </Button>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={handleBulkDeleteClick}
              disabled={selectedIds.length === 0}
              sx={{ borderRadius: 2 }}
            >
              Delete Selected ({selectedIds.length})
            </Button>

            <Button
              variant="contained"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogoutAllSessions}
              sx={{ borderRadius: 2 }}
            >
              Logout All Sessions
            </Button>
          </Box>
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 3,
            color: "#059669",
          }}
        >
          User Management
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search by email or username..."
              value={searchInput}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#059669" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: "white",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={selectedRole}
                label="Filter by Role"
                onChange={handleRoleChange}
                sx={{
                  backgroundColor: "white",
                  borderRadius: 2,
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role._id} value={role._id}>
                    {role.displayName || role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "#059669" }} />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          indeterminate={
                            selectedIds.length > 0 &&
                            selectedIds.length < users.length
                          }
                          checked={
                            users.length > 0 &&
                            selectedIds.length === users.length
                          }
                          onChange={handleSelectAllClick}
                          inputProps={{ "aria-label": "select all users" }}
                        />
                      </TableCell>
                      <TableCell>
                        <b>Full Name</b>
                      </TableCell>
                      <TableCell>
                        <b>Username</b>
                      </TableCell>
                      <TableCell>
                        <b>Email</b>
                      </TableCell>
                      <TableCell>
                        <b>Role</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>Actions</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="textSecondary">
                            No users found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => {
                        const isItemSelected = selectedIds.includes(user._id);
                        return (
                          <TableRow
                            key={user._id}
                            hover
                            selected={isItemSelected}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                color="primary"
                                checked={isItemSelected}
                                onChange={() => handleRowSelect(user._id)}
                                inputProps={{
                                  "aria-labelledby": `select-${user._id}`,
                                }}
                              />
                            </TableCell>
                            <TableCell id={`select-${user._id}`}>
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.userName}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={user.roleId?.displayName || "User"}
                                sx={{
                                  backgroundColor: "#f0fdf4",
                                  color: "#059669",
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                onClick={() => handleDeleteClick(user)}
                                sx={{ color: "error.main" }}
                              >
                                <Delete />
                              </IconButton>
                              <IconButton
                                onClick={() =>
                                  handleLogoutUserSessions(user._id)
                                }
                                sx={{ ml: 1 }}
                                title="Logout all sessions for this user"
                              >
                                <Logout />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Container>

      <Dialog open={bulkDeleteDialogOpen} onClose={handleBulkDeleteCancel}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete {selectedIds.length} selected user(s).
            This action cannot be undone. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
