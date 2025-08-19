"use client"

import { useState, useEffect } from "react"
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from "@mui/material"
import { useNavigate } from "react-router-dom"
import API from "../api"

export default function VerifyOtp() {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState("")

  useEffect(() => {
    const resetEmail = localStorage.getItem("resetEmail")
    if (!resetEmail) {
      navigate("/forgot-password")
      return
    }
    setEmail(resetEmail)
  }, [navigate])

  useEffect(() => {
    let timer
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResendSuccess("")

    try {
      const response = await API.post("/verify", { email, otp })
      localStorage.setItem("resetToken", response.data.resetToken)
      navigate("/reset-password")
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setResendLoading(true)
    setError("")
    setResendSuccess("")

    try {
      const response = await API.post("/resend", { email })
      setResendSuccess("New OTP sent successfully!")
      setResendCooldown(60) // 60 second cooldown
      setOtp("") // Clear current OTP input
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP")
    } finally {
      setResendLoading(false)
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
          Verify OTP
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 4,
            color: "#6b7280",
            fontSize: "0.95rem",
          }}
        >
          Enter the OTP sent to <strong style={{ color: "#059669" }}>{email}</strong>
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </Alert>
        )}

        {resendSuccess && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              borderRadius: 2,
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            {resendSuccess}
          </Alert>
        )}

        <form onSubmit={handleVerify}>
          <TextField
            label="OTP Code"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            fullWidth
            margin="normal"
            required
            inputProps={{
              maxLength: 6,
              style: {
                textAlign: "center",
                fontSize: "1.5rem",
                letterSpacing: "0.5rem",
                fontWeight: 600,
                color: "#059669",
              },
            }}
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
            {loading ? <CircularProgress size={24} sx={{ color: "#ffffff" }} /> : "Verify OTP"}
          </Button>
        </form>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ mb: 2, color: "#6b7280" }}>
            Didn't receive the code?
          </Typography>
          <Button
            variant="text"
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0}
            sx={{
              textTransform: "none",
              color: "#059669",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "rgba(5, 150, 105, 0.04)",
              },
              "&:disabled": {
                color: "#9ca3af",
              },
            }}
          >
            {resendLoading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1, color: "#059669" }} />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend OTP (${resendCooldown}s)`
            ) : (
              "Resend OTP"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
