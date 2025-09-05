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

  // ✅ Enhanced cooldown timer
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

    // Validate OTP format
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("OTP must be exactly 6 digits")
      setLoading(false)
      return
    }

    try {
      const response = await API.post("/verify", { 
        email: email.toLowerCase(), 
        otp: otp.trim() 
      })
      
      // Clear any existing tokens
      localStorage.removeItem("resetToken")
      
      // Store new reset token
      localStorage.setItem("resetToken", response.data.resetToken)
      
      // Navigate to reset password
      navigate("/reset-password")
    } catch (err) {
      console.error("OTP verification error:", err)
      const errorMessage = err.response?.data?.message || "Invalid OTP. Please try again."
      setError(errorMessage)
      
      // Clear OTP input on error
      if (errorMessage.includes("expired") || errorMessage.includes("Invalid")) {
        setOtp("")
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ Enhanced resend with better error handling
  const handleResendOtp = async () => {
    setResendLoading(true)
    setError("")
    setResendSuccess("")

    try {
      const response = await API.post("/resend", { email: email.toLowerCase() })
      setResendSuccess(
        `New OTP sent successfully! Valid for ${response.data.expiresInMinutes || 5} minutes.`
      )
      
      // Set cooldown based on server response or default to 60 seconds
      const cooldownTime = 60
      setResendCooldown(cooldownTime)
      setOtp("") // Clear current OTP input
    } catch (err) {
      console.error("Resend OTP error:", err)
      
      if (err.response?.status === 429) {
        // Handle rate limiting with exact time
        const waitTime = err.response.data.waitTime || 60
        const errorMessage = err.response.data.message || `Please wait ${waitTime} seconds before requesting a new OTP`
        
        setError(errorMessage)
        setResendCooldown(waitTime) // Set exact countdown from server
      } else {
        const errorMessage = err.response?.data?.message || "Failed to resend OTP"
        setError(errorMessage)
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '') // Only allow numbers
    if (value.length <= 6) {
      setOtp(value)
      // Clear errors when user starts typing
      if (error) setError("")
      if (resendSuccess) setResendSuccess("")
    }
  }

  const handleBackToForgotPassword = () => {
    // Clean up localStorage
    localStorage.removeItem("resetEmail")
    localStorage.removeItem("resetToken")
    navigate("/forgot-password")
  }

  if (!email) {
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
        <CircularProgress sx={{ color: "#059669" }} />
      </Box>
    )
  }

  // ✅ Format time display
  const formatTimeRemaining = (seconds) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
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
          onClick={handleBackToForgotPassword}
          disabled={loading || resendLoading}
        >
          ← Back to Email
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
            lineHeight: 1.6,
          }}
        >
          Enter the 6-digit OTP sent to{" "}
          <strong style={{ color: "#059669" }}>{email}</strong>
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              textAlign: "left",
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
              textAlign: "left",
            }}
          >
            {resendSuccess}
          </Alert>
        )}

        <form onSubmit={handleVerify}>
          <TextField
            label="Enter 6-digit OTP"
            type="text"
            value={otp}
            onChange={handleOtpChange}
            fullWidth
            margin="normal"
            required
            disabled={loading || resendLoading}
            error={!!error}
            inputProps={{
              maxLength: 6,
              pattern: "[0-9]{6}",
              inputMode: "numeric",
              style: {
                textAlign: "center",
                fontSize: "1.8rem",
                letterSpacing: "0.8rem",
                fontWeight: 600,
                color: "#059669",
                fontFamily: "monospace",
              },
            }}
            placeholder="000000"
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: (loading || resendLoading) ? "#f3f4f6" : "#f9fafb",
                "&:hover fieldset": {
                  borderColor: "#059669",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#059669",
                  borderWidth: 2,
                },
                "&.Mui-error fieldset": {
                  borderColor: "#ef4444",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#059669",
              },
              "& .MuiInputLabel-root.Mui-error": {
                color: "#ef4444",
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
                transform: (loading || otp.length !== 6) ? "none" : "translateY(-1px)",
              },
              "&:disabled": {
                background: "#d1d5db",
                boxShadow: "none",
                transform: "none",
              },
              transition: "all 0.2s ease-in-out",
            }}
            disabled={loading || resendLoading || otp.length !== 6}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} sx={{ color: "#ffffff" }} />
                <span>Verifying...</span>
              </Box>
            ) : (
              "Verify OTP"
            )}
          </Button>
        </form>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ mb: 2, color: "#6b7280" }}>
            Didn't receive the code?
          </Typography>
          
          <Button
            variant="text"
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0 || loading}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: "#059669" }} />
                <span>Sending...</span>
              </Box>
            ) : resendCooldown > 0 ? (
              `Resend OTP (${formatTimeRemaining(resendCooldown)})`
            ) : (
              "Resend OTP"
            )}
          </Button>

          {resendCooldown > 0 && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                color: "#f59e0b",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              ⏳ Please wait before requesting another OTP
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: "#9ca3af",
              fontSize: "0.8rem",
            }}
          >
            Check your spam folder if you don't see the email
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}