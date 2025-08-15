/* eslint-disable no-unused-vars */
"use client"

import { useEffect, useState } from "react"
import { Box, Paper, Typography, Button, CircularProgress, Chip } from "@mui/material"
import API from "../api"
import { useNavigate } from "react-router-dom"
import { startSessionMonitoring, stopSessionMonitoring } from "../utils/SessionManager"

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const sessionId = localStorage.getItem("sessionId")

    if (!userData || !sessionId) {
      navigate("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)

      if (parsedUser.roleId?.name === "admin") {
        navigate("/admin-dashboard")
        return
      } else if (parsedUser.roleId?.name === "manager") {
        navigate("/manager-dashboard")
        return
      }

      setUser(parsedUser)

      // Start session monitoring
      startSessionMonitoring()
    } catch (error) {
      localStorage.clear()
      navigate("/login")
      return
    }

    setLoading(false)

    return () => {
      stopSessionMonitoring()
    }
  }, [navigate])

  const logout = async () => {
    try {
      await API.post("/users/logout")
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      stopSessionMonitoring()
      localStorage.clear()
      navigate("/")
    }
  }

  const viewSessions = () => {
    navigate("/sessions")
  }

  if (loading) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#121212",
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 5,
          borderRadius: 4,
          textAlign: "center",
          maxWidth: 600,
          width: "100%",
          color: "#000",
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: "#2e7d32" }}>
          Welcome to User Dashboard, {user.firstName}!
        </Typography>
        <Typography variant="h6" sx={{ mb: 2, color: "#2e7d32" }}>
          {user.roleId?.displayName || "Regular User"}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, fontStyle: "italic" }}>
          {user.roleId?.description || "Basic user with limited permissions"}
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Name:</strong> {user.firstName} {user.lastName}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Username:</strong> {user.userName}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Email:</strong> {user.email}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          <strong>Role:</strong> {user.roleId?.name?.toUpperCase() || "USER"}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="outlined" sx={{ py: 1.2 }} onClick={() => navigate("/profile")}>
            Edit Profile
          </Button>
          <Button variant="outlined" sx={{ py: 1.2 }}>
            Manage Sessions - Upcoming Feature...
          </Button>
          <Button variant="outlined" sx={{ py: 1.2 }} onClick={logout}>
            Logout
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
