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
import ForgotPasswordPopup from "./ForgotPasswordPopup"; // import your popup

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
  const [emailServiceDialog, setEmailServiceDialog] = useState(false); // New state for popup
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    // Check for session expiry message
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("reason") === "session_expired") {
      setSessionExpiredMessage("Your session has expired. Please login again.");
    }

    // Check for success message from password reset
    if (location.state?.message) {
      setError(""); // Clear any existing errors
      setSessionExpiredMessage(location.state.message);
    }
  }, [location]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear messages when user starts typing
    if (error) setError("");
    if (sessionExpiredMessage && !location.search.includes("session_expired")) {
      setSessionExpiredMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSessionExpiredMessage("");
    setShowVerification(false);
    setResendMessage("");

    try {
      const { data } = await API.post("/users/login", form);

      // Store authentication data
      localStorage.setItem("sessionId", data.sessionId);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("loginTime", Date.now().toString());

      if (data.tokenExpiresAt) {
        localStorage.setItem("tokenExpiresAt", data.tokenExpiresAt);
      }

      // Start session monitoring
      startSessionMonitoring();

      // Navigate based on user role
      const userRole = data.user.roleId.name;
      if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else if (userRole === "manager") {
        navigate("/manager-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);

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
        setError(
          err.response?.data?.message ||
            "Login failed. Please check your credentials."
        );
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
      console.error("Resend verification error:", err);
      setResendMessage(
        err.response?.data?.message || "Failed to send verification email"
      );
    } finally {
      setResendLoading(false);
    }
  };

  // ✅ Updated to show funny popup instead of redirecting
  const handleForgotPassword = () => {
    setEmailServiceDialog(true);
  };

  // New function to close the email service dialog
  const handleCloseEmailServiceDialog = () => {
    setEmailServiceDialog(false);
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
              textTransform: "none",
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
                severity={location.state?.message ? "success" : "warning"}
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
                disabled={loading}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: loading ? "#f3f4f6" : "#ffffff",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#059669",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#059669",
                      borderWidth: 2,
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
                disabled={loading}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: loading ? "#f3f4f6" : "#ffffff",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#059669",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#059669",
                      borderWidth: 2,
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
                disabled={
                  loading ||
                  !form.emailOrUserName.trim() ||
                  !form.password.trim()
                }
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
                    transform: loading ? "none" : "translateY(-1px)",
                  },
                  "&:disabled": {
                    background: "#94a3b8",
                    boxShadow: "none",
                    transform: "none",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Signing In...</span>
                  </Box>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <Box
              sx={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <Link
                component="button"
                variant="body2"
                onClick={() => setOpenPopup(true)}
                disabled={loading}
                sx={{
                  color: "#059669",
                  textDecoration: "none",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  padding: "4px 8px",
                  borderRadius: 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    textDecoration: loading ? "none" : "underline",
                    backgroundColor: loading ? "transparent" : "#f0fdf4",
                    color: loading ? "#059669" : "#047857",
                  },
                }}
              >
                Forgot your password?
              </Link>

              <ForgotPasswordPopup
                open={openPopup}
                onClose={() => setOpenPopup(false)}
              />

              <span style={{ color: "#e2e8f0", alignSelf: "center" }}>|</span>

              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/register")}
                disabled={loading}
                sx={{
                  color: "#059669",
                  textDecoration: "none",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  padding: "4px 8px",
                  borderRadius: 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    textDecoration: loading ? "none" : "underline",
                    backgroundColor: loading ? "transparent" : "#f0fdf4",
                    color: loading ? "#059669" : "#047857",
                  },
                }}
              >
                Create account
              </Link>
            </Box>

            {/* ✅ New funny email service dialog */}
            <Dialog
              open={emailServiceDialog}
              onClose={handleCloseEmailServiceDialog}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle
                sx={{
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#dc2626",
                  fontSize: "1.25rem",
                }}
              >
                🚨 Houston, We Have a Problem! 🚨
              </DialogTitle>
              <DialogContent sx={{ textAlign: "center", py: 3 }}>
                <Typography variant="body1" sx={{ mb: 2, fontSize: "1.1rem" }}>
                  Our email service is currently having a{" "}
                  <strong>heated argument</strong> with the mail server! 📧⚔️
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "#6b7280" }}>
                  Don't worry, our tech wizards are working around the clock
                  (with lots of coffee ☕ and pizza 🍕) to get this sorted out.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontStyle: "italic", color: "#9ca3af" }}
                >
                  In the meantime, try remembering your password or contact
                  support! We promise we'll have this fixed faster than you can
                  say "password123"! 🔧
                </Typography>
              </DialogContent>
              <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
                <Button
                  onClick={handleCloseEmailServiceDialog}
                  variant="contained"
                  sx={{
                    backgroundColor: "#059669",
                    "&:hover": { backgroundColor: "#047857" },
                    textTransform: "none",
                    fontWeight: 600,
                    px: 4,
                  }}
                >
                  Got it! 👍
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
