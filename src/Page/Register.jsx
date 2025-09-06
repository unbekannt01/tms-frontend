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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import API from "../api";
import { useNavigate } from "react-router-dom";

// Predefined security questions
const predefinedQuestions = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your first school?",
  "What is your favorite color?",
  "What is your father's middle name?",
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1 = basic info, Step 2 = security questions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: basic info
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    age: "",
  });

  // Step 2: security questions
  const [securityAnswers, setSecurityAnswers] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  // Store user data from step 1
  const [userId, setUserId] = useState("");
  const [temporaryBackupCodes, setTemporaryBackupCodes] = useState("");

  // Backup code modal
  const [backupCode, setBackupCode] = useState("");
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  // Handle input changes for basic info
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Handle security answers change
  const handleSecurityChange = (index, field, value) => {
    const updated = [...securityAnswers];
    updated[index][field] = value;
    setSecurityAnswers(updated);
  };

  // Step 1 → Create user and get userId + temporary backup codes
  const handleNextStep = async () => {
    setError("");

    // Validate required fields
    for (const key of [
      "firstName",
      "lastName",
      "userName",
      "email",
      "password",
    ]) {
      if (!form[key]) {
        setError("All fields are required");
        return;
      }
    }

    setLoading(true);

    try {
      // Step 1: Create the user
      const response = await API.post("/users/register", form);

      // Store userId and temporary backup codes (don't show yet)
      setUserId(response.data.user?._id || "");
      setTemporaryBackupCodes(response.data.backupCodes?.join(", ") || "");

      // Move to step 2
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "User creation failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → Set security questions and show backup codes
  const handleRegisterComplete = async () => {
    // Validate security questions
    for (const sa of securityAnswers) {
      if (!sa.question || !sa.answer) {
        setError("Please select and answer all security questions");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // Step 2: Set security questions using the userId from step 1
      console.log("Sending security questions:", {
        userId: userId,
        securityQuestions: securityAnswers,
      });

      await API.post("/setSecurityQuestions", {
        userId: userId,
        securityQuestions: securityAnswers,
      });

      // Now show the backup codes that were generated in step 1
      setBackupCode(temporaryBackupCodes);
      setShowBackupDialog(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Setting security questions failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackupSaved = () => {
    setShowBackupDialog(false);
    navigate("/login", {
      state: {
        message:
          "Registration successful! You can now sign in to your account.",
      },
    });
  };

  const handleBackupAgain = () => {
    // Keep the dialog open, user can copy/save again
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setError("");
  };

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 3,
          textAlign: "center",
          width: "90%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
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
          onClick={() => navigate("/")}
        >
          ← Back
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
          Create Account
        </Typography>

        <Typography
          variant="body2"
          sx={{ mb: 2, color: "#6b7280", fontSize: "0.95rem" }}
        >
          {step === 1
            ? "Step 1: Basic Information"
            : "Step 2: Security Questions"}
        </Typography>

        <Typography
          variant="body2"
          sx={{ mb: 4, color: "#6b7280", fontSize: "0.95rem" }}
        >
          Join us to manage your tasks efficiently
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              "& .MuiAlert-icon": { color: "#dc2626" },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Step 1 → Basic Info */}
        {step === 1 && (
          <>
            {Object.keys(form).map((key) => (
              <TextField
                key={key}
                label={
                  key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, " $1")
                }
                name={key}
                type={
                  key === "password"
                    ? "password"
                    : key === "age"
                    ? "number"
                    : "text"
                }
                value={form[key]}
                fullWidth
                margin="normal"
                onChange={handleChange}
                required
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#f9fafb",
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#059669",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                }}
              />
            ))}

            <Button
              type="button"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: "#059669",
                "&:hover": { backgroundColor: "#047857" },
              }}
              onClick={handleNextStep}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create Account & Continue"
              )}
            </Button>
          </>
        )}

        {/* Step 2 → Security Questions */}
        {step === 2 && (
          <>
            <Typography
              variant="body2"
              sx={{ mb: 3, color: "#374151", textAlign: "left" }}
            >
              Please set up two security questions to help secure your account:
            </Typography>

            {securityAnswers.map((sa, idx) => (
              <Box key={idx} sx={{ mb: 3, textAlign: "left" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: "#374151", fontWeight: 600 }}
                >
                  Security Question {idx + 1}
                </Typography>
                <FormControl
                  fullWidth
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#f9fafb",
                    },
                  }}
                >
                  <InputLabel>Select Question</InputLabel>
                  <Select
                    value={sa.question}
                    onChange={(e) =>
                      handleSecurityChange(idx, "question", e.target.value)
                    }
                    required
                  >
                    {predefinedQuestions
                      .filter(
                        (q) =>
                          !securityAnswers.find(
                            (other, otherIdx) =>
                              otherIdx !== idx && other.question === q
                          )
                      )
                      .map((q, i) => (
                        <MenuItem key={i} value={q}>
                          {q}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Your Answer"
                  value={sa.answer}
                  onChange={(e) =>
                    handleSecurityChange(idx, "answer", e.target.value)
                  }
                  fullWidth
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#f9fafb",
                      "&:hover fieldset": { borderColor: "#059669" },
                      "&.Mui-focused fieldset": {
                        borderColor: "#059669",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
              </Box>
            ))}

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleBackToStep1}
                sx={{
                  flex: 1,
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: "#059669",
                  color: "#059669",
                  "&:hover": {
                    borderColor: "#047857",
                    backgroundColor: "rgba(5, 150, 105, 0.04)",
                  },
                }}
              >
                ← Back
              </Button>
              <Button
                type="button"
                variant="contained"
                onClick={handleRegisterComplete}
                disabled={loading}
                sx={{
                  flex: 2,
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#059669",
                  "&:hover": { backgroundColor: "#047857" },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </Box>
          </>
        )}

        {/* Backup Code Modal */}
        <Dialog open={showBackupDialog} maxWidth="sm" fullWidth>
          <DialogTitle>⚠️ Your Backup Codes Are Your Lifeline!</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              These codes are super important. If you lose them, your account
              could be lost forever.
            </Typography>
            <Typography
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "#059669",
                backgroundColor: "#f0fdf4",
                padding: 2,
                borderRadius: 1,
                fontFamily: "monospace",
              }}
            >
              Your Backup Codes: {backupCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please copy these codes and store them in a safe place.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBackupAgain} color="secondary">
              Let Me Save Them Again
            </Button>
            <Button
              onClick={handleBackupSaved}
              variant="contained"
              color="success"
            >
              ✅ I've Saved My Codes
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
