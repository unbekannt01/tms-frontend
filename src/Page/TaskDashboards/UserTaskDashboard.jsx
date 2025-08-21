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
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  Info as InfoIcon,
  Flag as FlagIcon,
  Timeline as TimelineIcon,
  Label as LabelIcon,
  Chat as ChatIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import API from "../../api";
import { useNavigate } from "react-router-dom";

const priorityColors = {
  low: "success",
  medium: "warning",
  high: "error",
  urgent: "error",
};

// 🔧 FIXED STATUS MAPPING - Handle both "todo" and "pending"
const statusColors = {
  pending: "default",
  todo: "default", // Map "todo" to same as "pending"
  "in-progress": "info",
  completed: "success",
  cancelled: "error",
};

const statusIcons = {
  pending: <ScheduleIcon />,
  todo: <ScheduleIcon />, // Map "todo" to same as "pending"
  "in-progress": <PlayArrowIcon />,
  completed: <CheckCircleIcon />,
  cancelled: <CancelIcon />,
};

// 🔧 STATUS NORMALIZATION FUNCTION
const normalizeStatus = (status) => {
  // Convert "todo" to "pending" for display consistency
  if (status === "todo") return "pending";
  return status || "pending";
};

// 🔧 STATUS DISPLAY FUNCTION
const getStatusDisplay = (status) => {
  const normalized = normalizeStatus(status);
  return {
    label: normalized.replace("-", " "),
    color: statusColors[normalized] || statusColors.pending,
    icon: statusIcons[normalized] || statusIcons.pending,
  };
};

