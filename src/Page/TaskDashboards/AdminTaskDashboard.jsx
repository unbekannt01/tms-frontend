"use client"

import { useState, useEffect } from "react"
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
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  Tab,
  Tabs,
  Badge,
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material"
import API from "../../api"
import { useNavigate } from "react-router-dom"
import { enhanceTaskDescription } from "../../services/aiService"
import CircularProgress from "@mui/material/CircularProgress"
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"

const priorityColors = {
  low: "success",
  medium: "warning",
  high: "error",
  urgent: "error",
}

// 🔧 FIXED STATUS MAPPING - Handle both "todo" and "pending"
const statusColors = {
  pending: "default",
  todo: "default", // Map "todo" to same as "pending"
  "in-progress": "info",
  completed: "success",
  cancelled: "error",
}

const statusIcons = {
  pending: <ScheduleIcon />,
  todo: <ScheduleIcon />, // Map "todo" to same as "pending"
  "in-progress": <PlayArrowIcon />,
  completed: <CheckCircleIcon />,
  cancelled: <CancelIcon />,
}

// 🔧 STATUS NORMALIZATION FUNCTION
const normalizeStatus = (status) => {
  // Convert "todo" to "pending" for display consistency
  if (status === "todo") return "pending"
  return status || "pending"
}

// 🔧 STATUS DISPLAY FUNCTION
const getStatusDisplay = (status) => {
  const normalized = normalizeStatus(status)
  return {
    label: normalized.replace("-", " "),
    color: statusColors[normalized] || statusColors.pending,
    icon: statusIcons[normalized] || statusIcons.pending,
  }
}

