"use client"

import { useState } from "react"
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress, Link } from "@mui/material"
import API from "../api"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    emailOrUserName: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data } = await API.post("/users/login", form)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
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
        {/* Back Button */}
        <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => navigate("/")}>
          ← Back
        </Button>

        <Typography variant="h5" sx={{ mb: 2 }}>
          Login
        </Typography>

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

        {/* Forgot Password link */}
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
