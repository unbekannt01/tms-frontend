"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await API.post("/forgot-password", {
        email: email.toLowerCase(),
      });

      // Clear any existing reset data
      localStorage.removeItem("resetToken");
      localStorage.removeItem("resetEmail");

      // Store email for next step
      localStorage.setItem("resetEmail", email.toLowerCase());

      setSuccess(
        `OTP sent successfully! Check your email for the verification code. ` +
          `The OTP will expire in ${
            response.data.expiresInMinutes || 5
          } minutes.`
      );

      // Navigate after showing success message
      setTimeout(() => {
        navigate("/verify-otp");
      }, 2000);
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to send OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear errors when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

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
          onClick={() => navigate("/login")}
        >
          ← Back to Login
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
          Forgot Password
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
          Enter your email address and we'll send you a 6-digit OTP to reset
          your password.
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

        <form onSubmit={handleSendOtp}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={handleEmailChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
            error={!!error && !error.includes("OTP")}
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
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} sx={{ color: "#ffffff" }} />
                <span>Sending OTP...</span>
              </Box>
            ) : success ? (
              "✓ OTP Sent Successfully"
            ) : (
              "Send OTP"
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
          Remember your password?{" "}
          <Button
            variant="text"
            size="small"
            onClick={() => navigate("/login")}
            sx={{
              textTransform: "none",
              color: "#059669",
              fontWeight: 600,
              p: 0,
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "transparent",
                textDecoration: "underline",
              },
            }}
          >
            Sign in instead
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
}
