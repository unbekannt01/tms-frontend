"use client"

import { useEffect, useState } from "react"
import { Box, Paper, Typography, Button, CircularProgress } from "@mui/material"
import API from "../api"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!userData || !token) {
      navigate("/login")
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.clear()
      navigate("/login")
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const logout = async () => {
    try {
      await API.post("/users/logout")
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      localStorage.clear()
      navigate("/")
    }
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
        <Button variant="outlined" sx={{ mt: 3, py: 1.2 }} onClick={logout}>
          Logout
        </Button>
      </Paper>
    </Box>
  )
}
