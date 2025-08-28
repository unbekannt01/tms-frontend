"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Container,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import API from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import { startSessionMonitoring } from "../utils/SessionManager";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    emailOrUserName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("reason") === "session_expired") {
      setSessionExpiredMessage("Your session has expired. Please login again.");
    }
  }, [location]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSessionExpiredMessage("");
    setShowVerification(false);
    setResendMessage("");

    try {
      const { data } = await API.post("/users/login", form);

      localStorage.setItem("sessionId", data.sessionId);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("loginTime", Date.now().toString());

      if (data.tokenExpiresAt) {
        localStorage.setItem("tokenExpiresAt", data.tokenExpiresAt);
      }

      startSessionMonitoring();

      const userRole = data.user.roleId.name;
      if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else if (userRole === "manager") {
        navigate("/manager-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (
        err.response?.status === 401 &&
        err.response?.data?.code === "SESSION_LIMIT_EXCEEDED"
      ) {
        setError(
          "Maximum session limit reached. Your oldest session has been logged out."
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (
        err.response?.status === 403 &&
        err.response?.data?.needsVerification
      ) {
        setError(
          "Your account is not verified yet. Please verify your email to continue."
        );
        setVerificationEmail(err.response.data.email);
        setShowVerification(true);
      } else {
        setError(err.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage("");

    try {
      await API.post("/resend-email-verification", {
        email: verificationEmail,
      });
      setResendMessage(
        "Verification email sent successfully! Please check your inbox."
      );
    } catch (err) {
      setResendMessage(
        err.response?.data?.message || "Failed to send verification email"
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

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
        <Box className="slide-up">
          <Button
            variant="text"
            onClick={() => navigate("/")}
            sx={{
              mb: 3,
              color: "#059669",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#f0fdf4" },
            }}
          >
            ← Back to Home
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
            }}
          >
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "Manrope, sans-serif",
                  fontWeight: 600,
                  color: "#1e293b",
                  mb: 1,
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#64748b",
                  fontSize: "1.1rem",
                }}
              >
                Sign in to your account to continue
              </Typography>
            </Box>

            {sessionExpiredMessage && (
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  "& .MuiAlert-message": { fontSize: "0.95rem" },
                }}
              >
                {sessionExpiredMessage}
              </Alert>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  "& .MuiAlert-message": { fontSize: "0.95rem" },
                }}
              >
                {error}
              </Alert>
            )}

            <Collapse in={showVerification}>
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ mb: 2, color: "#92400e", fontWeight: 600 }}
                >
                  Verify Your Account
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "#92400e" }}>
                  We'll send a verification email to:{" "}
                  <strong>{verificationEmail}</strong>
                </Typography>

                {resendMessage && (
                  <Alert
                    severity={
                      resendMessage.includes("successfully")
                        ? "success"
                        : "error"
                    }
                    sx={{ mb: 2, borderRadius: 1 }}
                  >
                    {resendMessage}
                  </Alert>
                )}

                <Button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  variant="contained"
                  sx={{
                    backgroundColor: "#f59e0b",
                    "&:hover": { backgroundColor: "#d97706" },
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  {resendLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Send Verification Email"
                  )}
                </Button>
              </Paper>
            </Collapse>

            <form onSubmit={handleSubmit}>
              <TextField
                label="Email or Username"
                name="emailOrUserName"
                type="text"
                value={form.emailOrUserName}
                fullWidth
                margin="normal"
                onChange={handleChange}
                required
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#059669",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#059669",
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#059669",
                  },
                }}
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                fullWidth
                margin="normal"
                onChange={handleChange}
                required
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#059669",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#059669",
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
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 4px 6px -1px rgb(5 150 105 / 0.3)",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  mb: 3,
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                    boxShadow: "0 6px 8px -1px rgb(5 150 105 / 0.4)",
                  },
                  "&:disabled": {
                    background: "#94a3b8",
                    boxShadow: "none",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <Box sx={{ textAlign: "center" }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleClick}
                sx={{
                  color: "#059669",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Forgot your password?
              </Link>
            </Box>

            {/* Popup / Dialog */}
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Password Reset</DialogTitle>
              <DialogContent>
                  We’ve got some issues with this feature right now. Please try again later.
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} color="primary" autoFocus>
                  OK
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
