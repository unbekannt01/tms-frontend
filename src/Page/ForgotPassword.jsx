"use client"

import { useState } from "react"
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from "@mui/material"
import { useNavigate } from "react-router-dom"
import API from "../api"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await API.post("/forgot-password", { email })
      localStorage.setItem("resetEmail", email)
      navigate("/verify-otp")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP")
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
          onClick={() => navigate("/login")}
        >
          ← Back to Login
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
          Forgot Password
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 4,
            color: "#6b7280",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Enter your email address and we'll send you an OTP to reset your password.
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

        <form onSubmit={handleSendOtp}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? <CircularProgress size={24} sx={{ color: "#ffffff" }} /> : "Send OTP"}
          </Button>
        </form>
      </Paper>
    </Box>
  )
}
