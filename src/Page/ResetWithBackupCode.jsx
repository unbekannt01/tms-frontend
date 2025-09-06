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
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function ResetWithBackupCode() {
  const [email, setEmail] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !backupCode || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/reset-password-with-backupCode", {
        email: email.toLowerCase(),
        code: backupCode,
        newPassword: password,
      });

      setSuccess(response.data.message || "Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f0fdf4, #d1fae5)",
      }}
    >
      <Paper
        sx={{
          p: 4,
          borderRadius: 4,
          maxWidth: 420,
          width: "100%",
          boxShadow: 3,
        }}
      >
        <Button
          variant="text"
          onClick={() => navigate("/")}
          sx={{
            mb: 2,
            color: "#059669",
            fontWeight: 500,
            textTransform: "none",
            "&:hover": { backgroundColor: "#f0fdf4" },
          }}
        >
          ← Back to Home
        </Button>

        <Typography
          variant="h5"
          sx={{ mb: 3, fontWeight: 600, color: "#047857" }}
        >
          Reset Password with Backup Code
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleReset}>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Backup Code"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              py: 1.2,
              backgroundColor: "#059669",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#047857" },
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Reset Password"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
