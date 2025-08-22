"use client"

import { useState } from "react"
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Avatar,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material"
import {
  Notifications as NotificationIcon,
  NotificationsNone as NotificationOffIcon,
  Task as TaskIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  MarkEmailRead as ReadIcon,
} from "@mui/icons-material"
import { useNotifications } from "./NotificationProvider"
import { formatDistanceToNow } from "date-fns"

const getNotificationIcon = (type) => {
  switch (type) {
    case "task_assigned":
    case "task_updated":
    case "task_completed":
      return <TaskIcon sx={{ fontSize: 20 }} />
    case "task_due_soon":
    case "task_overdue":
      return <WarningIcon sx={{ fontSize: 20 }} />
    case "login_welcome":
      return <InfoIcon sx={{ fontSize: 20 }} />
    case "system_alert":
      return <InfoIcon sx={{ fontSize: 20 }} />
    default:
      return <InfoIcon sx={{ fontSize: 20 }} />
  }
}

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

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isConnected } = useNotifications()
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
    }

    // Navigate to related task if applicable
    if (notification.relatedTask) {
      // You can add navigation logic here
      console.log("[v0] Navigate to task:", notification.relatedTask)
    }
  }

  const recentNotifications = notifications.slice(0, 10)

  return (
    <>
      <Tooltip title={isConnected ? "Notifications (Live)" : "Notifications (Offline)"}>
        <IconButton
          onClick={handleClick}
          sx={{
            position: "relative",
            color: isConnected ? "#059669" : "#6b7280",
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#dc2626",
                color: "white",
                fontWeight: 600,
              },
            }}
          >
            {unreadCount > 0 ? <NotificationIcon /> : <NotificationOffIcon />}
          </Badge>
          {isConnected && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#10b981",
                border: "2px solid white",
              }}
            />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1,
            borderRadius: 2,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1f2937" }}>
              Notifications
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isConnected && (
                <Chip
                  label="Live"
                  size="small"
                  sx={{
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    fontSize: "0.75rem",
                    height: 20,
                  }}
                />
              )}
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                {unreadCount} unread
              </Typography>
            </Box>
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={markAllAsRead}
              startIcon={<ReadIcon />}
              sx={{
                textTransform: "none",
                fontSize: "0.875rem",
                color: "#059669",
                "&:hover": { backgroundColor: "rgba(5, 150, 105, 0.04)" },
              }}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        {recentNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <NotificationOffIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
            {recentNotifications.map((notification) => (
              <MenuItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  p: 2,
                  borderLeft: `3px solid ${getPriorityColor(notification.priority)}`,
                  backgroundColor: notification.isRead ? "transparent" : "rgba(5, 150, 105, 0.02)",
                  "&:hover": {
                    backgroundColor: notification.isRead ? "rgba(0, 0, 0, 0.04)" : "rgba(5, 150, 105, 0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: getPriorityColor(notification.priority),
                      color: "white",
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.isRead ? 500 : 600,
                          color: notification.isRead ? "#6b7280" : "#1f2937",
                          fontSize: "0.875rem",
                          lineHeight: 1.3,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification._id)
                        }}
                        sx={{ ml: 1, opacity: 0.6, "&:hover": { opacity: 1 } }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                          fontSize: "0.8125rem",
                          lineHeight: 1.4,
                          mb: 0.5,
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#9ca3af",
                            fontSize: "0.75rem",
                          }}
                        >
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                        {!notification.isRead && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: getPriorityColor(notification.priority),
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </MenuItem>
            ))}
          </Box>
        )}

        {notifications.length > 10 && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Button
                size="small"
                sx={{
                  textTransform: "none",
                  color: "#059669",
                  "&:hover": { backgroundColor: "rgba(5, 150, 105, 0.04)" },
                }}
              >
                View all notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  )
}
