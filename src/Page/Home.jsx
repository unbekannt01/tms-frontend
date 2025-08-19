"use client"

import { useEffect, useState } from "react"
import { Box, Paper, Button, Typography, Container, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { startSessionMonitoring } from "../utils/SessionManager"

export default function Home() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("user")
    const sessionId = localStorage.getItem("sessionId")
    const accessToken = localStorage.getItem("accessToken")

    if (user && sessionId) {
      if (accessToken) {
        const tokenExpiresAt = localStorage.getItem("tokenExpiresAt")
        if (tokenExpiresAt && new Date() > new Date(tokenExpiresAt)) {
          localStorage.clear()
          setIsAuthenticated(false)
          return
        }
      }

      setIsAuthenticated(true)
      startSessionMonitoring()
      navigate("/dashboard")
    } else {
      // Show funny dialog if not authenticated
      setOpenDialog(true)
    }
  }, [navigate])

  if (isAuthenticated) {
    return null
  }

  const handleClose = () => setOpenDialog(false)

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box className="fade-in" sx={{ textAlign: "center" }}>
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
              }}
            >
              TaskFlow
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "#64748b",
                fontWeight: 400,
                mb: 4,
              }}
            >
              Streamline your workflow with intelligent task management
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 600,
                color: "#1e293b",
                mb: 2,
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#64748b",
                mb: 4,
                fontSize: "1.1rem",
              }}
            >
              Sign in to access your personalized dashboard and manage your tasks efficiently.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/login")}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 4px 6px -1px rgb(5 150 105 / 0.3)",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  "&:hover": {
                    background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                    boxShadow: "0 6px 8px -1px rgb(5 150 105 / 0.4)",
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/register")}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  borderColor: "#059669",
                  color: "#059669",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#047857",
                    backgroundColor: "#f0fdf4",
                  },
                }}
              >
                Create Account
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Funny Dialog */}
      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>Oops! 😴</DialogTitle>
        <DialogContent>
          <Typography>
            Our backend server is taking a nap… but you can still reach out! <br />
            Just send a funny mail to{" "}
            <Box component="span" sx={{ fontWeight: "bold", color: "#059669" }}>
              testing.buddy1111@gmail.com
            </Box>{" "}
            and we’ll wake it up! 🚀
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
