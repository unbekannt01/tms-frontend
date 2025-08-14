/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import API from "../Api"

export default function Sessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [terminatingSession, setTerminatingSession] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, sessionId: null })

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken")
    const sessionId = localStorage.getItem("sessionId")

    if (!accessToken && !sessionId) {
      navigate("/login")
      return
    }

    loadSessions()
  }, [navigate])

  const loadSessions = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await API.get("/sessions")

      if (response.data && response.data.sessions) {
        setSessions(response.data.sessions)
      } else {
        setSessions([])
      }
    } catch (err) {
      console.error("Failed to load sessions:", err)

      if (err.response?.status === 401) {
        // Authentication failed, redirect to login
        localStorage.clear()
        navigate("/login?reason=session_expired")
        return
      }

      setError(err.response?.data?.message || "Failed to load sessions")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId) => {
    try {
      setTerminatingSession(sessionId)

      const response = await API.delete(`/sessions/${sessionId}`)

      if (response.status === 200) {
        // Remove the terminated session from the list
        setSessions(sessions.filter((session) => session.sessionId !== sessionId))
        setConfirmDialog({ open: false, sessionId: null })
        setError("")
      } else {
        setError("Failed to terminate session")
      }
    } catch (err) {
      console.error("Failed to terminate session:", err)
      setError(err.response?.data?.message || "Failed to terminate session")
    } finally {
      setTerminatingSession(null)
    }
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return "Invalid Date"
    }
  }

  const getBrowserIcon = (browser) => {
    if (!browser) return "💻"
    const browserLower = browser.toLowerCase()
    if (browserLower.includes("chrome")) return "🌐"
    if (browserLower.includes("firefox")) return "🦊"
    if (browserLower.includes("safari")) return "🧭"
    if (browserLower.includes("edge")) return "🔷"
    return "💻"
  }

  const testAuthentication = async () => {
    try {
      setError("")
      const response = await API.get("/session/check")

      if (response.data) {
        setError("")
        // Reload sessions after successful auth test
        loadSessions()
      }
    } catch (err) {
      console.error("Authentication test failed:", err)
      setError(`Authentication failed: ${err.response?.data?.message || err.message}`)

      if (err.response?.status === 401) {
        localStorage.clear()
        navigate("/login?reason=session_expired")
      }
    }
  }

  if (loading) {
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
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        backgroundColor: "#121212",
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Paper elevation={8} sx={{ p: 4, borderRadius: 4, color: "#000" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4">Active Sessions</Typography>
            <Button variant="outlined" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </Button>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={testAuthentication}>
                  Test Auth
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            You can have up to 5 active sessions. When you login from a 6th device, the oldest session will be
            automatically logged out.
          </Typography>

          {sessions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {error ? "Unable to load sessions due to authentication error." : "No active sessions found."}
              </Typography>
              <Button variant="outlined" onClick={loadSessions} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : "Retry"}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sessions.map((session) => (
                <Card key={session.sessionId} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Typography variant="h6">
                            {getBrowserIcon(session.deviceInfo?.browser)}{" "}
                            {session.deviceInfo?.browser || "Unknown Browser"}
                          </Typography>
                          {session.isCurrent && <Chip label="Current Session" color="primary" size="small" />}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>OS:</strong> {session.deviceInfo?.os || "Unknown OS"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>IP Address:</strong> {session.deviceInfo?.ip || "Unknown IP"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Last Activity:</strong> {formatDate(session.lastActivity)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          <strong>Started:</strong> {formatDate(session.createdAt)}
                        </Typography>
                      </Box>

                      {!session.isCurrent && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          disabled={terminatingSession === session.sessionId}
                          onClick={() => setConfirmDialog({ open: true, sessionId: session.sessionId })}
                        >
                          {terminatingSession === session.sessionId ? <CircularProgress size={16} /> : "Terminate"}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 3, textAlign: "center", display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="outlined" onClick={loadSessions} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Refresh Sessions"}
            </Button>
            <Button variant="outlined" onClick={testAuthentication}>
              Test Authentication
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, sessionId: null })}>
        <DialogTitle>Terminate Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to terminate this session? The user will be logged out from that device.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, sessionId: null })}>Cancel</Button>
          <Button onClick={() => handleTerminateSession(confirmDialog.sessionId)} color="error" variant="contained">
            Terminate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
