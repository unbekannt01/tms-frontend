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

export default function ResetWithSecurityQuestions() {
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const navigate = useNavigate();

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/getSecurityQuestions", { params: { email } });
      if (res.data.questions?.length) {
        setQuestions(res.data.questions);
        setEmailVerified(true);
      } else {
        setError("No security questions found for this email");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please enter new password and confirm it");
      return;
    }

    for (const q of questions) {
      if (!answers[q.question]) {
        setError("Please answer all security questions");
        return;
      }
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: email.toLowerCase(),
        answers: questions.map((q) => ({
          question: q.question,
          answer: answers[q.question],
        })),
        newPassword: password,
      };

      const res = await API.post(
        "/reset-password-with-security-answers",
        payload
      );

      if (res.data.success || res.status === 200) {
        setSuccess(res.data.message || "Password reset successfully!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(res.data.message || "Failed to reset password");
      }
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
          maxWidth: 500,
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
          Reset Password with Security Questions
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

        {!emailVerified && (
          <>
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                py: 1.2,
                backgroundColor: "#059669",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#047857" },
              }}
              onClick={handleEmailSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Next"}
            </Button>
          </>
        )}

        {emailVerified && (
          <form onSubmit={handleReset}>
            <TextField
              label="Email"
              value={email}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />

            {questions.map((q, idx) => (
              <TextField
                key={idx}
                label={q.question}
                value={answers[q.question] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [q.question]: e.target.value })
                }
                fullWidth
                margin="normal"
                required
              />
            ))}

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
        )}
      </Paper>
    </Box>
  );
}
