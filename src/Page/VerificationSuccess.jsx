"use client"

import { useEffect } from "react"
import { Box, Paper, Button, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { CheckCircle } from "@mui/icons-material"

export default function VerificationSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    // Clean up verification email from localStorage
    localStorage.removeItem("verificationEmail")
  }, [])

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
        <CheckCircle
          sx={{
            fontSize: 80,
            color: "#059669",
            mb: 3,
          }}
        />

        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 700,
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Email Verified!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: "#374151",
            fontSize: "1.1rem",
            lineHeight: 1.6,
          }}
        >
          Your account has been successfully verified. You can now log in and start using your account.
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate("/login")}
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
            transition: "all 0.2s ease-in-out",
          }}
        >
          Continue to Login
        </Button>
      </Paper>
    </Box>
  )
}
