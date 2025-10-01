"use client"

import { useEffect, useState } from "react"
import { Box, Paper, Typography, Button, CircularProgress, Chip, Card, CardContent, Grid, Avatar } from "@mui/material"
import API from "../api"
import { useNavigate } from "react-router-dom"
import { startSessionMonitoring, stopSessionMonitoring } from "../utils/SessionManager"
import { disconnectSocket } from "../services/socket"

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
      try {
        disconnectSocket()
      } catch {}
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
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#059669" }} />
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
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            mb: 3,
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.3)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={user.avatar?.url}
                sx={{
                  width: 60,
                  height: 60,
                  fontSize: "1.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                {!user.avatar?.url && `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}
              </Avatar>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.75rem", md: "2.125rem" },
                }}
              >
                Welcome back, {user.firstName}!
              </Typography>
            </Box>
            <Chip
              label={user.roleId?.displayName || "Regular User"}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            />
          </Box>
          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              fontSize: "1.1rem",
            }}
          >
            {user.roleId?.description || "Ready to manage your tasks efficiently"}
          </Typography>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid rgba(6, 95, 70, 0.1)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#059669",
                    fontWeight: 600,
                  }}
                >
                  Personal Information
                </Typography>
                <Box sx={{ space: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1.5, color: "#374151" }}>
                    <strong style={{ color: "#1f2937" }}>Name:</strong> {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1.5, color: "#374151" }}>
                    <strong style={{ color: "#1f2937" }}>Username:</strong> {user.userName}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#374151" }}>
                    <strong style={{ color: "#1f2937" }}>Email:</strong> {user.email}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid rgba(6, 95, 70, 0.1)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#059669",
                    fontWeight: 600,
                  }}
                >
                  Account Details
                </Typography>
                <Box sx={{ space: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1.5, color: "#374151" }}>
                    <strong style={{ color: "#1f2937" }}>Role:</strong> {user.roleId?.name?.toUpperCase() || "USER"}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1.5, color: "#374151" }}>
                    <strong style={{ color: "#1f2937" }}>Status:</strong>{" "}
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontSize: "0.75rem",
                      }}
                    />
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid rgba(6, 95, 70, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              color: "#1f2937",
              fontWeight: 600,
            }}
          >
            Quick Actions
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 3, justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={() => navigate("/user-tasks")}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                boxShadow: "0 4px 14px 0 rgba(5, 150, 105, 0.3)",
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                  boxShadow: "0 6px 20px 0 rgba(5, 150, 105, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              View Tasks
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/chat")}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 2,
                borderColor: "#059669",
                color: "#059669",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Open Chat
            </Button>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate("/profile")}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 2,
                borderColor: "#059669",
                color: "#059669",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#047857",
                  backgroundColor: "rgba(5, 150, 105, 0.04)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Edit Profile
            </Button>
            <Button
              variant="outlined"
              onClick={viewSessions}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 2,
                borderColor: "#059669",
                color: "#059669",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Active Devices
            </Button>
            <Button
              variant="outlined"
              onClick={logout}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 2,
                borderColor: "#dc2626",
                color: "#dc2626",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#b91c1c",
                  backgroundColor: "rgba(220, 38, 38, 0.04)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
