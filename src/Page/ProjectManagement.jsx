import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Pagination,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Stack,
  Avatar,
  LinearProgress,
  CircularProgress, // NEW: Added CircularProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  Assignment as TaskIcon,
  DateRange as DateIcon,
  Flag as FlagIcon,
  Business as ProjectIcon,
  AutoFixHigh as AutoFixHighIcon, // NEW: Added AutoFixHighIcon
} from "@mui/icons-material";
import { projectAPI } from "../api";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { enhanceTaskDescription } from "../services/aiService"; // NEW: Added AI service import

const priorityColors = {
  low: "success",
  medium: "warning",
  high: "error",
  urgent: "error",
};

const statusColors = {
  active: "success",
  on_hold: "warning",
  completed: "info",
  cancelled: "error",
};

export default function ProjectManagement() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Current user info
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser?.roleId?.name === "admin";

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedProject, setSelectedProject] = useState(null);

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    assignedManager: "",
    startDate: "",
    endDate: "",
    tags: "",
    teamMembers: [],
  });

  // Team member dialog
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);
  const [newMember, setNewMember] = useState({ userId: "", role: "developer" });

  // NEW: AI Enhancement state
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [page, filters]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        limit: "10",
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      };

      const { data } = await projectAPI.getProjects(params);
      setProjects(data.projects || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/users");
      const allUsers = Array.isArray(data) ? data : data.users || [];

      console.log("[DEBUG] All users:", allUsers);
      console.log("[DEBUG] Current user role:", currentUser?.roleId?.name);

      if (isAdmin) {
        // Admin can see managers and users
        const availableUsers = allUsers.filter((user) =>
          ["manager", "user"].includes(user.roleId?.name)
        );
        setUsers(availableUsers);
        console.log("[DEBUG] Admin sees:", availableUsers);
      } else {
        // Manager can see users AND other managers for project assignment
        const availableUsers = allUsers.filter((user) =>
          ["manager", "user"].includes(user.roleId?.name)
        );
        setUsers(availableUsers);
        console.log("[DEBUG] Manager sees users + managers:", availableUsers);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // NEW: AI Enhancement function for project description
  const handleEnhanceDescription = async () => {
    try {
      if (!projectForm?.description || !projectForm.description.trim()) {
        setError("Please enter a description to enhance");
        return;
      }
      setEnhancing(true);
      const res = await enhanceTaskDescription({
        title: projectForm.name || "Project",
        description: projectForm.description,
      });
      const enhanced = res?.enhancedDescription || "";
      if (!enhanced) {
        setError("AI enhancement did not return a result");
        return;
      }
      setProjectForm({ ...projectForm, description: enhanced });
      setSuccess("Description enhanced successfully!");
    } catch (err) {
      console.error("[AI Enhancement] Failed:", err);
      setError("Unable to enhance description right now");
    } finally {
      setEnhancing(false);
    }
  };

  const handleCreateProject = () => {
    setProjectForm({
      name: "",
      description: "",
      status: "active",
      priority: "medium",
      assignedManager: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      tags: "",
      teamMembers: [],
    });
    setDialogMode("create");
    setOpenDialog(true);
  };

  const handleEditProject = (project) => {
    setProjectForm({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "active",
      priority: project.priority || "medium",
      assignedManager: project.assignedManager?._id || "",
      startDate: project.startDate
        ? new Date(project.startDate).toISOString().split("T")[0]
        : "",
      endDate: project.endDate
        ? new Date(project.endDate).toISOString().split("T")[0]
        : "",
      tags: project.tags?.join(", ") || "",
      teamMembers: project.teamMembers || [],
    });
    setSelectedProject(project);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleSubmitProject = async () => {
    try {
      if (!projectForm.name.trim()) {
        setError("Project name is required");
        return;
      }

      const formData = {
        ...projectForm,
        tags: projectForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      if (dialogMode === "create") {
        await projectAPI.createProject(formData);
        setSuccess("Project created successfully!");
      } else {
        await projectAPI.updateProject(selectedProject._id, formData);
        setSuccess("Project updated successfully!");
      }

      setOpenDialog(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save project");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      await projectAPI.deleteProject(projectId);
      setSuccess("Project deleted successfully!");
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  const handleToggleArchive = async (project) => {
    try {
      await projectAPI.toggleArchiveProject(project._id);
      setSuccess(
        `Project ${
          project.isArchived ? "unarchived" : "archived"
        } successfully!`
      );
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    }
  };

  const handleViewProject = (project) => {
    navigate(`/projects/${project._id}`);
  };

  const handleManageTeam = (project) => {
    setSelectedProjectForTeam(project);
    setTeamDialogOpen(true);
  };

  const handleAddTeamMember = async () => {
    try {
      if (!newMember.userId) {
        setError("Please select a team member");
        return;
      }

      await projectAPI.addTeamMember(
        selectedProjectForTeam._id,
        newMember.userId,
        newMember.role
      );
      setSuccess("Team member added successfully!");
      setNewMember({ userId: "", role: "developer" });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add team member");
    }
  };

  const handleRemoveTeamMember = async (userId) => {
    try {
      await projectAPI.removeTeamMember(selectedProjectForTeam._id, userId);
      setSuccess("Team member removed successfully!");
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove team member");
    }
  };

  const getProjectProgress = (project) => {
    return project.progress || 0;
  };

  if (loading) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        }}
      >
        <Typography variant="h6" sx={{ color: "#059669" }}>
          Loading Projects...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 1400,
          mx: "auto",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 10px 25px -5p× rgba(0, 0, 0, 0.1), 0 10px 10px -5p× rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(6, 95, 70, 0.1)",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            onClick={() =>
              navigate(isAdmin ? "/admin-dashboard" : "/manager-dashboard")
            }
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <ProjectIcon sx={{ fontSize: 40, color: "#059669" }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Project Management
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ color: "#6b7280" }}>
            Create, manage, and track your team projects
          </Typography>
        </Box>

        {/* Alerts */}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Filters and Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Grid container spacing={2} sx={{ flexGrow: 1, mr: 2 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Search Projects"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": { borderColor: "#059669" },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) =>
                    setFilters({ ...filters, priority: e.target.value })
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
            sx={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              "&:hover": {
                background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                boxShadow: "0 10px 25px -5p× rgba(5, 150, 105, 0.3)",
              },
            }}
          >
            Create Project
          </Button>
        </Box>

        {/* Projects Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Project Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell>
                  <strong>Priority</strong>
                </TableCell>
                <TableCell>
                  <strong>Manager</strong>
                </TableCell>
                <TableCell>
                  <strong>Progress</strong>
                </TableCell>
                <TableCell>
                  <strong>Dates</strong>
                </TableCell>
                <TableCell>
                  <strong>Team</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {project.name}
                      </Typography>
                      {project.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {project.description.substring(0, 60)}...
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status.replace("_", " ")}
                      color={statusColors[project.status]}
                      size="small"
                      sx={{ textTransform: "capitalize", fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.priority}
                      color={priorityColors[project.priority]}
                      size="small"
                      sx={{ textTransform: "capitalize", fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    {project.assignedManager ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
                        >
                          {project.assignedManager.firstName?.[0]}
                          {project.assignedManager.lastName?.[0]}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {project.assignedManager.firstName}{" "}
                          {project.assignedManager.lastName}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={getProjectProgress(project)}
                        sx={{
                          width: 60,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#e5e7eb",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: "#059669",
                            borderRadius: 3,
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getProjectProgress(project)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {project.startDate && (
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          Start:{" "}
                          {new Date(project.startDate).toLocaleDateString()}
                        </Typography>
                      )}
                      {project.endDate && (
                        <Typography
                          variant="body2"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          End: {new Date(project.endDate).toLocaleDateString()}
                        </Typography>
                      )}
                      {!project.startDate && !project.endDate && (
                        <Typography variant="body2" color="text.secondary">
                          No dates set
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Team Members">
                      <Chip
                        label={`${project.teamMembers?.length || 0} members`}
                        size="small"
                        sx={{
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          fontWeight: 600,
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="View Project">
                        <IconButton
                          size="small"
                          onClick={() => handleViewProject(project)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Project">
                        <IconButton
                          size="small"
                          onClick={() => handleEditProject(project)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Manage Team">
                        <IconButton
                          size="small"
                          onClick={() => handleManageTeam(project)}
                          sx={{ color: "#059669" }}
                        >
                          <PeopleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={project.isArchived ? "Unarchive" : "Archive"}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleToggleArchive(project)}
                          sx={{ color: "#f59e0b" }}
                        >
                          {project.isArchived ? (
                            <UnarchiveIcon fontSize="small" />
                          ) : (
                            <ArchiveIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Project">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteProject(project._id)}
                          sx={{
                            color: "#dc2626",
                            "&:hover": {
                              backgroundColor: "rgba(220, 38, 38, 0.04)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}

        {/* Create/Edit Project Dialog WITH AI ENHANCEMENT */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              borderBottom: "1px solid rgba(6, 95, 70, 0.1)",
              color: "#059669",
              fontWeight: 700,
              fontSize: "1.5rem",
            }}
          >
            {dialogMode === "create" ? "Create New Project" : "Edit Project"}
          </DialogTitle>
          <DialogContent sx={{ p: 4, backgroundColor: "#ffffff" }}>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Project Name *"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                margin="normal"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": { borderColor: "#059669" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                }}
              />
              <TextField
                fullWidth
                label="Description"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                margin="normal"
                multiline
                rows={3}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": { borderColor: "#059669" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                }}
              />

              {/* NEW: AI Enhancement Button for Project Description */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 1,
                  mb: 2,
                }}
              >
                <Tooltip title="Use AI to improve and structure your project description">
                  <span>
                    <Button
                      variant="outlined"
                      onClick={handleEnhanceDescription}
                      disabled={enhancing || !projectForm?.description?.trim()}
                      startIcon={
                        enhancing ? (
                          <CircularProgress size={16} />
                        ) : (
                          <AutoFixHighIcon />
                        )
                      }
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "#059669",
                        color: "#065f46",
                        "&:hover": {
                          borderColor: "#047857",
                          backgroundColor: "#ecfdf5",
                        },
                        "&:disabled": {
                          opacity: 0.6,
                        },
                      }}
                    >
                      {enhancing ? "Enhancing..." : "Enhance with AI"}
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={projectForm.status}
                      label="Status"
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="on_hold">On Hold</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={projectForm.priority}
                      label="Priority"
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          priority: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Manager assignment shows users AND managers */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Assigned Manager</InputLabel>
                <Select
                  value={projectForm.assignedManager}
                  label="Assigned Manager"
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      assignedManager: e.target.value,
                    })
                  }
                >
                  <MenuItem value="">No Manager</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
                        >
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.roleId?.name} • @{user.userName}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        startDate: e.target.value,
                      })
                    }
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": { borderColor: "#059669" },
                        "&.Mui-focused fieldset": { borderColor: "#059669" },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        endDate: e.target.value,
                      })
                    }
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": { borderColor: "#059669" },
                        "&.Mui-focused fieldset": { borderColor: "#059669" },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={projectForm.tags}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, tags: e.target.value })
                }
                margin="normal"
                helperText="e.g. web, mobile, api"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": { borderColor: "#059669" },
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              p: 3,
              backgroundColor: "#f9fafb",
              borderTop: "1px solid rgba(6, 95, 70, 0.1)",
              gap: 2,
            }}
          >
            <Button
              onClick={() => setOpenDialog(false)}
              sx={{
                color: "#6b7280",
                fontWeight: 600,
                "&:hover": { backgroundColor: "rgba(107, 114, 128, 0.04)" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitProject}
              disabled={!projectForm.name.trim() || enhancing}
              sx={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                  boxShadow: "0 10px 25px -5p× rgba(5, 150, 105, 0.3)",
                },
                "&:disabled": { background: "#d1d5db", color: "#9ca3af" },
              }}
            >
              {dialogMode === "create" ? "Create Project" : "Update Project"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Team Management Dialog (unchanged) */}
        <Dialog
          open={teamDialogOpen}
          onClose={() => setTeamDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: "#059669", fontWeight: 700 }}>
            Manage Team - {selectedProjectForTeam?.name}
          </DialogTitle>
          <DialogContent>
            {/* Add Team Member Form */}
            <Box
              sx={{ mb: 3, p: 2, backgroundColor: "#f9fafb", borderRadius: 2 }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Add Team Member
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>User</InputLabel>
                    <Select
                      value={newMember.userId}
                      label="User"
                      onChange={(e) =>
                        setNewMember({ ...newMember, userId: e.target.value })
                      }
                    >
                      {users
                        .filter(
                          (user) =>
                            !selectedProjectForTeam?.teamMembers?.some(
                              (member) => member.user._id === user._id
                            )
                        )
                        .map((user) => (
                          <MenuItem key={user._id} value={user._id}>
                            {user.firstName} {user.lastName}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={newMember.role}
                      label="Role"
                      onChange={(e) =>
                        setNewMember({ ...newMember, role: e.target.value })
                      }
                    >
                      <MenuItem value="lead">Lead</MenuItem>
                      <MenuItem value="developer">Developer</MenuItem>
                      <MenuItem value="designer">Designer</MenuItem>
                      <MenuItem value="tester">Tester</MenuItem>
                      <MenuItem value="analyst">Analyst</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddTeamMember}
                    disabled={!newMember.userId}
                    sx={{
                      background: "#059669",
                      "&:hover": { background: "#047857" },
                    }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Current Team Members */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Current Team Members (
              {selectedProjectForTeam?.teamMembers?.length || 0})
            </Typography>
            <Box>
              {selectedProjectForTeam?.teamMembers?.map((member) => (
                <Box
                  key={member.user._id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    mb: 1,
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {member.user.firstName?.[0]}
                      {member.user.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {member.user.firstName} {member.user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveTeamMember(member.user._id)}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              {(!selectedProjectForTeam?.teamMembers ||
                selectedProjectForTeam.teamMembers.length === 0) && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 2 }}
                >
                  No team members assigned yet
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTeamDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
