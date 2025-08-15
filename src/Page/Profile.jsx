"use client"

import { useState, useEffect } from "react"
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress, Divider } from "@mui/material"
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
    age: "",
  })
  const [initialForm, setInitialForm] = useState(null) // For "no changes" check
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")
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

      const profileData = {
        firstName: parsedUser.firstName || "",
        lastName: parsedUser.lastName || "",
        userName: parsedUser.userName || "",
        email: parsedUser.email || "",
        age: parsedUser.age || "",
      }

      setForm(profileData)
      setInitialForm(profileData) // Keep initial for comparison

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

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    setPasswordError("")
    setPasswordSuccess("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Check if no changes made
    if (JSON.stringify(form) === JSON.stringify(initialForm)) {
      setSuccess("Nothing to update. Redirecting...")
      setTimeout(() => {
        navigate("/dashboard")
      }, 1500)
      return
    }

    setLoading(true)
    try {
      const { data } = await API.put("/users", form)

      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)
      setInitialForm(form) // Update initial values after saving
      setSuccess("Profile updated successfully!")

      setTimeout(() => {
        navigate("/dashboard")
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError("")
    setPasswordSuccess("")

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match")
      setPasswordLoading(false)
      return
    }

    try {
      await API.post("/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })

      setPasswordSuccess("Password changed successfully! All other sessions have been logged out.")

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      setTimeout(() => {
        navigate("/dashboard")
      }, 3000)
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password")
    } finally {
      setPasswordLoading(false)
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
            type="number"
            value={form.age}
            fullWidth
            margin="normal"
            onChange={handleChange}
          />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, py: 1.2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Update Profile"}
          </Button>
        </form>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Change Password
        </Typography>

        {passwordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {passwordSuccess}
          </Alert>
        )}

        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordError}
          </Alert>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <TextField
            label="Current Password"
            name="oldPassword"
            type="password"
            value={passwordForm.oldPassword}
            fullWidth
            margin="normal"
            onChange={handlePasswordChange}
            required
          />

          <TextField
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            fullWidth
            margin="normal"
            onChange={handlePasswordChange}
            required
            helperText="Minimum 6 characters"
          />

          <TextField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordForm.confirmPassword}
            fullWidth
            margin="normal"
            onChange={handlePasswordChange}
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="warning"
            fullWidth
            sx={{ mt: 3, py: 1.2 }}
            disabled={passwordLoading}
          >
            {passwordLoading ? <CircularProgress size={24} /> : "Change Password"}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
