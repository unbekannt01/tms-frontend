"use client"
import { Box, Paper, Typography, Button } from "@mui/material"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ErrorOutline } from "@mui/icons-material"

export default function VerificationError() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reason = searchParams.get("reason")

  const getErrorMessage = () => {
    switch (reason) {
      case "invalid":
        return "The verification link is invalid or has already been used."
      case "expired":
        return "The verification link has expired. Please request a new one."
      case "already-verified":
        return "Your account is already verified. You can proceed to login."
      case "user-not-found":
        return "User account not found. Please register again."
      case "server":
        return "Something went wrong on our end. Please try again later."
      default:
        return "There was an issue with email verification."
    }
  }

  const shouldShowRegisterButton = () => {
    return ["invalid", "expired", "user-not-found"].includes(reason)
  }

  const shouldShowLoginButton = () => {
    return reason === "already-verified"
  }

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)",
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
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(220, 38, 38, 0.1)",
        }}
      >
        <ErrorOutline
          sx={{
            fontSize: 64,
            color: "#dc2626",
            mb: 2,
          }}
        />

        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: "#dc2626",
          }}
        >
          Verification Failed
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          {getErrorMessage()}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          {shouldShowRegisterButton() && (
            <Button
              variant="contained"
              onClick={() => navigate("/register")}
              sx={{
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)",
                },
              }}
            >
              Register Again
            </Button>
          )}

          <Button
            variant={shouldShowLoginButton() ? "contained" : "outlined"}
            onClick={() => navigate("/login")}
            sx={
              shouldShowLoginButton()
                ? {
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                    },
                  }
                : {
                    borderColor: "#dc2626",
                    color: "#dc2626",
                    "&:hover": {
                      borderColor: "#b91c1c",
                      backgroundColor: "rgba(220, 38, 38, 0.04)",
                    },
                  }
            }
          >
            Go to Login
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
