"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Container,
  Grid,
  Card,
  CardContent,
} from "@mui/material"
import {
  AdminPanelSettings as AdminIcon,
  Assignment as TaskIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as ProfileIcon,
} from "@mui/icons-material"
import API from "../api"
import { useNavigate } from "react-router-dom"
import { startSessionMonitoring, stopSessionMonitoring } from "../utils/SessionManager"
import { disconnectSocket } from "../services/socket"

export default function AdminDashboard() {
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

      if (parsedUser.roleId?.name !== "admin") {
        if (parsedUser.roleId?.name === "manager") {
          navigate("/manager-dashboard")
        } else {
          navigate("/dashboard")
        }
        return
      }

      setUser(parsedUser)
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

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box className="fade-in">
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <AdminIcon sx={{ fontSize: 40, color: "#dc2626" }} />
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 0.5,
                  }}
                >
                  Welcome back, {user.firstName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Chip
                    icon={<AdminIcon />}
                    label="Administrator"
                    sx={{
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      fontWeight: 600,
                      border: "1px solid #fecaca",
                      "& .MuiChip-icon": { color: "#dc2626" },
                    }}
                  />
                  <Typography variant="body1" sx={{ color: "#6b7280" }}>
                    Full system access and control
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(6, 95, 70, 0.1)",
              mb: 4,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 3,
                color: "#059669",
              }}
            >
              Account Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5, fontWeight: 600 }}>
                    Full Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: "#1f2937" }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5, fontWeight: 600 }}>
                    Username
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: "#1f2937" }}>
                    {user.userName}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5, fontWeight: 600 }}>
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: "#1f2937" }}>
                    {user.email}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5, fontWeight: 600 }}>
                    Role
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: "#1f2937" }}>
                    {user.roleId?.displayName || "Administrator"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(6, 95, 70, 0.1)",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    borderColor: "#059669",
                  },
                }}
                onClick={() => navigate("/profile")}
              >
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                  <ProfileIcon sx={{ fontSize: 48, color: "#059669", mb: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: "#1f2937",
                    }}
                  >
                    Profile Settings
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280", lineHeight: 1.6 }}>
                    Update your personal information and account preferences
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(6, 95, 70, 0.1)",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    borderColor: "#059669",
                  },
                }}
                onClick={() => navigate("/role-management")}
              >
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                  <SettingsIcon sx={{ fontSize: 48, color: "#059669", mb: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: "#1f2937",
                    }}
                  >
                    Role Management
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280", lineHeight: 1.6 }}>
                    Configure user roles, permissions, and access controls
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  border: "1px solid rgba(6, 95, 70, 0.1)",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    borderColor: "#059669",
                  },
                }}
                onClick={() => navigate("/user-management")}
              >
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                  <AdminIcon sx={{ fontSize: 48, color: "#059669", mb: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: "#1f2937",
                    }}
                  >
                    User Management
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280", lineHeight: 1.6 }}>
                    View all users, manage accounts, and monitor activity
                  </Typography>
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
              mb: 4,
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                borderColor: "#059669",
              },
            }}
            onClick={() => navigate("/admin-tasks")}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <TaskIcon sx={{ fontSize: 64, color: "#059669" }} />
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: "#1f2937",
                  }}
                >
                  Task Management
                </Typography>
                <Typography variant="body1" sx={{ color: "#6b7280", lineHeight: 1.6 }}>
                  Oversee all tasks, assign work, and monitor progress across teams
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              border: "1px solid rgba(6, 95, 70, 0.1)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: "#1f2937",
              }}
            >
              Session Management
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mb: 3, lineHeight: 1.6 }}>
              Manage your active sessions and account security
            </Typography>
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
                onClick={() => navigate("/sessions")}
                sx={{
                  borderColor: "#059669",
                  color: "#059669",
                  fontWeight: 600,
                  textTransform: "none",
                  px: 3,
                  py: 1.2,
                }}
              >
                Active Devices
              </Button>
              <Button
                variant="contained"
                startIcon={<LogoutIcon />}
                onClick={logout}
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  boxShadow: "0 4px 14px 0 rgba(220, 38, 38, 0.3)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    background: "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)",
                    boxShadow: "0 6px 20px 0 rgba(220, 38, 38, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                Sign Out
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}
