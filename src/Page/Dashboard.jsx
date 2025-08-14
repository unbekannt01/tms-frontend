/* eslint-disable no-unused-vars */
"use client"

import { useEffect, useState } from "react"
import { Box, Paper, Typography, Button, CircularProgress } from "@mui/material"
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
    const accessToken = localStorage.getItem("accessToken") // <CHANGE> Check for JWT token

    if (!userData || !sessionId) {
      navigate("/login")
      return
    }

    // <CHANGE> Check if JWT token exists and is not expired
    if (accessToken) {
      const tokenExpiresAt = localStorage.getItem("tokenExpiresAt")
      if (tokenExpiresAt && new Date() > new Date(tokenExpiresAt)) {
        // Token expired, redirect to login
        localStorage.clear()
        navigate("/login?reason=token_expired")
        return
      }
    }

    try {
      const parsedUser = JSON.parse(userData)
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
      // <CHANGE> Send logout request with both session and JWT token
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
          maxWidth: 500,
          width: "100%",
          color: "#000",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to World, {user.firstName}!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Name:</strong> {user.firstName} {user.lastName}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Username:</strong> {user.userName}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          <strong>Email:</strong> {user.email}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          {/* <Button variant="outlined" sx={{ py: 1.2 }} onClick={viewSessions}>
            Manage Sessions
          </Button> */}
          <Button variant="outlined" sx={{ py: 1.2 }} onClick={logout}>
            Logout
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}