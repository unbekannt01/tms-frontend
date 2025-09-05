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
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import API from "../api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("resetToken");
    if (!token) {
      navigate("/forgot-password");
      return;
    }
    setResetToken(token);
  }, [navigate]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleReset = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");

    // Client-side validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/reset-password", {
        resetToken,
        newPassword: password,
      });

      setSuccess("Password reset successful! Redirecting to login...");

      // Clean up localStorage
      localStorage.removeItem("resetToken");
      localStorage.removeItem("resetEmail");

      // Clear any existing session data
      localStorage.removeItem("user");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("tokenExpiresAt");

      // Show success message then redirect
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Password reset successfully! Please login with your new password.",
          },
        });
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to reset password";
      setError(errorMessage);

      // If token is invalid/expired, redirect to forgot password
      if (errorMessage.includes("Invalid or expired")) {
        setTimeout(() => {
          localStorage.removeItem("resetToken");
          localStorage.removeItem("resetEmail");
          navigate("/forgot-password");
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleBackToVerify = () => {
    localStorage.removeItem("resetToken");
    navigate("/verify-otp");
  };

  if (!resetToken) {
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

  const passwordStrength =
    password.length >= 6 ? "strong" : password.length >= 3 ? "medium" : "weak";

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
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 3,
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(6, 95, 70, 0.1)",
        }}
      >
        <Button
          variant="outlined"
          size="small"
          sx={{
            mb: 3,
            borderColor: "#059669",
            color: "#059669",
            "&:hover": {
              borderColor: "#047857",
              backgroundColor: "rgba(5, 150, 105, 0.04)",
            },
          }}
          onClick={handleBackToVerify}
          disabled={loading}
        >
          ← Back to OTP
        </Button>

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
          Reset Password
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 4,
            color: "#6b7280",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Create a new password for your account. Make sure it's at least 6
          characters long.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              textAlign: "left",
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 2,
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              textAlign: "left",
            }}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleReset}>
          <TextField
            label="New Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
            error={!!error && error.includes("Password")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: loading ? "#f3f4f6" : "#f9fafb",
                "&:hover fieldset": {
                  borderColor: "#059669",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#059669",
                  borderWidth: 2,
                },
                "&.Mui-error fieldset": {
                  borderColor: "#ef4444",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#059669",
              },
              "& .MuiInputLabel-root.Mui-error": {
                color: "#ef4444",
              },
            }}
          />

          {/* Password Strength Indicator */}
          {password && (
            <Box sx={{ mb: 2, textAlign: "left" }}>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Password strength:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mt: 0.5,
                }}
              >
                <Box
                  sx={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    backgroundColor:
                      passwordStrength === "weak"
                        ? "#ef4444"
                        : passwordStrength === "medium"
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                />
                <Box
                  sx={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    backgroundColor:
                      passwordStrength === "strong" ||
                      passwordStrength === "medium"
                        ? "#10b981"
                        : "#e5e7eb",
                  }}
                />
                <Box
                  sx={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    backgroundColor:
                      passwordStrength === "strong" ? "#10b981" : "#e5e7eb",
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color:
                    passwordStrength === "weak"
                      ? "#ef4444"
                      : passwordStrength === "medium"
                      ? "#f59e0b"
                      : "#10b981",
                  fontWeight: 500,
                }}
              >
                {passwordStrength === "weak" && "Weak"}
                {passwordStrength === "medium" && "Medium"}
                {passwordStrength === "strong" && "Strong"}
              </Typography>
            </Box>
          )}

          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
            error={!!error && error.includes("match")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: loading ? "#f3f4f6" : "#f9fafb",
                "&:hover fieldset": {
                  borderColor: "#059669",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#059669",
                  borderWidth: 2,
                },
                "&.Mui-error fieldset": {
                  borderColor: "#ef4444",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#059669",
              },
              "& .MuiInputLabel-root.Mui-error": {
                color: "#ef4444",
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              background: success
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 4px 14px 0 rgba(5, 150, 105, 0.3)",
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                boxShadow: "0 6px 20px 0 rgba(5, 150, 105, 0.4)",
                transform: loading ? "none" : "translateY(-1px)",
              },
              "&:disabled": {
                background: "#d1d5db",
                boxShadow: "none",
                transform: "none",
              },
              transition: "all 0.2s ease-in-out",
            }}
            disabled={
              loading ||
              !password.trim() ||
              !confirmPassword.trim() ||
              password !== confirmPassword ||
              password.length < 6
            }
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} sx={{ color: "#ffffff" }} />
                <span>Resetting Password...</span>
              </Box>
            ) : success ? (
              "✓ Password Reset Successfully"
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

        <Typography
          variant="body2"
          sx={{
            mt: 3,
            color: "#9ca3af",
            fontSize: "0.85rem",
          }}
        >
          Make sure to save your new password in a secure place.
        </Typography>
      </Paper>
    </Box>
  );
}
