/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getActiveSessions, terminateSession } from "../utils/SessionManager";
import {
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Computer as DesktopIcon,
  PhoneIphone as PhoneIcon,
  TabletMac as TabletIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [terminatingSession, setTerminatingSession] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    sessionId: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const formatRelative = (dateString) => {
    if (!dateString) return "—";
    const delta = Date.now() - new Date(dateString).getTime();
    const seconds = Math.round(delta / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      navigate("/login");
      return;
    }

    loadSessions();
  }, [navigate]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionData = await getActiveSessions();
      setSessions(sessionData);
      setError("");
    } catch (err) {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      const sessionData = await getActiveSessions();
      setSessions(sessionData);
      setError("");
    } catch (err) {
      setError("Failed to refresh sessions");
    } finally {
      setRefreshing(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      setTerminatingSession(sessionId);
      const success = await terminateSession(sessionId);

      if (success) {
        setSessions(
          sessions.filter((session) => session.sessionId !== sessionId)
        );
        setConfirmDialog({ open: false, sessionId: null });
        setError("");
      } else {
        setError("Failed to terminate session");
      }
    } catch (err) {
      setError("Failed to terminate session");
    } finally {
      setTerminatingSession(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getBrowserIcon = (browser) => {
    const b = browser?.toLowerCase() || "";
    if (b.includes("chrome")) return "🌐";
    if (b.includes("firefox")) return "🦊";
    if (b.includes("safari")) return "🧭";
    if (b.includes("edge")) return "🔷";
    return "💻";
  };

  const getDeviceIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("mobile") || t.includes("phone"))
      return <PhoneIcon sx={{ color: "#a7f3d0" }} />;
    if (t.includes("tablet")) return <TabletIcon sx={{ color: "#a7f3d0" }} />;
    return <DesktopIcon sx={{ color: "#a7f3d0" }} />;
  };

  if (loading) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#059669" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 880, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            color: "#1f2937",
            background: "#ffffff",
            border: "1px solid rgba(6,95,70,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SecurityIcon sx={{ color: "#059669" }} />
              <Typography
                variant="h4"
                sx={{ color: "#1f2937", fontWeight: 700 }}
              >
                Active Sessions
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => navigate("/dashboard")}
                sx={{ color: "#059669", borderColor: "#059669" }}
              >
                ← Back
              </Button>
              <Button
                variant="outlined"
                onClick={onRefresh}
                disabled={refreshing}
                startIcon={
                  <RefreshIcon
                    sx={{
                      animation: refreshing
                        ? "spin 1s linear infinite"
                        : "none",
                    }}
                  />
                }
                sx={{
                  color: "#059669",
                  borderColor: "#059669",
                  "@keyframes spin": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              mb: 3,
              p: 2.5,
              borderRadius: 2,
              border: "1px solid rgba(6,95,70,0.15)",
              background: "linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%)",
              color: "#1f2937",
            }}
          >
            <Typography sx={{ fontWeight: 700, mb: 0.5, color: "#065f46" }}>
              Session Limit: 2 devices maximum
            </Typography>
            <Typography variant="body2" sx={{ color: "#374151" }}>
              When you sign in from a 3rd device, the oldest session will be
              logged out after 1 minute.
            </Typography>
          </Box>

          {sessions.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: "center", py: 4 }}>
              No active sessions found.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sessions.map((session) => (
                <Card
                  key={session.sessionId}
                  variant="outlined"
                  sx={{
                    backgroundColor: "#ffffff",
                    border: session.isCurrent
                      ? "1.5px solid #22c55e66"
                      : "1px solid rgba(6,95,70,0.1)",
                    borderRadius: 3,
                    color: "#1f2937",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{ display: "flex", gap: 2, alignItems: "stretch" }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#ecfdf5",
                          borderRadius: 2,
                        }}
                      >
                        {getDeviceIcon(session.deviceInfo?.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{ color: "#1f2937", fontWeight: 700 }}
                          >
                            {getBrowserIcon(session.deviceInfo?.browser)}{" "}
                            {session.deviceInfo?.browser || "Unknown Browser"}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#065f46" }}>
                            {session.deviceInfo?.os || "Unknown OS"}
                          </Typography>
                          {session.isCurrent && (
                            <Chip
                              label="Current Session"
                              size="small"
                              sx={{
                                backgroundColor: "#dcfce7",
                                color: "#065f46",
                              }}
                            />
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 1.5,
                          }}
                        >
                          {session.deviceInfo?.city ||
                          session.deviceInfo?.country ? (
                            <Typography
                              variant="body2"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "#374151",
                              }}
                            >
                              <LocationIcon
                                sx={{ fontSize: 18, color: "#059669" }}
                              />
                              {(session.deviceInfo?.city || "").toString()}
                              {session.deviceInfo?.city &&
                              session.deviceInfo?.country
                                ? ", "
                                : ""}
                              {(session.deviceInfo?.country || "").toString()}
                            </Typography>
                          ) : null}

                          {session.deviceInfo?.ip ? (
                            <Typography
                              variant="body2"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "#374151",
                              }}
                            >
                              <PublicIcon
                                sx={{ fontSize: 18, color: "#059669" }}
                              />
                              {session.deviceInfo?.ip}
                            </Typography>
                          ) : null}

                          <Typography
                            variant="body2"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              color: "#374151",
                            }}
                          >
                            <AccessTimeIcon
                              sx={{ fontSize: 18, color: "#059669" }}
                            />
                            Last active: {formatRelative(session.lastActivity)}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              color: "#374151",
                            }}
                          >
                            <AccessTimeIcon
                              sx={{ fontSize: 18, color: "#059669" }}
                            />
                            Started: {formatDate(session.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 1,
                          minWidth: 130,
                        }}
                      >
                        {!session.isCurrent ? (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={
                              terminatingSession === session.sessionId ? (
                                <CircularProgress size={14} />
                              ) : (
                                <LogoutIcon />
                              )
                            }
                            disabled={terminatingSession === session.sessionId}
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                sessionId: session.sessionId,
                              })
                            }
                          >
                            Sign Out
                          </Button>
                        ) : (
                          <Box sx={{ height: 36 }} />
                        )}
                        {session.deviceInfo?.secure ? (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              color: "#166534",
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: "#22c55e",
                              }}
                            />{" "}
                            Secure
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, sessionId: null })}
      >
        <DialogTitle>Terminate Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to terminate this session? The user will be
            logged out from that device.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, sessionId: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleTerminateSession(confirmDialog.sessionId)}
            color="error"
            variant="contained"
          >
            Terminate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
