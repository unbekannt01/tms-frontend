"use client"

import { useState, useEffect } from "react"
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from "@mui/material"
import { useNavigate } from "react-router-dom"
import API from "../api"

export default function DirectResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const resetEmail = localStorage.getItem("resetEmail")
    if (!resetEmail) {
      navigate("/forgot-password")
      return
    }
    setEmail(resetEmail)
  }, [navigate])

  const handleReset = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Send reset password request with email and new password
      await API.post("/reset-password", {
        email: email,
        newPassword: password,
      })

      alert("Password reset successful! A confirmation email has been sent.")
      localStorage.removeItem("resetEmail")
      navigate("/login")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
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
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 3,
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(6, 95, 70, 0.1)",
        }}
      >
        <Button
          variant="outlined"
          size="small"
          sx={{
            mb: 3,
            borderColor: "#059669",
            color: "#059669",
            "&:hover": {
              borderColor: "#047857",
              backgroundColor: "rgba(5, 150, 105, 0.04)",
            },
          }}
          onClick={() => navigate("/forgot-password")}
        >
          ← Back
        </Button>

        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 700,
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Reset Password
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 4,
            color: "#6b7280",
            fontSize: "0.95rem",
          }}
        >
          Enter your new password for <strong style={{ color: "#059669" }}>{email}</strong>
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleReset}>
          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                "&:hover fieldset": {
                  borderColor: "#059669",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#059669",
                  borderWidth: 2,
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#059669",
              },
            }}
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                "&:hover fieldset": {
                  borderColor: "#059669",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#059669",
                  borderWidth: 2,
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#059669",
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
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
              "&:disabled": {
                background: "#d1d5db",
                boxShadow: "none",
              },
              transition: "all 0.2s ease-in-out",
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#ffffff" }} /> : "Reset Password & Send Email"}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
