"use client"

import { useState, useEffect } from "react"
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress, Link } from "@mui/material"
import API from "../Api"
import { useNavigate, useLocation } from "react-router-dom"
import { startSessionMonitoring } from "../utils/SessionManager"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    emailOrUserName: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("")

  useEffect(() => {
    // Check if user was redirected due to session expiration
    const urlParams = new URLSearchParams(location.search)
    if (urlParams.get("reason") === "session_expired") {
      setSessionExpiredMessage("Your session has expired. Please login again.")
    }
  }, [location])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSessionExpiredMessage("")

    try {
      const { data } = await API.post("/users/login", form)

      // Store both JWT token and session ID
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("sessionId", data.sessionId)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("loginTime", Date.now().toString())

      // Start session monitoring
      startSessionMonitoring()

      navigate("/dashboard")
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.code === "SESSION_LIMIT_EXCEEDED") {
        setError("Maximum session limit reached. Your oldest session has been logged out.")
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(err.response?.data?.message || "Login failed")
      }
    } finally {
      setLoading(false)
    }
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
          maxWidth: 400,
          width: "100%",
          color: "#000",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => navigate("/")}>
          ← Back
        </Button>

        <Typography variant="h5" sx={{ mb: 2 }}>
          Login
        </Typography>

        {sessionExpiredMessage && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {sessionExpiredMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email or Username"
            name="emailOrUserName"
            type="text"
            value={form.emailOrUserName}
            fullWidth
            margin="normal"
            onChange={handleChange}
            required
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            fullWidth
            margin="normal"
            onChange={handleChange}
            required
          />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </form>

        <Box sx={{ mt: 2 }}>
          <Link
            component="button"
            variant="body2"
            sx={{ textTransform: "none" }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </Link>
        </Box>
      </Paper>
    </Box>
  )
}
