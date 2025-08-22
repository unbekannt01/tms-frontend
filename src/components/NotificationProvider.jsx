"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import API from "../api"

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Initialize socket connection
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken")
    const user = JSON.parse(localStorage.getItem("user") || "{}")

    if (accessToken && user._id) {
      console.log("[v0] Initializing Socket.IO connection...")

      const socketInstance = io("https://nodejs-migration.onrender.com", {
        auth: {
          token: accessToken,
        },
        transports: ["websocket", "polling"],
      })

      socketInstance.on("connect", () => {
        console.log("[v0] Socket.IO connected successfully")
        setIsConnected(true)
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("[v0] Socket.IO disconnected:", reason)
        setIsConnected(false)
      })

      // Handle new notifications
      socketInstance.on("notification:new", (data) => {
        console.log("[v0] New notification received:", data.notification)
        setNotifications((prev) => [data.notification, ...prev])
        setUnreadCount((prev) => prev + 1)

        // Show browser notification if permission granted
        if (Notification.permission === "granted" && data.notification.showAsPopup) {
          new Notification(data.notification.title, {
            body: data.notification.message,
            icon: "/favicon.ico",
          })
        }
      })

      // Handle notification count updates
      socketInstance.on("notification:count_updated", (data) => {
        if (data.action === "increment") {
          setUnreadCount((prev) => prev + 1)
        } else if (data.action === "decrement") {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      })

      // Handle notification marked as read
      socketInstance.on("notification:marked_read", (data) => {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === data.notificationId ? { ...notif, isRead: true, readAt: data.timestamp } : notif,
          ),
        )
      })

      // Handle task updates
      socketInstance.on("task:assigned", (data) => {
        console.log("[v0] Task assigned:", data)
      })

      socketInstance.on("task:updated", (data) => {
        console.log("[v0] Task updated:", data)
      })

      socketInstance.on("task:comment_added", (data) => {
        console.log("[v0] Task comment added:", data)
      })

      setSocket(socketInstance)

      return () => {
        console.log("[v0] Cleaning up Socket.IO connection")
        socketInstance.disconnect()
      }
    }
  }, [])

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await API.get("/notifications?limit=50")
        setNotifications(response.data.notifications || [])

        const unreadResponse = await API.get("/notifications/stats")
        setUnreadCount(unreadResponse.data.totalUnread || 0)
      } catch (error) {
        console.error("[v0] Error fetching notifications:", error)
      }
    }

    const accessToken = localStorage.getItem("accessToken")
    if (accessToken) {
      fetchNotifications()
    }
  }, [])

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`)
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === notificationId ? { ...notif, isRead: true, readAt: new Date() } : notif)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      // Emit to socket for real-time sync
      if (socket) {
        socket.emit("notification:read", { notificationId })
      }
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all")
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true, readAt: new Date() })))
      setUnreadCount(0)
    } catch (error) {
      console.error("[v0] Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`)
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId))

      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find((n) => n._id === notificationId)
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("[v0] Error deleting notification:", error)
    }
  }

  const value = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    socket,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