export default function AdminTaskDashboard({ user }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentTab, setCurrentTab] = useState(0)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
  })

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState("create")
  const [selectedTask, setSelectedTask] = useState(null)

  // Form state with separate hours and minutes
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
    tags: "",
    estimatedHours: 0,
    estimatedMinutes: 0,
    status: "pending", // 🔧 ALWAYS DEFAULT TO "pending"
  })

  // Users and stats
  const [users, setUsers] = useState([])
  const [taskStats, setTaskStats] = useState(null)
  const [teamStats, setTeamStats] = useState([])

  // Bulk operations
  const [selectedTasks, setSelectedTasks] = useState([])
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null)
  const [enhancing, setEnhancing] = useState(false)

  async function handleEnhanceDescription() {
    try {
      if (!taskForm?.description || !taskForm.description.trim()) {
        window.alert("Please enter a description to enhance.")
        return
      }
      setEnhancing(true)
      const res = await enhanceTaskDescription({
        title: taskForm.title || "",
        description: taskForm.description,
      })
      const enhanced = res?.enhancedDescription || ""
      if (!enhanced) {
        window.alert("AI enhancement did not return a result.")
        return
      }
      setTaskForm({ ...taskForm, description: enhanced })
    } catch (err) {
      console.error("[v0] AI enhance failed:", err)
      window.alert("Unable to enhance description right now.")
    } finally {
      setEnhancing(false)
    }
  }

  // Calculate remaining hours in today
  const getRemainingHoursToday = () => {
    const now = new Date()
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const remainingMs = endOfDay.getTime() - now.getTime()
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

    return {
      hours: remainingHours,
      minutes: remainingMinutes,
      total: remainingHours + remainingMinutes / 60,
    }
  }

  // Check if selected date is today
  const isSelectedDateToday = () => {
    if (!taskForm.dueDate) return false
    const selectedDate = new Date(taskForm.dueDate)
    const today = new Date()
    return selectedDate.toDateString() === today.toDateString()
  }

  // Get current estimated time in hours
  const getCurrentEstimatedHours = () => {
    return taskForm.estimatedHours + taskForm.estimatedMinutes / 60
  }

  // Check if estimated time exceeds remaining time
  const exceedsRemainingTime = () => {
    if (!isSelectedDateToday()) return false
    const remaining = getRemainingHoursToday()
    const estimated = getCurrentEstimatedHours()
    return estimated > remaining.total
  }

  // 🔧 FIXED: Proper overdue logic - today's tasks are not overdue until after midnight
  const isTaskOverdue = (task) => {
    if (!task.dueDate || task.status === "completed") return false

    const dueDate = new Date(task.dueDate)
    const now = new Date()

    // Set due date to end of that day (11:59:59 PM)
    const endOfDueDate = new Date(dueDate)
    endOfDueDate.setHours(23, 59, 59, 999)

    // Task is overdue only if current time is past the end of due date
    return now > endOfDueDate
  }

  useEffect(() => {
    fetchTasks()
    fetchUsers()
    fetchTaskStats()
    fetchTeamStats()
  }, [page, filters, currentTab])

  // // 🔧 ADD AUTO-DISMISS NOTIFICATIONS
  // useEffect(() => {
  //   if (success) {
  //     const timer = setTimeout(() => {
  //       setSuccess("");
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [success]);

  // useEffect(() => {
  //   if (error) {
  //     const timer = setTimeout(() => {
  //       setError("");
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [error]);

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })

      // Admin can see all tasks
      const { data } = await API.get(`/tasks?${params}`)

      // 🔧 NORMALIZE STATUS IN FETCHED TASKS
      const normalizedTasks = (data.tasks || []).map((task) => ({
        ...task,
        status: normalizeStatus(task.status),
      }))

      setTasks(normalizedTasks)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/users")
      setUsers(Array.isArray(data) ? data : data.users || [])
    } catch (err) {
      console.error("Failed to fetch users:", err)
    }
  }

  const fetchTaskStats = async () => {
    try {
      const { data } = await API.get("/tasks/stats")
      setTaskStats(data)
    } catch (err) {
      console.error("Failed to fetch task stats:", err)
    }
  }

  const fetchTeamStats = async () => {
    try {
      const { data } = await API.get("/tasks/team-stats")
      setTeamStats(data || [])
    } catch (err) {
      console.error("Failed to fetch team stats:", err)
    }
  }

  const handleCreateTask = () => {
    // 🔧 ALWAYS SET DEFAULT STATUS TO "pending", NEVER "todo"
    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      priority: "medium",
      tags: "",
      estimatedHours: 0,
      estimatedMinutes: 0,
      status: "pending", // 🔧 EXPLICITLY SET TO "pending"
    })
    setDialogMode("create")
    setOpenDialog(true)
  }

  const handleEditTask = (task) => {
    // 🔧 NORMALIZE STATUS WHEN EDITING
    const normalizedStatus = normalizeStatus(task.status)

    // 🕒 FIXED: Convert decimal hours to hours and minutes for editing
    const totalHours = task.estimatedHours || 0
    const hours = Math.floor(totalHours)
    const minutes = Math.round((totalHours - hours) * 60)

    setTaskForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T") : "",
      priority: task.priority,
      tags: task.tags?.join(", ") || "",
      estimatedHours: hours,
      estimatedMinutes: minutes,
      status: normalizedStatus, // 🔧 USE NORMALIZED STATUS
    })
    setSelectedTask(task)
    setDialogMode("edit")
    setOpenDialog(true)
  }

  const handleSubmitTask = async () => {
    try {
      if (exceedsRemainingTime()) {
        setError("Not enough time left today for this task!")
        return
      }
      // 🕒 FIXED: Convert hours and minutes to decimal hours for backend
      const totalEstimatedHours = taskForm.estimatedHours + taskForm.estimatedMinutes / 60

      const formData = {
        ...taskForm,
        tags: taskForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        estimatedHours: totalEstimatedHours > 0 ? totalEstimatedHours : undefined,
        // 🔧 ENSURE STATUS IS ALWAYS "pending" FOR NEW TASKS
        status: dialogMode === "create" ? "pending" : taskForm.status,
      }

      // Remove the separate minutes field
      delete formData.estimatedMinutes

      if (dialogMode === "create") {
        await API.post("/tasks", formData)
        setSuccess("Task created successfully!")
      } else {
        await API.put(`/tasks/${selectedTask._id}`, formData)
        setSuccess("Task updated successfully!")
      }

      setOpenDialog(false)
      fetchTasks()
      fetchTaskStats()
      fetchTeamStats()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save task")
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return

    try {
      await API.delete(`/tasks/${taskId}`)
      setSuccess("Task deleted successfully!")
      fetchTasks()
      fetchTaskStats()
      fetchTeamStats()
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task")
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) return

    try {
      await Promise.all(selectedTasks.map((taskId) => API.delete(`/tasks/${taskId}`)))
      setSuccess(`Deleted ${selectedTasks.length} tasks`)
      setSelectedTasks([])
      setBulkMenuAnchor(null)
      fetchTasks()
      fetchTaskStats()
      fetchTeamStats()
    } catch (err) {
      setError("Failed to delete tasks")
    }
  }

  // Generate hour options (0-24)
  const hourOptions = Array.from({ length: 25 }, (_, i) => i)

  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45]

  // 🕒 CONSISTENT TIME FORMATTING FUNCTION
  const formatEstimatedTime = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) {
      return "0h 0m"
    }

    const totalMinutes = Math.round(decimalHours * 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${hours}h ${minutes}m`
  }

  const renderOverviewTab = () => (
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
              Total Tasks
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
              Overdue Tasks
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
              {users.length}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Total Users
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
              {taskStats?.statusBreakdown?.find((s) => s._id === "completed")?.count || 0}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Completed Tasks
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
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
            {teamStats.map((member, index) => (
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
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        fontSize: "1.5rem",
                        fontWeight: 600,
                      }}
                    >
                      {member.name}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#1f2937", mb: 1 }}>
                      {member.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
                      {member.totalTasks} tasks • {member.completedTasks} completed
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`${Math.round((member.completedTasks / member.totalTasks) * 100) || 0}% Complete`}
                        sx={{
                          backgroundColor: member.completedTasks / member.totalTasks > 0.8 ? "#dcfce7" : "#fef3c7",
                          color: member.completedTasks / member.totalTasks > 0.8 ? "#166534" : "#92400e",
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
  )

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
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
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
              <InputLabel>Assigned To</InputLabel>
              <Select
                value={filters.assignedTo}
                label="Assigned To"
                onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {selectedTasks.length > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<MoreVertIcon />}
                onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                sx={{
                  borderColor: "#059669",
                  color: "#059669",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#047857",
                    backgroundColor: "rgba(5, 150, 105, 0.04)",
                  },
                }}
              >
                Bulk Actions ({selectedTasks.length})
              </Button>
              <Menu anchorEl={bulkMenuAnchor} open={Boolean(bulkMenuAnchor)} onClose={() => setBulkMenuAnchor(null)}>
                <MenuItem onClick={handleBulkDelete} sx={{ color: "error.main" }}>
                  <ListItemIcon>
                    <DeleteIcon color="error" />
                  </ListItemIcon>
                  <ListItemText>Delete Selected</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}

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
            Create Task
          </Button>
        </Box>
      </Box>

      {/* Tasks Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedTasks.length > 0 && selectedTasks.length < tasks.length}
                  checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTasks(tasks.map((task) => task._id))
                    } else {
                      setSelectedTasks([])
                    }
                  }}
                  sx={{
                    color: "#059669",
                    "&.Mui-checked": {
                      color: "#059669",
                    },
                    "&.MuiCheckbox-indeterminate": {
                      color: "#059669",
                    },
                  }}
                />
              </TableCell>
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
              const statusDisplay = getStatusDisplay(task.status)

              return (
                <TableRow key={task._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedTasks.includes(task._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTasks([...selectedTasks, task._id])
                        } else {
                          setSelectedTasks(selectedTasks.filter((id) => id !== task._id))
                        }
                      }}
                      sx={{
                        color: "#059669",
                        "&.Mui-checked": {
                          color: "#059669",
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {task.title}
                      </Typography>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {task.description.substring(0, 60)}...
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem" }}>
                        {task.assignedTo?.firstName}
                        {task.assignedTo?.lastName}
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
                    {/* 🔧 FIXED STATUS DISPLAY - Always shows "pending" not "todo" */}
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
                        <Typography variant="body2">{new Date(task.dueDate).toLocaleDateString()}</Typography>
                        {new Date(task.dueDate) < new Date() && task.status !== "completed" && (
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
                    {/* 🕒 CONSISTENT TIME FORMAT IN TABLE */}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatEstimatedTime(task.estimatedHours)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit Task">
                        <IconButton size="small" onClick={() => handleEditTask(task)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Task">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTask(task._id)}
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
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, newPage) => setPage(newPage)} color="primary" />
        </Box>
      )}
    </Box>
  )

  if (loading) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        }}
      >
        <Typography variant="h6" sx={{ color: "#059669" }}>
          Loading...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
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
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
                <AnalyticsIcon />
                Overview
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentIcon />
                All Tasks
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

        {currentTab === 0 && renderOverviewTab()}
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
            {dialogMode === "create" ? "Create New Task" : "Edit Task"}
          </DialogTitle>
          <DialogContent sx={{ p: 4, backgroundColor: "#ffffff" }}>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Title *"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
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
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
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
              {/* after the Description TextField, add the Enhance with AI button */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Tooltip title="Use AI to improve and structure your description">
                  <span>
                    <Button
                      variant="outlined"
                      onClick={handleEnhanceDescription}
                      disabled={enhancing || !taskForm?.description?.trim()}
                      startIcon={enhancing ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "#059669",
                        color: "#065f46",
                        "&:hover": { borderColor: "#047857", backgroundColor: "#ecfdf5" },
                      }}
                    >
                      {enhancing ? "Enhancing..." : "Enhance with AI"}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
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
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
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
                  {!users || users.length === 0 ? (
                    <MenuItem disabled>
                      <Typography color="text.secondary">No users available</Typography>
                    </MenuItem>
                  ) : (
                    users.map((userOption) => (
                      <MenuItem
                        key={userOption._id}
                        value={userOption._id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(5, 150, 105, 0.04)",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: "0.875rem",
                              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            }}
                          >
                            {userOption.firstName}
                            {userOption.lastName}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {userOption.firstName} {userOption.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{userOption.userName}
                              {userOption.role ? ` • ${userOption.role}` : ""}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={dialogMode === "create" ? 12 : 6}>
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
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <MenuItem value="low">
                        <Chip label="Low" color="success" size="small" sx={{ mr: 1 }} />
                        Low Priority
                      </MenuItem>
                      <MenuItem value="medium">
                        <Chip label="Medium" color="warning" size="small" sx={{ mr: 1 }} />
                        Medium Priority
                      </MenuItem>
                      <MenuItem value="high">
                        <Chip label="High" color="error" size="small" sx={{ mr: 1 }} />
                        High Priority
                      </MenuItem>
                      <MenuItem value="urgent">
                        <Chip label="Urgent" color="error" size="small" sx={{ mr: 1 }} />
                        Urgent Priority
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {dialogMode === "edit" && (
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
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={taskForm.status}
                        label="Status"
                        onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      >
                        {/* 🔧 FIXED STATUS OPTIONS - Only show "pending" not "todo" */}
                        <MenuItem value="pending">
                          <Chip icon={<ScheduleIcon />} label="Pending" color="default" size="small" sx={{ mr: 1 }} />
                          Pending
                        </MenuItem>
                        <MenuItem value="in-progress">
                          <Chip icon={<PlayArrowIcon />} label="In Progress" color="info" size="small" sx={{ mr: 1 }} />
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
                          <Chip icon={<CancelIcon />} label="Cancelled" color="error" size="small" sx={{ mr: 1 }} />
                          Cancelled
                        </MenuItem>
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
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    // 🔧 ADD THIS LINE: Restrict to today and future dates only
                    inputProps={{ min: new Date().toISOString().split("T")[0] }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": { borderColor: "#059669" },
                        "&.Mui-focused fieldset": { borderColor: "#059669" },
                      },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
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
                    {/* 🔧 UPDATED: Better warning message */}
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
                          ⏰ Task due today: {getRemainingHoursToday().hours}h {getRemainingHoursToday().minutes}m left
                          until midnight
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
                          ❌ Not enough time left today! Maximum: {Math.floor(getRemainingHoursToday().total)}h{" "}
                          {Math.round((getRemainingHoursToday().total % 1) * 60)}m
                        </Typography>
                      </Box>
                    )}

                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#f8fafc",
                        border: exceedsRemainingTime() ? "2px solid #ef4444" : "2px solid #e2e8f0",
                        "&:hover": {
                          borderColor: exceedsRemainingTime() ? "#ef4444" : "#059669",
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={5}>
                          <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: "#059669", fontSize: "0.75rem" }}>HOURS</InputLabel>
                            <Select
                              value={taskForm.estimatedHours}
                              label="HOURS"
                              onChange={(e) => {
                                const newHours = e.target.value
                                const newTotal = newHours + taskForm.estimatedMinutes / 60

                                // 🔧 NEW: Validate against remaining time if today
                                if (isSelectedDateToday() && newTotal > getRemainingHoursToday().total) {
                                  return // Don't update if it would exceed remaining time
                                }

                                setTaskForm({
                                  ...taskForm,
                                  estimatedHours: newHours,
                                })
                              }}
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
                                  hour + taskForm.estimatedMinutes / 60 > getRemainingHoursToday().total

                                return (
                                  <MenuItem
                                    key={hour}
                                    value={hour}
                                    disabled={wouldExceed}
                                    sx={wouldExceed ? { opacity: 0.3 } : {}}
                                  >
                                    {hour.toString().padStart(2, "0")}
                                  </MenuItem>
                                )
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
                            <InputLabel sx={{ color: "#059669", fontSize: "0.75rem" }}>MINUTES</InputLabel>
                            <Select
                              value={taskForm.estimatedMinutes}
                              label="MINUTES"
                              onChange={(e) => {
                                const newMinutes = e.target.value
                                const newTotal = taskForm.estimatedHours + newMinutes / 60

                                // 🔧 NEW: Validate against remaining time if today
                                if (isSelectedDateToday() && newTotal > getRemainingHoursToday().total) {
                                  return // Don't update if it would exceed remaining time
                                }

                                setTaskForm({
                                  ...taskForm,
                                  estimatedMinutes: newMinutes,
                                })
                              }}
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
                                  taskForm.estimatedHours + minute / 60 > getRemainingHoursToday().total

                                return (
                                  <MenuItem
                                    key={minute}
                                    value={minute}
                                    disabled={wouldExceed}
                                    sx={wouldExceed ? { opacity: 0.3 } : {}}
                                  >
                                    {minute.toString().padStart(2, "0")}
                                  </MenuItem>
                                )
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
                onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
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
                  background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                  boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.3)",
                },
                "&:disabled": {
                  background: "#d1d5db",
                  color: "#9ca3af",
                },
              }}
            >
              {dialogMode === "create" ? "Create Task" : "Update Task"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  )
}
