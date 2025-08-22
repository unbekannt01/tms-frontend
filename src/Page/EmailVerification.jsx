"use client"

import { useState, useEffect } from "react"
import { Box, Paper, Button, Typography, Alert } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { Email } from "@mui/icons-material"
import API from "../api" // Assuming API is imported from a common location

export default function EmailVerification() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  useEffect(() => {
    const verificationEmail = localStorage.getItem("verificationEmail")
    if (!verificationEmail) {
      navigate("/register")
      return
    }
    setEmail(verificationEmail)
  }, [navigate])

  const handleResendEmail = async () => {
    setResending(true)
    setResendMessage("")

    try {
      await API.post("/resend-email-verification", { email })
      setResendMessage("Verification email sent successfully! Please check your inbox.")
    } catch (error) {
      setResendMessage(error.response?.data?.message || "Failed to resend email. Please try again.")
    } finally {
      setResending(false)
    }
  }

  const handleBackToLogin = () => {
    localStorage.removeItem("verificationEmail")
    navigate("/login")
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
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Email
            sx={{
              fontSize: 60,
              color: "#059669",
              mb: 2,
            }}
          />
        </Box>

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
          Check Your Email
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 2,
            color: "#374151",
            fontSize: "1rem",
            lineHeight: 1.6,
          }}
        >
          We've sent a verification link to
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: "#059669",
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
        >
          {email}
        </Typography>

        {resendMessage && (
          <Alert
            severity={resendMessage.includes("successfully") ? "success" : "error"}
            sx={{
              mb: 3,
              borderRadius: 2,
              textAlign: "left",
            }}
          >
            {resendMessage}
          </Alert>
        )}

        <Alert
          severity="info"
          sx={{
            mb: 4,
            borderRadius: 2,
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            textAlign: "left",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Please verify your email to activate your account
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            • Check your inbox and spam folder
            <br />• Click the verification link in the email
            <br />• Your account will be activated automatically
          </Typography>
        </Alert>

        <Button
          variant="contained"
          fullWidth
          onClick={handleBackToLogin}
          sx={{
            py: 1.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            boxShadow: "0 4px 14px 0 rgba(5, 150, 105, 0.3)",
            fontSize: "1rem",
            fontWeight: 600,
            textTransform: "none",
            mb: 2,
            "&:hover": {
              background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
              boxShadow: "0 6px 20px 0 rgba(5, 150, 105, 0.4)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          Go to Login
        </Button>

        <Typography
          variant="body2"
          sx={{
            mt: 3,
            color: "#6b7280",
          }}
        >
          Didn't receive the email?{" "}
          <Button
            variant="text"
            onClick={handleResendEmail}
            disabled={resending}
            sx={{
              color: "#059669",
              textTransform: "none",
              fontWeight: 600,
              p: 0,
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "transparent",
                color: "#047857",
              },
            }}
          >
            {resending ? "Sending..." : "Resend Email"}
          </Button>
        </Typography>
      </Paper>
    </Box>
  )
}
