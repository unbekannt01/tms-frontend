"use client";

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
  Avatar,
  Stack,
  Tab,
  Tabs,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  SupervisorAccount as ManagerIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import API from "../../api";
import { useNavigate } from "react-router-dom";

const priorityColors = {
  low: "success",
  medium: "warning",
  high: "error",
  urgent: "error",
};

const statusColors = {
  pending: "default",
  "in-progress": "info",
  completed: "success",
  cancelled: "error",
};

const statusIcons = {
  pending: <ScheduleIcon />,
  "in-progress": <PlayArrowIcon />,
  completed: <CheckCircleIcon />,
  cancelled: <CancelIcon />,
};

export default function ManagerTaskDashboard({ user }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentTab, setCurrentTab] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedTask, setSelectedTask] = useState(null);

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
    tags: "",
    estimatedHours: "",
    status: "pending",
  });

  // Users and stats
  const [teamMembers, setTeamMembers] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
    fetchTaskStats();
    fetchTeamPerformance();
  }, [page, filters, currentTab]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        scope: "team", // Manager sees team tasks
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const { data } = await API.get(`/tasks?${params}`);
      setTasks(data.tasks);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      console.log("[v0] Fetching team members...");
      const { data } = await API.get("/users?roleId.name=user"); // Get team members
      console.log("[v0] API response:", data);
      const users = data.users || data || [];
      console.log("[v0] Extracted users:", users);
      setTeamMembers(users);
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const { data } = await API.get("/tasks/stats?scope=team");
      setTaskStats(data);
    } catch (err) {
      console.error("Failed to fetch task stats:", err);
    }
  };

  const fetchTeamPerformance = async () => {
    try {
      const { data } = await API.get("/tasks/team-performance");
      setTeamPerformance(data || []);
    } catch (err) {
      console.error("Failed to fetch team performance:", err);
    }
  };

  const handleCreateTask = () => {
    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      priority: "medium",
      tags: "",
      estimatedHours: "",
      status: "pending",
    });
    setDialogMode("create");
    setOpenDialog(true);
  };

  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  const handleEditTask = (task) => {
    const assignedToId = task?.assignedTo?._id;
    const createdById = task?.createdBy?._id;
    const currentUserId = currentUser?._id;

    if (!currentUserId) {
      setError("User not found. Please login again.");
      return;
    }

    if (assignedToId !== currentUserId && createdById !== currentUserId) {
      setError("You can only edit tasks assigned to your team");
      return;
    }

    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: assignedToId || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      priority: task.priority || "medium",
      tags: task.tags?.join(", ") || "",
      estimatedHours: task.estimatedHours || "",
      status: task.status || "pending",
    });

    setSelectedTask(task);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleSubmitTask = async () => {
    try {
      const formData = {
        ...taskForm,
        tags: taskForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        estimatedHours: taskForm.estimatedHours
          ? Number(taskForm.estimatedHours)
          : undefined,
      };

      if (dialogMode === "create") {
        await API.post("/tasks", formData);
        setSuccess("Task created and assigned successfully!");
      } else {
        await API.put(`/tasks/${selectedTask._id}`, formData);
        setSuccess("Task updated successfully!");
      }

      setOpenDialog(false);
      fetchTasks();
      fetchTaskStats();
      fetchTeamPerformance();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save task");
    }
  };

  const renderTeamOverviewTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              textAlign: "center",
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "white",
              boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.3)",
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {taskStats?.totalTasks || 0}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Team Tasks
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              textAlign: "center",
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              color: "white",
              boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.3)",
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {taskStats?.overdueTasks || 0}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Overdue
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              textAlign: "center",
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "white",
              boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.3)",
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {teamMembers.length}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Team Members
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              textAlign: "center",
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              color: "white",
              boxShadow: "0 10px 25px -5px rgba(22, 163, 74, 0.3)",
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {Math.round(
                ((taskStats?.statusBreakdown?.find((s) => s._id === "completed")
                  ?.count || 0) /
                  (taskStats?.totalTasks || 1)) *
                  100
              )}
              %
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Completion Rate
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          backgroundColor: "#ffffff",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid rgba(6, 95, 70, 0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              color: "#059669",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PeopleIcon /> Team Performance
          </Typography>
          <Grid container spacing={3}>
            {teamPerformance.map((member, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                    "&:hover": {
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 3 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        mx: "auto",
                        mb: 2,
                        background:
                          "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        fontSize: "1.5rem",
                        fontWeight: 600,
                      }}
                    >
                      {member.name?.[0]}
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "#1f2937", mb: 1 }}
                    >
                      {member.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#6b7280", mb: 2 }}
                    >
                      {member.totalTasks} tasks assigned
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        label={`${member.completedTasks} completed`}
                        sx={{
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          fontWeight: 600,
                        }}
                        size="small"
                      />
                      <Chip
                        label={`${member.pendingTasks} pending`}
                        sx={{
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          fontWeight: 600,
                        }}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderTasksTab = () => (
    <Box>
      {/* Alerts */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
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
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
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
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Team Member</InputLabel>
              <Select
                value={filters.assignedTo}
                label="Team Member"
                onChange={(e) =>
                  setFilters({ ...filters, assignedTo: e.target.value })
                }
              >
                <MenuItem value="">All Team</MenuItem>
                {teamMembers.map((member) => (
                  <MenuItem key={member._id} value={member._id}>
                    {member.firstName} {member.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
        >
          Assign Task
        </Button>
      </Box>

      {/* Tasks Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Title</strong>
              </TableCell>
              <TableCell>
                <strong>Assigned To</strong>
              </TableCell>
              <TableCell>
                <strong>Priority</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Due Date</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task._id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {task.description.substring(0, 60)}...
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
                    >
                      {task.assignedTo?.firstName?.[0]}
                      {task.assignedTo?.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    color={priorityColors[task.priority]}
                    size="small"
                    sx={{ textTransform: "capitalize", fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={statusIcons[task.status]}
                    label={task.status.replace("-", " ")}
                    color={statusColors[task.status]}
                    size="small"
                    sx={{ textTransform: "capitalize", fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  {task.dueDate ? (
                    <Box>
                      <Typography variant="body2">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                      {new Date(task.dueDate) < new Date() &&
                        task.status !== "completed" && (
                          <Typography variant="caption" color="error">
                            Overdue
                          </Typography>
                        )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No due date
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Edit Task">
                      <IconButton
                        size="small"
                        onClick={() => handleEditTask(task)}
                      >
                        <EditIcon fontSize="small" />
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
    </Box>
  );

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
          width: "100%",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(6, 95, 70, 0.1)",
        }}
      >
        {/* <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/profile")}
              sx={{
                mb: 3,
                borderColor: "#059669",
                color: "#059669",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#047857",
                  backgroundColor: "rgba(5, 150, 105, 0.04)",
                },
              }}
            >
              ← Back to Profile
            </Button>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Team Task Management
              </Typography>
              <Chip
                icon={<ManagerIcon />}
                label="Manager"
                sx={{
                  backgroundColor: "#fef3c7",
                  color: "#d97706",
                  fontWeight: 600,
                  border: "1px solid #fed7aa",
                }}
                size="small"
              />
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: "#6b7280",
                fontSize: "1.1rem",
              }}
            >
              Manage and assign tasks to your team members
            </Typography>
          </Box>
        </Box> */}

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

        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            mb: 4,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              color: "#6b7280",
              "&.Mui-selected": {
                color: "#059669",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#059669",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUpIcon />
                Team Overview
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentIcon />
                Team Tasks
                <Badge
                  badgeContent={total}
                  sx={{
                    ml: 1,
                    "& .MuiBadge-badge": {
                      backgroundColor: "#059669",
                      color: "#ffffff",
                      fontWeight: 600,
                      minWidth: 22,
                      height: 22,
                    },
                  }}
                />
              </Box>
            }
          />
        </Tabs>

        {currentTab === 0 && renderTeamOverviewTab()}
        {currentTab === 1 && renderTasksTab()}

        {/* Task Dialog */}
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
            {dialogMode === "create" ? "Assign New Task" : "Edit Task"}
          </DialogTitle>
          <DialogContent sx={{ p: 4, backgroundColor: "#ffffff" }}>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Title *"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                margin="normal"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "#059669",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#059669",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#059669",
                  },
                }}
              />
              <TextField
                fullWidth
                label="Description"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                margin="normal"
                multiline
                rows={3}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "#059669",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#059669",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#059669",
                  },
                }}
              />
              <FormControl
                fullWidth
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "#059669",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#059669",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#059669",
                  },
                }}
              >
                <InputLabel>Assign To Team Member</InputLabel>
                <Select
                  value={taskForm.assignedTo}
                  label="Assign To Team Member"
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, assignedTo: e.target.value })
                  }
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        border: "1px solid rgba(6, 95, 70, 0.1)",
                      },
                    },
                  }}
                >
                  {teamMembers.length === 0 ? (
                    <MenuItem disabled>
                      <Typography color="text.secondary">
                        No team members available (Found: {teamMembers.length})
                      </Typography>
                    </MenuItem>
                  ) : (
                    teamMembers.map((member) => (
                      <MenuItem
                        key={member._id}
                        value={member._id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(5, 150, 105, 0.04)",
                          },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: "0.875rem",
                              background:
                                "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            }}
                          >
                            {member.firstName?.[0]}
                            {member.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {member.firstName} {member.lastName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              @{member.userName}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl
                    fullWidth
                    margin="normal"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "#059669",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#059669",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#059669",
                      },
                    }}
                  >
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={taskForm.priority}
                      label="Priority"
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, priority: e.target.value })
                      }
                    >
                      <MenuItem value="low">
                        <Chip
                          label="Low"
                          color="success"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        Low Priority
                      </MenuItem>
                      <MenuItem value="medium">
                        <Chip
                          label="Medium"
                          color="warning"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        Medium Priority
                      </MenuItem>
                      <MenuItem value="high">
                        <Chip
                          label="High"
                          color="error"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        High Priority
                      </MenuItem>
                      <MenuItem value="urgent">
                        <Chip
                          label="Urgent"
                          color="error"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        Urgent Priority
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  {dialogMode === "edit" && (
                    <FormControl
                      fullWidth
                      margin="normal"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": {
                            borderColor: "#059669",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#059669",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#059669",
                        },
                      }}
                    >
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={taskForm.status}
                        label="Status"
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, status: e.target.value })
                        }
                      >
                        <MenuItem value="pending">
                          <Chip
                            icon={<ScheduleIcon />}
                            label="Pending"
                            color="default"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          Pending
                        </MenuItem>
                        <MenuItem value="in-progress">
                          <Chip
                            icon={<PlayArrowIcon />}
                            label="In Progress"
                            color="info"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          In Progress
                        </MenuItem>
                        <MenuItem value="completed">
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Completed"
                            color="success"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          Completed
                        </MenuItem>
                        <MenuItem value="cancelled">
                          <Chip
                            icon={<CancelIcon />}
                            label="Cancelled"
                            color="error"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          Cancelled
                        </MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, dueDate: e.target.value })
                    }
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "#059669",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#059669",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#059669",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Estimated Hours"
                    type="number"
                    value={taskForm.estimatedHours}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        estimatedHours: e.target.value,
                      })
                    }
                    margin="normal"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "#059669",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#059669",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#059669",
                      },
                    }}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={taskForm.tags}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, tags: e.target.value })
                }
                margin="normal"
                helperText="e.g. frontend, urgent, bug-fix"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "#059669",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#059669",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#059669",
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
                "&:hover": {
                  backgroundColor: "rgba(107, 114, 128, 0.04)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitTask}
              disabled={!taskForm.title || !taskForm.assignedTo}
              sx={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                  boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.3)",
                },
                "&:disabled": {
                  background: "#d1d5db",
                  color: "#9ca3af",
                },
              }}
            >
              {dialogMode === "create" ? "Assign Task" : "Update Task"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
