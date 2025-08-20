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
  CircularProgress,
  Pagination,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Stack,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Comment as CommentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  Delete as DeleteIcon, // Added delete icon import
} from "@mui/icons-material";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const priorityColors = {
  low: "success",
  medium: "warning",
  high: "error",
  urgent: "error",
};

const statusColors = {
  "to-do": "default",
  "in-progress": "info",
  completed: "success",
  cancelled: "error",
};

const statusIcons = {
  "to-do": <ScheduleIcon />,
  "in-progress": <PlayArrowIcon />,
  completed: <CheckCircleIcon />,
  cancelled: <CancelIcon />,
};

const formatEstimatedHours = (hours) => {
  if (!hours) return "0h 0m";
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours % 1) * 60);
  return `${wholeHours}h ${minutes}m`;
};

export default function UserTaskDashboard({ user }) {
  const navigate = useNavigate();
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  console.log("[v0] UserTaskDashboard - User prop:", user);
  console.log("[v0] UserTaskDashboard - Current user:", currentUser);
  console.log("[v0] UserTaskDashboard - User role:", currentUser?.roleId?.name);

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
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedTask, setSelectedTask] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    tags: "",
    estimatedHours: "",
    status: "to-do", // Changed default status from "pending" to "to-do"
  });

  // Comments
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Stats
  const [taskStats, setTaskStats] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchTaskStats();
  }, [page, filters, currentTab]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        assignedTo: currentUser._id, // Use currentUser instead of user
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const { data } = await API.get(`/tasks?${params}`);
      setTasks(data.tasks);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error("[v0] Failed to fetch tasks:", err);
      setError(err.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const { data } = await API.get(
        `/tasks/stats?assignedTo=${currentUser._id}`
      ); // Use currentUser
      setTaskStats(data);
    } catch (err) {
      console.error("[v0] Failed to fetch task stats:", err);
    }
  };

  const handleCreateTask = () => {
    setTaskForm({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      tags: "",
      estimatedHours: "",
      status: "to-do", // Changed default status from "pending" to "to-do"
    });
    setDialogMode("create");
    setOpenDialog(true);
  };

  const handleEditTask = (task) => {
    const isSelfCreated = task.createdBy?._id === currentUser._id;

    setTaskForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      priority: task.priority,
      tags: task.tags?.join(", ") || "",
      estimatedHours: task.estimatedHours || "",
      status: task.status,
    });
    setSelectedTask({ ...task, isSelfCreated });
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleViewTask = async (task) => {
    try {
      const { data } = await API.get(`/tasks/${task._id}`);
      setSelectedTask(data);
      setDialogMode("view");
      setOpenDialog(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch task details");
    }
  };

  const handleSubmitTask = async () => {
    try {
      const formData = {
        ...taskForm,
        assignedTo: currentUser._id, // Use currentUser
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
        setSuccess("Personal task created successfully!");
      } else {
        await API.put(`/tasks/${selectedTask._id}`, formData);
        setSuccess("Task updated successfully!");
      }

      setOpenDialog(false);
      fetchTasks();
      fetchTaskStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save task");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);
      await API.post(`/tasks/${selectedTask._id}/comments`, {
        text: newComment,
      });
      setNewComment("");

      // Refresh task details
      const { data } = await API.get(`/tasks/${selectedTask._id}`);
      setSelectedTask(data);
      setSuccess("Comment added successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    try {
      await API.delete(`/tasks/${taskToDelete._id}`);
      setSuccess("Task deleted successfully!");
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
      fetchTasks();
      fetchTaskStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const renderDashboardTab = () => (
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
              My Tasks
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
              {taskStats?.statusBreakdown?.find((s) => s._id === "in-progress")
                ?.count || 0}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              In Progress
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
              {taskStats?.statusBreakdown?.find((s) => s._id === "completed")
                ?.count || 0}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Completed
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
            }}
          >
            My Progress Overview
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "#374151", fontWeight: 600 }}
              >
                Task Completion Rate
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.round(
                    ((taskStats?.statusBreakdown?.find(
                      (s) => s._id === "completed"
                    )?.count || 0) /
                      (taskStats?.totalTasks || 1)) *
                      100
                  )}
                  sx={{
                    flexGrow: 1,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#e5e7eb",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#059669",
                      borderRadius: 5,
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "#059669", fontWeight: 600, minWidth: "40px" }}
                >
                  {Math.round(
                    ((taskStats?.statusBreakdown?.find(
                      (s) => s._id === "completed"
                    )?.count || 0) /
                      (taskStats?.totalTasks || 1)) *
                      100
                  )}
                  %
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "#374151", fontWeight: 600 }}
              >
                Priority Distribution
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {taskStats?.priorityBreakdown?.map((priority) => (
                  <Chip
                    key={priority._id}
                    label={`${priority._id}: ${priority.count}`}
                    color={priorityColors[priority._id]}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  />
                ))}
              </Box>
            </Grid>
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
          <Grid item xs={12} sm={4}>
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
                <MenuItem value="to-do">To Do</MenuItem>{" "}
                {/* Updated from "pending" to "to-do" */}
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
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
          onClick={handleCreateTask}
        >
          Create Personal Task
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
            {tasks.map((task) => {
              const isSelfCreated = task.createdBy?._id === currentUser._id;

              return (
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
                      {task.tags && task.tags.length > 0 && (
                        <Box
                          sx={{
                            mt: 1,
                            display: "flex",
                            gap: 0.5,
                            flexWrap: "wrap",
                          }}
                        >
                          {task.tags.slice(0, 2).map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {task.tags.length > 2 && (
                            <Chip
                              label={`+${task.tags.length - 2}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
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
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewTask(task)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Task">
                        <IconButton
                          size="small"
                          onClick={() => handleEditTask(task)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isSelfCreated && (
                        <Tooltip title="Delete Task">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTask(task)}
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
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
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
        <CircularProgress sx={{ color: "#059669" }} />
      </Box>
    );
  }

  if (!currentUser || !currentUser?.id) {
    return null;
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
          width: "100%",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(6, 95, 70, 0.1)",
        }}
      >
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
                <DashboardIcon />
                Dashboard
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentIcon />
                My Tasks
                <Badge
                  badgeContent={total}
                  sx={{
                    ml: 1, // 👈 add spacing
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

        {currentTab === 0 && renderDashboardTab()}
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
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
              color: "white",
              py: 3,
              px: 4,
              fontSize: "1.5rem",
              fontWeight: 600,
              letterSpacing: "0.025em",
              textAlign: "left",
              borderBottom: "none",
            }}
          >
            {dialogMode === "create" && "Create New Task"}
            {dialogMode === "edit" && "Edit Task"}
            {dialogMode === "view" && "Task Details"}
          </DialogTitle>

          <DialogContent
            sx={{
              backgroundColor: "#fafafa",
              px: 4,
              py: 3,
              minHeight: "400px",
            }}
          >
            {dialogMode === "view" && selectedTask ? (
              <Box>
                {/* Basic Information Card */}
                <Card
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: "#0d9488",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      📋 Task Information
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: "#374151",
                          fontSize: "0.875rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        📝 Title
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          wordBreak: "break-word",
                          lineHeight: 1.4,
                          color: "#1f2937",
                          fontWeight: 600,
                          p: 2,
                          backgroundColor: "#f8fafc",
                          borderRadius: 2,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {selectedTask.title}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: "#374151",
                          fontSize: "0.875rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        📄 Description
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          wordBreak: "break-word",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          color: "#374151",
                          p: 2,
                          backgroundColor: "#f8fafc",
                          borderRadius: 2,
                          border: "1px solid #e2e8f0",
                          minHeight: "60px",
                        }}
                      >
                        {selectedTask.description || "No description provided"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Status & Priority Card */}
                <Card
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: "#0d9488",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      🎯 Status & Priority
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor: "#fef3c7",
                            borderRadius: 2,
                            border: "1px solid #fbbf24",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: "#92400e",
                              fontSize: "0.875rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            🚀 Priority
                          </Typography>
                          <Chip
                            label={selectedTask.priority}
                            color={priorityColors[selectedTask.priority]}
                            size="medium"
                            sx={{
                              textTransform: "capitalize",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor: "#dbeafe",
                            borderRadius: 2,
                            border: "1px solid #3b82f6",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: "#1e40af",
                              fontSize: "0.875rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            📊 Status
                          </Typography>
                          <Chip
                            icon={statusIcons[selectedTask.status]}
                            label={selectedTask.status.replace("-", " ")}
                            color={statusColors[selectedTask.status]}
                            size="medium"
                            sx={{
                              textTransform: "capitalize",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Timeline & Details Card */}
                <Card
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: "#0d9488",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      ⏰ Timeline & Details
                    </Typography>

                    <Grid container spacing={3}>
                      {selectedTask.dueDate && (
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              p: 2,
                              backgroundColor: "#fce7f3",
                              borderRadius: 2,
                              border: "1px solid #ec4899",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                mb: 1,
                                fontWeight: 600,
                                color: "#be185d",
                                fontSize: "0.875rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              📅 Due Date
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                color: "#1f2937",
                              }}
                            >
                              {new Date(
                                selectedTask.dueDate
                              ).toLocaleDateString()}
                            </Typography>
                            {new Date(selectedTask.dueDate) < new Date() &&
                              selectedTask.status !== "completed" && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    fontWeight: 600,
                                    color: "#dc2626",
                                    mt: 0.5,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  ⚠️ Overdue
                                </Typography>
                              )}
                          </Box>
                        </Grid>
                      )}
                      {selectedTask.estimatedHours && (
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              p: 2,
                              backgroundColor: "#ecfdf5",
                              borderRadius: 2,
                              border: "1px solid #10b981",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                mb: 1,
                                fontWeight: 600,
                                color: "#047857",
                                fontSize: "0.875rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              ⏱️ Estimated Time
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <AccessTimeIcon
                                fontSize="small"
                                sx={{ color: "#059669" }}
                              />
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: "#059669",
                                  fontSize: "1.1rem",
                                }}
                              >
                                {formatEstimatedHours(
                                  selectedTask.estimatedHours
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Tags Card */}
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <Card
                    sx={{
                      mb: 3,
                      borderRadius: 3,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          color: "#0d9488",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        🏷️ Tags
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {selectedTask.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="medium"
                            variant="outlined"
                            sx={{
                              borderColor: "#0d9488",
                              color: "#0d9488",
                              fontWeight: 500,
                              "&:hover": {
                                backgroundColor: "#f0fdfa",
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Comments Section */}
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        color: "#0d9488",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      💬 Comments ({selectedTask.comments?.length || 0})
                    </Typography>

                    {selectedTask.comments?.map((comment, index) => (
                      <Card
                        key={index}
                        variant="outlined"
                        sx={{ mb: 2, borderRadius: 2 }}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                            sx={{ fontWeight: 500 }}
                          >
                            {comment.author?.firstName}{" "}
                            {comment.author?.lastName} •{" "}
                            {new Date(comment.createdAt).toLocaleString()}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              wordBreak: "break-word",
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {comment.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}

                    {selectedTask.comments?.length === 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          textAlign: "center",
                          py: 3,
                          fontStyle: "italic",
                          backgroundColor: "#f8fafc",
                          borderRadius: 2,
                          border: "1px dashed #cbd5e1",
                        }}
                      >
                        💭 No comments yet
                      </Typography>
                    )}

                    {/* Add Comment */}
                    <Box sx={{ mt: 3 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "white",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#0d9488",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#0d9488",
                            },
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || commentLoading}
                        startIcon={
                          commentLoading ? (
                            <CircularProgress size={16} />
                          ) : (
                            <CommentIcon />
                          )
                        }
                        sx={{
                          background:
                            "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #0f766e 0%, #047857 100%)",
                          },
                        }}
                      >
                        Add Comment
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Box sx={{ pt: 1 }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  margin="normal"
                  required
                  disabled={
                    dialogMode === "edit" && !selectedTask?.isSelfCreated
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d9488",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d9488",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#0d9488",
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
                  disabled={
                    dialogMode === "edit" && !selectedTask?.isSelfCreated
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d9488",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d9488",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#0d9488",
                    },
                  }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel
                        sx={{ "&.Mui-focused": { color: "#0d9488" } }}
                      >
                        Status
                      </InputLabel>
                      <Select
                        value={taskForm.status}
                        label="Status"
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, status: e.target.value })
                        }
                        sx={{
                          borderRadius: 2,
                          backgroundColor: "white",
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#0d9488",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#0d9488",
                          },
                        }}
                      >
                        <MenuItem value="to-do">To Do</MenuItem>{" "}
                        {/* Updated from "pending" to "to-do" */}
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {(dialogMode === "create" ||
                    (dialogMode === "edit" && selectedTask?.isSelfCreated)) && (
                    <Grid item xs={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel
                          sx={{ "&.Mui-focused": { color: "#0d9488" } }}
                        >
                          Priority
                        </InputLabel>
                        <Select
                          value={taskForm.priority}
                          label="Priority"
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              priority: e.target.value,
                            })
                          }
                          sx={{
                            borderRadius: 2,
                            backgroundColor: "white",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#0d9488",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#0d9488",
                            },
                          }}
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="urgent">Urgent</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
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
                      disabled={
                        dialogMode === "edit" && !selectedTask?.isSelfCreated
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: "white",
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#0d9488",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#0d9488",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          color: "#374151",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        Estimated Time
                      </Typography>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                          border: "2px solid #e2e8f0",
                          borderRadius: 3,
                          p: 2.5,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            borderColor: "#0d9488",
                            boxShadow: "0 4px 12px rgba(13, 148, 136, 0.15)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ textAlign: "center" }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mb: 1,
                                color: "#0d9488",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontSize: "0.75rem",
                              }}
                            >
                              HOURS
                            </Typography>
                            <TextField
                              type="number"
                              value={Math.floor(taskForm.estimatedHours || 0)}
                              onChange={(e) => {
                                const hours =
                                  Number.parseInt(e.target.value) || 0;
                                const minutes =
                                  (taskForm.estimatedHours || 0) % 1;
                                setTaskForm({
                                  ...taskForm,
                                  estimatedHours: hours + minutes,
                                });
                              }}
                              inputProps={{ min: 0, max: 24 }}
                              disabled={
                                dialogMode === "edit" &&
                                !selectedTask?.isSelfCreated
                              }
                              sx={{
                                width: 80,
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  backgroundColor: "#ffffff",
                                  "& input": {
                                    textAlign: "center",
                                    fontWeight: 600,
                                    fontSize: "1.1rem",
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#0d9488",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "#0d9488",
                                    },
                                },
                              }}
                            />
                          </Box>

                          <Typography
                            variant="h4"
                            sx={{
                              color: "#0d9669",
                              fontWeight: 300,
                              animation: "pulse 2s infinite",
                              "@keyframes pulse": {
                                "0%, 100%": { opacity: 1 },
                                "50%": { opacity: 0.5 },
                              },
                            }}
                          >
                            :
                          </Typography>

                          <Box sx={{ textAlign: "center" }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mb: 1,
                                color: "#059669",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontSize: "0.75rem",
                              }}
                            >
                              MINUTES
                            </Typography>
                            <FormControl>
                              <Select
                                value={Math.round(
                                  ((taskForm.estimatedHours || 0) % 1) * 60
                                )}
                                onChange={(e) => {
                                  const hours = Math.floor(
                                    taskForm.estimatedHours || 0
                                  );
                                  const minutes =
                                    Number.parseInt(e.target.value) / 60;
                                  setTaskForm({
                                    ...taskForm,
                                    estimatedHours: hours + minutes,
                                  });
                                }}
                                disabled={
                                  dialogMode === "edit" &&
                                  !selectedTask?.isSelfCreated
                                }
                                sx={{
                                  width: 80,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    backgroundColor: "#ffffff",
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor: "#059669",
                                      },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor: "#059669",
                                      },
                                  },
                                  "& .MuiSelect-select": {
                                    textAlign: "center",
                                    fontWeight: 600,
                                    fontSize: "1.1rem",
                                  },
                                }}
                              >
                                <MenuItem value={0}>00</MenuItem>
                                <MenuItem value={15}>15</MenuItem>
                                <MenuItem value={30}>30</MenuItem>
                                <MenuItem value={45}>45</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>

                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            textAlign: "center",
                            mt: 1.5,
                            color: "#f59e0b",
                            fontWeight: 500,
                            fontSize: "0.75rem",
                          }}
                        >
                          💡 Select hours and minutes (max 24:00)
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  value={taskForm.tags}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, tags: e.target.value })
                  }
                  helperText="e.g. personal, urgent, learning"
                  disabled={
                    dialogMode === "edit" && !selectedTask?.isSelfCreated
                  }
                  sx={{
                    mt: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d9488",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d9488",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#0d9488",
                    },
                  }}
                />
              </Box>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              backgroundColor: "#ffffff",
              px: 4,
              py: 3,
              borderTop: "1px solid #e5e7eb",
              gap: 2,
            }}
          >
            <Button
              onClick={() => setOpenDialog(false)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              {dialogMode === "view" ? "Close" : "Cancel"}
            </Button>
            {dialogMode !== "view" && (
              <Button
                variant="contained"
                onClick={handleSubmitTask}
                sx={{
                  background:
                    "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #0f766e 0%, #047857 100%)",
                    boxShadow: "0 6px 8px -1px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                {dialogMode === "create" ? "Create Task" : "Update Task"}
              </Button>
            )}
          </DialogActions>
        </Dialog>
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the task "{taskToDelete?.title}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDeleteTask}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