function UserTaskDashboard({ user }) {
  const navigate = useNavigate();
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    tags: "",
    estimatedHours: 0,
    estimatedMinutes: 0,
    status: "pending", // 🔧 ALWAYS DEFAULT TO "pending"
  });
  // 🔧 NEW: Store original task data for comparison
  const [originalTaskData, setOriginalTaskData] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [taskStats, setTaskStats] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchTaskStats();
  }, [page, filters, currentTab]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 🔧 NEW: Calculate remaining hours in today
  const getRemainingHoursToday = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Set to end of day

    const remainingMs = endOfDay.getTime() - now.getTime();
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor(
      (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
    );

    return {
      hours: remainingHours,
      minutes: remainingMinutes,
      total: remainingHours + remainingMinutes / 60,
    };
  };

  // 🔧 NEW: Check if selected date is today
  const isSelectedDateToday = () => {
    if (!taskForm.dueDate) return false;
    const selectedDate = new Date(taskForm.dueDate);
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  // 🔧 NEW: Get current estimated time in hours
  const getCurrentEstimatedHours = () => {
    return taskForm.estimatedHours + taskForm.estimatedMinutes / 60;
  };

  // 🔧 NEW: Check if estimated time exceeds remaining time
  const exceedsRemainingTime = () => {
    if (!isSelectedDateToday()) return false;
    const remaining = getRemainingHoursToday();
    const estimated = getCurrentEstimatedHours();
    return estimated > remaining.total;
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        assignedTo: currentUser._id,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const { data } = await API.get(`/tasks?${params}`);

      // 🔧 NORMALIZE STATUS IN FETCHED TASKS
      const normalizedTasks = (data.tasks || []).map((task) => ({
        ...task,
        status: normalizeStatus(task.status),
      }));

      setTasks(normalizedTasks);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const { data } = await API.get(
        `/tasks/stats?assignedTo=${currentUser._id}`
      );
      setTaskStats(data);
    } catch (err) {
      // Silent fail for stats
    }
  };

  // 🔧 FIXED: Role detection based on your actual API data
  const getTaskSourceInfo = (task) => {
    const createdBy = task.createdBy;
    const currentUserId = currentUser._id;

    // If task is created by the current user (personal task)
    if (createdBy?._id === currentUserId) {
      return {
        label: "Personal",
        icon: <PersonIcon />,
        color: { bg: "#dcfce7", text: "#166534" },
        description: "Created by you",
        showDescription: false,
      };
    }

    // 🔧 FIXED: Detect role from firstName, lastName, userName, or email
    const getUserRole = (userObj) => {
      if (!userObj) return null;

      const firstName = (userObj.firstName || "").toLowerCase();
      const lastName = (userObj.lastName || "").toLowerCase();
      const userName = (userObj.userName || "").toLowerCase();
      const email = (userObj.email || "").toLowerCase();

      // Check if user is admin
      if (
        firstName === "admin" ||
        lastName === "admin" ||
        userName === "admin" ||
        email.includes("admin")
      ) {
        return "admin";
      }

      // Check if user is manager
      if (
        firstName === "manager" ||
        lastName === "manager" ||
        userName === "manager" ||
        email.includes("manager")
      ) {
        return "manager";
      }

      return null;
    };

    const userRole = getUserRole(createdBy);

    // If task is assigned by Admin
    if (userRole === "admin") {
      return {
        label: "Assigned by Admin",
        icon: <AdminIcon />,
        color: { bg: "#dbeafe", text: "#1e40af" },
        description: `Assigned by Admin`,
        showDescription: false,
      };
    }

    // If task is assigned by Manager
    if (userRole === "manager") {
      return {
        label: "Assigned by Manager",
        icon: <ManagerIcon />,
        color: { bg: "#fef3c7", text: "#92400e" },
        description: `Assigned by Manager`,
        showDescription: false,
      };
    }

    // Fallback for unknown roles
    if (createdBy && createdBy._id !== currentUserId) {
      return {
        label: "Assigned",
        icon: <AssignmentIcon />,
        color: { bg: "#f3f4f6", text: "#374151" },
        description: `Assigned by ${createdBy.firstName || "Unknown"} ${
          createdBy.lastName || "User"
        }`,
        showDescription: true,
      };
    }

    return {
      label: "Assigned",
      icon: <AssignmentIcon />,
      color: { bg: "#f3f4f6", text: "#374151" },
      description: "Assigned task",
      showDescription: false,
    };
  };

  const handleCreateTask = () => {
    // 🔧 ALWAYS SET DEFAULT STATUS TO "pending", NEVER "todo"
    const defaultForm = {
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      tags: "",
      estimatedHours: 0,
      estimatedMinutes: 0,
      status: "pending", // 🔧 EXPLICITLY SET TO "pending"
    };

    setTaskForm(defaultForm);
    setOriginalTaskData(null); // No original data for new tasks
    setDialogMode("create");
    setOpenDialog(true);
  };

  const handleEditTask = (task) => {
    const isSelfCreated = task.createdBy?._id === currentUser._id;
    const totalHours = task.estimatedHours || 0;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    // 🔧 NORMALIZE STATUS WHEN EDITING
    const normalizedStatus = normalizeStatus(task.status);

    const formData = {
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      priority: task.priority || "medium",
      tags: task.tags?.join(", ") || "",
      estimatedHours: hours,
      estimatedMinutes: minutes,
      status: normalizedStatus, // 🔧 USE NORMALIZED STATUS
    };

    setTaskForm(formData);
    // 🔧 NEW: Store original data for comparison
    setOriginalTaskData(formData);
    setSelectedTask({ ...task, isSelfCreated });
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const handleViewTask = async (task) => {
    try {
      const { data } = await API.get(`/tasks/${task._id}`);

      // 🔧 NORMALIZE STATUS IN VIEW DATA
      const normalizedTask = {
        ...data,
        status: normalizeStatus(data.status),
      };

      setSelectedTask(normalizedTask);
      setDialogMode("view");
      setOpenDialog(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch task details");
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

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

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  const canDeleteTask = (task) => {
    return task.createdBy?._id === currentUser._id;
  };

  // 🔧 NEW: Function to check if task data has changed
  const hasTaskDataChanged = () => {
    if (!originalTaskData) return true; // For new tasks, always allow saving

    const currentData = {
      title: taskForm.title,
      description: taskForm.description,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      tags: taskForm.tags,
      status: taskForm.status,
      estimatedHours: taskForm.estimatedHours,
      estimatedMinutes: taskForm.estimatedMinutes,
    };

    // Compare each field
    return Object.keys(currentData).some((key) => {
      return currentData[key] !== originalTaskData[key];
    });
  };

  const handleSubmitTask = async () => {
    try {
      // 🔧 NEW: Validate estimated time against remaining time if due today
      if (exceedsRemainingTime()) {
        setError("You don't have enough time left today for this task!");
        return;
      }

      // 🔧 NEW: Check if data has changed before making API call
      if (dialogMode === "edit" && !hasTaskDataChanged()) {
        setSuccess("No changes detected.");
        setOpenDialog(false);
        return;
      }

      const totalEstimatedHours =
        taskForm.estimatedHours + taskForm.estimatedMinutes / 60;

      const formData = {
        ...taskForm,
        assignedTo: currentUser._id,
        tags: taskForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        estimatedHours:
          totalEstimatedHours > 0 ? totalEstimatedHours : undefined,
        // 🔧 ENSURE STATUS IS ALWAYS "pending" FOR NEW TASKS
        status: dialogMode === "create" ? "pending" : taskForm.status,
      };

      delete formData.estimatedMinutes;

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

      const { data } = await API.get(`/tasks/${selectedTask._id}`);

      // 🔧 NORMALIZE STATUS IN UPDATED TASK
      const normalizedTask = {
        ...data,
        status: normalizeStatus(data.status),
      };

      setSelectedTask(normalizedTask);
      setSuccess("Comment added successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // 🔧 NEW: Handle filter changes without unnecessary page resets
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    // Reset to page 1 only when filters actually change
    if (filters[filterType] !== value) {
      setPage(1);
    }
  };

  const hourOptions = Array.from({ length: 25 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];

  // 🕒 SINGLE CONSISTENT TIME FORMATTING FUNCTION
  const formatEstimatedTime = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) {
      return "0h 0m";
    }

    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Format consistently
    return `${hours}h ${minutes}m`;
  };

  const getPriorityCardColor = (priority) => {
    switch (priority) {
      case "low":
        return { bg: "#f0fdf4", border: "#22c55e", text: "#166534" };
      case "medium":
        return { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" };
      case "high":
        return { bg: "#fef2f2", border: "#ef4444", text: "#dc2626" };
      case "urgent":
        return { bg: "#fef2f2", border: "#dc2626", text: "#991b1b" };
      default:
        return { bg: "#f3f4f6", border: "#6b7280", text: "#374151" };
    }
  };

  const getStatusCardColor = (status) => {
    // 🔧 NORMALIZE STATUS FOR COLOR MAPPING
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "pending":
        return { bg: "#f8fafc", border: "#64748b", text: "#475569" };
      case "in-progress":
        return { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" };
      case "completed":
        return { bg: "#f0fdf4", border: "#22c55e", text: "#166534" };
      case "cancelled":
        return { bg: "#fef2f2", border: "#ef4444", text: "#dc2626" };
      default:
        return { bg: "#f3f4f6", border: "#6b7280", text: "#374151" };
    }
  };

  const renderDashboardTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Dashboard Cards */}
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

      {/* Progress Overview Card */}
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
            sx={{ mb: 3, color: "#059669", fontWeight: 600 }}
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
                    sx={{ fontWeight: 600, textTransform: "capitalize" }}
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
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
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
                onChange={(e) => handleFilterChange("priority", e.target.value)}
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
          sx={{
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            "&:hover": {
              background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
              boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.3)",
            },
          }}
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
                <strong>Estimated Time</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => {
              // 🔧 GET NORMALIZED STATUS DISPLAY
              const statusDisplay = getStatusDisplay(task.status);
              // 🔧 Get task source information
              const sourceInfo = getTaskSourceInfo(task);

              return (
                <TableRow key={task._id} hover>
                  <TableCell>
                    <Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {task.title}
                        </Typography>
                        {/* 🔧 Show task source chip */}
                        <Chip
                          icon={sourceInfo.icon}
                          label={sourceInfo.label}
                          size="small"
                          sx={{
                            backgroundColor: sourceInfo.color.bg,
                            color: sourceInfo.color.text,
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            "& .MuiChip-icon": {
                              color: sourceInfo.color.text,
                              fontSize: "0.875rem",
                            },
                          }}
                        />
                      </Box>
                      {task.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {task.description.substring(0, 60)}...
                        </Typography>
                      )}
                      {/* 🔧 Only show assignment description when showDescription is true */}
                      {sourceInfo.showDescription && (
                        <Typography
                          variant="caption"
                          sx={{
                            mt: 0.5,
                            display: "block",
                            color: sourceInfo.color.text,
                            fontStyle: "italic",
                          }}
                        >
                          {sourceInfo.description}
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
                    {/* 🔧 Status display */}
                    <Chip
                      icon={statusDisplay.icon}
                      label={statusDisplay.label}
                      color={statusDisplay.color}
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
                    {/* 🕒 Time format */}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatEstimatedTime(task.estimatedHours)}
                    </Typography>
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
                      {canDeleteTask(task) && (
                        <Tooltip title="Delete Task">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(task)}
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
              "&.Mui-selected": { color: "#059669" },
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

        {currentTab === 0 && renderDashboardTab()}
        {currentTab === 1 && renderTasksTab()}

        {/* 🔧 COMPLETE DIALOG IMPLEMENTATION */}
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
              background:
                dialogMode === "view"
                  ? "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
                  : "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              borderBottom:
                dialogMode === "view"
                  ? "1px solid rgba(20, 184, 166, 0.2)"
                  : "1px solid rgba(6, 95, 70, 0.1)",
              color: dialogMode === "view" ? "#ffffff" : "#059669",
              fontWeight: 700,
              fontSize: "1.5rem",
            }}
          >
            {dialogMode === "create" && "Create Personal Task"}
            {dialogMode === "edit" && "Edit Personal Task"}
            {dialogMode === "view" && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                Task Details
                {selectedTask && (
                  <Chip
                    icon={getTaskSourceInfo(selectedTask).icon}
                    label={getTaskSourceInfo(selectedTask).label}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      fontWeight: 600,
                      "& .MuiChip-icon": { color: "#ffffff" },
                    }}
                  />
                )}
              </Box>
            )}
          </DialogTitle>

          <DialogContent sx={{ p: 0, backgroundColor: "#ffffff" }}>
            {dialogMode === "view" && selectedTask ? (
              <Box sx={{ p: 0 }}>
                {/* Task Information Section */}
                <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    <InfoIcon sx={{ color: "#ec4899" }} />
                    <Typography
                      variant="h6"
                      sx={{ color: "#ec4899", fontWeight: 600 }}
                    >
                      Task Information
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#f59e0b",
                        fontWeight: 600,
                        mb: 1,
                        display: "block",
                      }}
                    >
                      TITLE
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "#f8fafc",
                        borderRadius: 1,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedTask.title}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#f59e0b",
                        fontWeight: 600,
                        mb: 1,
                        display: "block",
                      }}
                    >
                      DESCRIPTION
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "#f8fafc",
                        borderRadius: 1,
                        border: "1px solid #e2e8f0",
                        minHeight: "60px",
                      }}
                    >
                      <Typography variant="body1">
                        {selectedTask.description || "No description provided"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Assignment Information Section for non-personal tasks */}
                {getTaskSourceInfo(selectedTask).label !== "Personal" && (
                  <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 3,
                      }}
                    >
                      {getTaskSourceInfo(selectedTask).icon}
                      <Typography
                        variant="h6"
                        sx={{ color: "#059669", fontWeight: 600 }}
                      >
                        Assignment Information
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 3,
                        backgroundColor:
                          getTaskSourceInfo(selectedTask).color.bg,
                        border: `2px solid ${
                          getTaskSourceInfo(selectedTask).color.text
                        }`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: getTaskSourceInfo(selectedTask).color.text,
                          fontWeight: 600,
                        }}
                      >
                        {getTaskSourceInfo(selectedTask).description}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Status & Priority Section */}
                <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    <FlagIcon sx={{ color: "#ec4899" }} />
                    <Typography
                      variant="h6"
                      sx={{ color: "#ec4899", fontWeight: 600 }}
                    >
                      Status & Priority
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: getPriorityCardColor(
                            selectedTask.priority
                          ).bg,
                          border: `2px solid ${
                            getPriorityCardColor(selectedTask.priority).border
                          }`,
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: getPriorityCardColor(selectedTask.priority)
                              .text,
                            fontWeight: 600,
                            mb: 1,
                            display: "block",
                          }}
                        >
                          🏳️ PRIORITY
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: getPriorityCardColor(selectedTask.priority)
                              .text,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {selectedTask.priority}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: getStatusCardColor(
                            selectedTask.status
                          ).bg,
                          border: `2px solid ${
                            getStatusCardColor(selectedTask.status).border
                          }`,
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: getStatusCardColor(selectedTask.status).text,
                            fontWeight: 600,
                            mb: 1,
                            display: "block",
                          }}
                        >
                          📊 STATUS
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: getStatusCardColor(selectedTask.status).text,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {normalizeStatus(selectedTask.status).replace(
                            "-",
                            " "
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Timeline & Details Section */}
                <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    <TimelineIcon sx={{ color: "#ec4899" }} />
                    <Typography
                      variant="h6"
                      sx={{ color: "#ec4899", fontWeight: 600 }}
                    >
                      Timeline & Details
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "#fce7f3",
                          border: "2px solid #ec4899",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#be185d",
                            fontWeight: 600,
                            mb: 1,
                            display: "block",
                          }}
                        >
                          📅 DUE DATE
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: "#be185d", fontWeight: 600 }}
                        >
                          {selectedTask.dueDate
                            ? new Date(selectedTask.dueDate).toLocaleDateString(
                                "en-GB"
                              )
                            : "No due date"}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "#d1fae5",
                          border: "2px solid #22c55e",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#166534",
                            fontWeight: 600,
                            mb: 1,
                            display: "block",
                          }}
                        >
                          ⏱️ ESTIMATED TIME
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: "#166534", fontWeight: 600 }}
                        >
                          {formatEstimatedTime(selectedTask.estimatedHours)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Tags Section */}
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 3,
                      }}
                    >
                      <LabelIcon sx={{ color: "#f59e0b" }} />
                      <Typography
                        variant="h6"
                        sx={{ color: "#f59e0b", fontWeight: 600 }}
                      >
                        Tags
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {selectedTask.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{
                            backgroundColor: "#e0e7ff",
                            color: "#3730a3",
                            fontWeight: 600,
                            border: "1px solid #c7d2fe",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Comments Section */}
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    <ChatIcon sx={{ color: "#14b8a6" }} />
                    <Typography
                      variant="h6"
                      sx={{ color: "#14b8a6", fontWeight: 600 }}
                    >
                      Comments ({selectedTask.comments?.length || 0})
                    </Typography>
                  </Box>

                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment, index) => (
                      <Card
                        key={index}
                        variant="outlined"
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          border: "1px solid #e5e7eb",
                          "&:hover": {
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          },
                        }}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 1,
                            }}
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
                              {comment.author?.firstName?.[0]}
                              {comment.author?.lastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, color: "#374151" }}
                              >
                                {comment.author?.firstName}{" "}
                                {comment.author?.lastName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(comment.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body1" sx={{ ml: 5 }}>
                            {comment.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 4,
                        backgroundColor: "#f8fafc",
                        borderRadius: 2,
                        border: "1px dashed #cbd5e1",
                        mb: 3,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No comments yet
                      </Typography>
                    </Box>
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
                          "&:hover fieldset": { borderColor: "#14b8a6" },
                          "&.Mui-focused fieldset": { borderColor: "#14b8a6" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#14b8a6",
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
                          "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                        fontWeight: 600,
                        borderRadius: 2,
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                          boxShadow: "0 10px 25px -5px rgba(20, 184, 166, 0.3)",
                        },
                      }}
                    >
                      Add Comment
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ pt: 1, p: 4 }}>
                {/* Create/Edit Form */}
                <TextField
                  fullWidth
                  label="Title *"
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
                      "&:hover fieldset": { borderColor: "#059669" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
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
                      "&:hover fieldset": { borderColor: "#059669" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl
                      fullWidth
                      margin="normal"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#059669" },
                          "&.Mui-focused fieldset": { borderColor: "#059669" },
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
                        disabled={
                          dialogMode === "edit" && !selectedTask?.isSelfCreated
                        }
                      >
                        <MenuItem value="low">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label="Low"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Low Priority
                          </Box>
                        </MenuItem>
                        <MenuItem value="medium">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label="Medium"
                              color="warning"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Medium Priority
                          </Box>
                        </MenuItem>
                        <MenuItem value="high">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label="High"
                              color="error"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            High Priority
                          </Box>
                        </MenuItem>
                        <MenuItem value="urgent">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label="Urgent"
                              color="error"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Urgent Priority
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6}>
                    <FormControl
                      fullWidth
                      margin="normal"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#059669" },
                          "&.Mui-focused fieldset": { borderColor: "#059669" },
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              icon={<ScheduleIcon />}
                              label="Pending"
                              color="default"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Pending
                          </Box>
                        </MenuItem>
                        <MenuItem value="in-progress">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              icon={<PlayArrowIcon />}
                              label="In Progress"
                              color="info"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            In Progress
                          </Box>
                        </MenuItem>
                        <MenuItem value="completed">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Completed"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Completed
                          </Box>
                        </MenuItem>
                        <MenuItem value="cancelled">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              icon={<CancelIcon />}
                              label="Cancelled"
                              color="error"
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            Cancelled
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
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
                      disabled={
                        dialogMode === "edit" && !selectedTask?.isSelfCreated
                      }
                      // 🔧 ADD THIS LINE: Restrict to today and future dates only
                      inputProps={{
                        min: new Date().toISOString().split("T")[0],
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#059669" },
                          "&.Mui-focused fieldset": { borderColor: "#059669" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#059669",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    {/* Time Picker Design */}
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 2,
                          color: "#374151",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        Estimated Time
                      </Typography>

                      {/* 🔧 NEW: Show remaining time warning for today */}
                      {isSelectedDateToday() && (
                        <Box
                          sx={{
                            mb: 2,
                            p: 2,
                            backgroundColor: "#fef3c7",
                            borderRadius: 1,
                            border: "1px solid #f59e0b",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#92400e",
                              fontWeight: 600,
                              display: "block",
                            }}
                          >
                            ⏰ Task due today: You have{" "}
                            {getRemainingHoursToday().hours}h{" "}
                            {getRemainingHoursToday().minutes}m left
                          </Typography>
                        </Box>
                      )}

                      {/* 🔧 NEW: Show error if exceeds remaining time */}
                      {exceedsRemainingTime() && (
                        <Box
                          sx={{
                            mb: 2,
                            p: 2,
                            backgroundColor: "#fef2f2",
                            borderRadius: 1,
                            border: "1px solid #ef4444",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#dc2626",
                              fontWeight: 600,
                              display: "block",
                            }}
                          >
                            ❌ You don't have this much time left today!
                            Maximum:{" "}
                            {Math.floor(getRemainingHoursToday().total)}h{" "}
                            {Math.round(
                              (getRemainingHoursToday().total % 1) * 60
                            )}
                            m
                          </Typography>
                        </Box>
                      )}

                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "#f8fafc",
                          border: exceedsRemainingTime()
                            ? "2px solid #ef4444"
                            : "2px solid #e2e8f0",
                          "&:hover": {
                            borderColor: exceedsRemainingTime()
                              ? "#ef4444"
                              : "#059669",
                          },
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={5}>
                            <FormControl fullWidth size="small">
                              <InputLabel
                                sx={{ color: "#059669", fontSize: "0.75rem" }}
                              >
                                HOURS
                              </InputLabel>
                              <Select
                                value={taskForm.estimatedHours}
                                label="HOURS"
                                onChange={(e) => {
                                  const newHours = e.target.value;
                                  const newTotal =
                                    newHours + taskForm.estimatedMinutes / 60;

                                  // 🔧 NEW: Validate against remaining time if today
                                  if (
                                    isSelectedDateToday() &&
                                    newTotal > getRemainingHoursToday().total
                                  ) {
                                    return; // Don't update if it would exceed remaining time
                                  }

                                  setTaskForm({
                                    ...taskForm,
                                    estimatedHours: newHours,
                                  });
                                }}
                                disabled={
                                  dialogMode === "edit" &&
                                  !selectedTask?.isSelfCreated
                                }
                                sx={{
                                  backgroundColor: "#ffffff",
                                  borderRadius: 1,
                                  "& .MuiSelect-select": {
                                    textAlign: "center",
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                  },
                                }}
                              >
                                {hourOptions.map((hour) => {
                                  // 🔧 NEW: Disable hours that would exceed remaining time
                                  const wouldExceed =
                                    isSelectedDateToday() &&
                                    hour + taskForm.estimatedMinutes / 60 >
                                      getRemainingHoursToday().total;

                                  return (
                                    <MenuItem
                                      key={hour}
                                      value={hour}
                                      disabled={wouldExceed}
                                      sx={wouldExceed ? { opacity: 0.3 } : {}}
                                    >
                                      {hour.toString().padStart(2, "0")}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={2} sx={{ textAlign: "center" }}>
                            <Typography
                              variant="h4"
                              sx={{
                                color: "#059669",
                                fontWeight: 700,
                                fontSize: "1.5rem",
                              }}
                            >
                              :
                            </Typography>
                          </Grid>

                          <Grid item xs={5}>
                            <FormControl fullWidth size="small">
                              <InputLabel
                                sx={{ color: "#059669", fontSize: "0.75rem" }}
                              >
                                MINUTES
                              </InputLabel>
                              <Select
                                value={taskForm.estimatedMinutes}
                                label="MINUTES"
                                onChange={(e) => {
                                  const newMinutes = e.target.value;
                                  const newTotal =
                                    taskForm.estimatedHours + newMinutes / 60;

                                  // 🔧 NEW: Validate against remaining time if today
                                  if (
                                    isSelectedDateToday() &&
                                    newTotal > getRemainingHoursToday().total
                                  ) {
                                    return; // Don't update if it would exceed remaining time
                                  }

                                  setTaskForm({
                                    ...taskForm,
                                    estimatedMinutes: newMinutes,
                                  });
                                }}
                                disabled={
                                  dialogMode === "edit" &&
                                  !selectedTask?.isSelfCreated
                                }
                                sx={{
                                  backgroundColor: "#ffffff",
                                  borderRadius: 1,
                                  "& .MuiSelect-select": {
                                    textAlign: "center",
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                  },
                                }}
                              >
                                {minuteOptions.map((minute) => {
                                  // 🔧 NEW: Disable minutes that would exceed remaining time
                                  const wouldExceed =
                                    isSelectedDateToday() &&
                                    taskForm.estimatedHours + minute / 60 >
                                      getRemainingHoursToday().total;

                                  return (
                                    <MenuItem
                                      key={minute}
                                      value={minute}
                                      disabled={wouldExceed}
                                      sx={wouldExceed ? { opacity: 0.3 } : {}}
                                    >
                                      {minute.toString().padStart(2, "0")}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 1, textAlign: "center" }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#f59e0b",
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          >
                            💡{" "}
                            {isSelectedDateToday()
                              ? "Limited by remaining time today"
                              : "Select hours and minutes (max 24:00)"}
                          </Typography>
                        </Box>
                      </Paper>
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
                  margin="normal"
                  helperText="e.g. personal, urgent, learning"
                  disabled={
                    dialogMode === "edit" && !selectedTask?.isSelfCreated
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": { borderColor: "#059669" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
              </Box>
            )}
          </DialogContent>

          {/* Dialog Actions */}
          {dialogMode === "view" ? (
            <DialogActions
              sx={{
                p: 3,
                backgroundColor: "#f0fdfa",
                borderTop: "1px solid rgba(20, 184, 166, 0.2)",
                justifyContent: "center",
              }}
            >
              <Button
                onClick={() => setOpenDialog(false)}
                variant="contained"
                sx={{
                  background:
                    "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 4,
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    boxShadow: "0 10px 25px -5px rgba(20, 184, 166, 0.3)",
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          ) : (
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
                onClick={handleSubmitTask}
                disabled={!taskForm.title}
                sx={{
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                    boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.3)",
                  },
                  "&:disabled": { background: "#d1d5db", color: "#9ca3af" },
                }}
              >
                {dialogMode === "create"
                  ? "Create Personal Task"
                  : "Update Task"}
              </Button>
            </DialogActions>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            Delete Task
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this task?
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "#374151" }}
            >
              "{taskToDelete?.title}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleDeleteConfirm}
              sx={{
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              }}
            >
              Delete Task
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}

export default UserTaskDashboard;
