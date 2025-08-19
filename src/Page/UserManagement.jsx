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
} from "@mui/material";
import { Search, Delete } from "@mui/icons-material";
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
    setRowsPerPage(parseInt(event.target.value, 10));
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

  const handleDeleteConfirm = async () => {
    try {
      await API.delete(`/users/${userToDelete._id}`);
      setSnackbar({
        open: true,
        message: "User deleted successfully",
        severity: "success",
      });
      // Refresh the user list
      fetchUsers(page + 1, rowsPerPage, selectedRole, searchTerm);
    } catch (err) {
      console.error("Error deleting user:", err);
      setSnackbar({
        open: true,
        message: "Failed to delete user",
        severity: "error",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
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
        <Box sx={{ mb: 3 }}>
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
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="textSecondary">
                            No users found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
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
                          </TableCell>
                        </TableRow>
                      ))
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
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <b>
              {userToDelete?.firstName} {userToDelete?.lastName}
            </b>
            ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error messages */}
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
