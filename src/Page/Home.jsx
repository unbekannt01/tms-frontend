"use client"

import { useEffect, useState } from "react"
import { Box, Paper, Button, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { startSessionMonitoring } from "../utils/SessionManager"

export default function Home() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("user")
    const sessionId = localStorage.getItem("sessionId")
    if (user && sessionId) {
      setIsAuthenticated(true)
      // Start session monitoring if user is already logged in
      startSessionMonitoring()
      navigate("/dashboard")
    }
  }, [navigate])

  if (isAuthenticated) {
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
        <Typography variant="h4" gutterBottom>
          Welcome!
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please login or register.
        </Typography>
        <Button variant="contained" fullWidth sx={{ mb: 2, py: 1.2 }} onClick={() => navigate("/login")}>
          Login
        </Button>
        <Button variant="outlined" fullWidth sx={{ py: 1.2 }} onClick={() => navigate("/register")}>
          Register
        </Button>
      </Paper>
    </Box>
  )
}
