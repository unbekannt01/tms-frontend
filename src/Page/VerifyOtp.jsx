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
        backgroundColor: "#121212",
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
        }}
      >
        <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => navigate("/forgot-password")}>
          ← Back
        </Button>

        <Typography variant="h5" sx={{ mb: 2 }}>
          Verify OTP
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
          Enter the OTP sent to {email}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
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
            inputProps={{ maxLength: 6, style: { textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.5rem" } }}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, py: 1.2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Verify OTP"}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
            Didn't receive the code?
          </Typography>
          <Button
            variant="text"
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0}
            sx={{ textTransform: "none" }}
          >
            {resendLoading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
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
