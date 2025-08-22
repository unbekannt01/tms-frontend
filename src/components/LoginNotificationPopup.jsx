"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from "@mui/material"
import {
  Task as TaskIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Notifications as NotificationIcon,
} from "@mui/icons-material"
import { formatDistanceToNow } from "date-fns"

export const LoginNotificationPopup = ({ loginNotifications, onClose }) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (
      loginNotifications &&
      (loginNotifications.popupNotifications?.length > 0 ||
        loginNotifications.overdueTasks?.length > 0 ||
        loginNotifications.tasksDueToday?.length > 0)
    ) {
      setOpen(true)
    }
  }, [loginNotifications])

  const handleClose = () => {
    setOpen(false)
    if (onClose) onClose()
  }

  if (!loginNotifications) return null

  const {
    popupNotifications = [],
    overdueTasks = [],
    tasksDueToday = [],
    welcomeNotification,
    summary = {},
  } = loginNotifications

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "#dc2626"
      case "high":
        return "#ea580c"
      case "medium":
        return "#ca8a04"
      case "low":
        return "#059669"
      default:
        return "#6b7280"
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <NotificationIcon sx={{ color: "#059669", fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "#1f2937" }}>
              {welcomeNotification?.title || "Welcome back!"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
              Here's what's waiting for you
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Summary Stats */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip
            label={`${summary.totalUnread || 0} unread notifications`}
            sx={{
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              fontWeight: 600,
            }}
          />
          {summary.overdueCount > 0 && (
            <Chip
              label={`${summary.overdueCount} overdue tasks`}
              sx={{
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                fontWeight: 600,
              }}
            />
          )}
          {summary.dueTodayCount > 0 && (
            <Chip
              label={`${summary.dueTodayCount} due today`}
              sx={{
                backgroundColor: "#fffbeb",
                color: "#d97706",
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} icon={<WarningIcon />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? "s" : ""}
            </Typography>
            <List dense sx={{ mt: 1 }}>
              {overdueTasks.slice(0, 3).map((task) => (
                <ListItem key={task._id} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <TaskIcon sx={{ fontSize: 20, color: "#dc2626" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    primaryTypographyProps={{ fontSize: "0.875rem" }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItem>
              ))}
              {overdueTasks.length > 3 && (
                <Typography variant="caption" sx={{ color: "#6b7280", pl: 4 }}>
                  +{overdueTasks.length - 3} more overdue tasks
                </Typography>
              )}
            </List>
          </Alert>
        )}

        {/* Tasks Due Today */}
        {tasksDueToday.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }} icon={<WarningIcon />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {tasksDueToday.length} Task{tasksDueToday.length > 1 ? "s" : ""} Due Today
            </Typography>
            <List dense sx={{ mt: 1 }}>
              {tasksDueToday.slice(0, 3).map((task) => (
                <ListItem key={task._id} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <TaskIcon sx={{ fontSize: 20, color: "#d97706" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={`Priority: ${task.priority}`}
                    primaryTypographyProps={{ fontSize: "0.875rem" }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItem>
              ))}
              {tasksDueToday.length > 3 && (
                <Typography variant="caption" sx={{ color: "#6b7280", pl: 4 }}>
                  +{tasksDueToday.length - 3} more tasks due today
                </Typography>
              )}
            </List>
          </Alert>
        )}

        {/* Recent Notifications */}
        {popupNotifications.length > 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "#1f2937" }}>
              Recent Notifications
            </Typography>
            <List>
              {popupNotifications.slice(0, 5).map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: getPriorityColor(notification.priority),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        <TaskIcon sx={{ fontSize: 16 }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "0.8125rem" }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 500 }}
                    />
                  </ListItem>
                  {index < popupNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* No notifications message */}
        {popupNotifications.length === 0 && overdueTasks.length === 0 && tasksDueToday.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckIcon sx={{ fontSize: 64, color: "#10b981", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#1f2937", mb: 1 }}>
              All caught up!
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              No urgent notifications or overdue tasks
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
            },
          }}
        >
          Got it, thanks!
        </Button>
      </DialogActions>
    </Dialog>
  )
}
