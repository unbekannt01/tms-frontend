"use client"

import { useState, useEffect } from "react"
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from "@mui/material"
import API from "../api"
import { useNavigate } from "react-router-dom"
import { startSessionMonitoring, stopSessionMonitoring } from "../utils/SessionManager"

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    phoneNumber: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const sessionId = localStorage.getItem("sessionId")

    if (!userData || !sessionId) {
      navigate("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      setForm({
        firstName: parsedUser.firstName || "",
        lastName: parsedUser.lastName || "",
        userName: parsedUser.userName || "",
        email: parsedUser.email || "",
        age: parsedUser.age || "",
      })

      // Start session monitoring
      startSessionMonitoring()
    } catch (error) {
      localStorage.clear()
      navigate("/login")
      return
    }

    setInitialLoading(false)

    return () => {
      stopSessionMonitoring()
    }
  }, [navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError("")
    setSuccess("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { data } = await API.put("/users", form)

      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)

      setSuccess("Profile updated successfully!")

      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard")
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
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
        py: 2,
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
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </Button>

        <Typography variant="h5" sx={{ mb: 3 }}>
          Update Profile
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="First Name"
            name="firstName"
            type="text"
            value={form.firstName}
            fullWidth
            margin="normal"
            onChange={handleChange}
            required
          />

          <TextField
            label="Last Name"
            name="lastName"
            type="text"
            value={form.lastName}
            fullWidth
            margin="normal"
            onChange={handleChange}
            required
          />

          <TextField
            label="Username"
            name="userName"
            type="text"
            value={form.userName}
            fullWidth
            margin="normal"
            onChange={handleChange}
            required
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            fullWidth
            margin="normal"
            onChange={handleChange}
            required
          />

          <TextField
            label="Age"
            name="age"
            type="age"
            value={form.age}
            fullWidth
            margin="normal"
            onChange={handleChange}
          />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, py: 1.2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Update Profile"}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
