import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Chip,
  IconButton,
} from "@mui/material";
import {
  SecurityOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  ContentCopyOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import API from "../api";

export default function SecuritySetupModal({ open, onComplete, onSkip }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Security questions state
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: "What was the name of your first pet?", answer: "" },
    { question: "What city were you born in?", answer: "" },
    { question: "What was your mother's maiden name?", answer: "" },
  ]);

  // Predefined questions for selection
  const predefinedQuestions = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What was your mother's maiden name?",
    "What was the name of your elementary school?",
    "What is your favorite movie?",
    "What was the make of your first car?",
    "What is your favorite food?",
    "What street did you grow up on?",
    "What is your favorite book?",
    "What was your childhood nickname?",
  ];

  const steps = ["Security Questions", "Backup Codes", "Complete Setup"];

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setActiveStep(0);
      setError("");
      setSuccess("");
      setBackupCodes([]);
      setShowBackupCodes(false);
      setCopiedCodes(false);
      setSecurityQuestions([
        { question: "What was the name of your first pet?", answer: "" },
        { question: "What city were you born in?", answer: "" },
        { question: "What was your mother's maiden name?", answer: "" },
      ]);
    }
  }, [open]);

  const handleQuestionChange = (index, field, value) => {
    const updated = [...securityQuestions];
    updated[index][field] = value;
    setSecurityQuestions(updated);
    setError(""); // Clear error when user types
  };

  const handleSubmitQuestions = async () => {
    setLoading(true);
    setError("");

    try {
      // Validate questions
      for (let i = 0; i < securityQuestions.length; i++) {
        if (!securityQuestions[i].question.trim()) {
          setError(`Question ${i + 1} cannot be empty`);
          return;
        }
        if (!securityQuestions[i].answer.trim()) {
          setError(`Answer for question ${i + 1} cannot be empty`);
          return;
        }
        if (securityQuestions[i].answer.trim().length < 2) {
          setError(`Answer for question ${i + 1} must be at least 2 characters`);
          return;
        }
      }

      // Check for duplicate questions
      const questions = securityQuestions.map(q => q.question.trim());
      const uniqueQuestions = new Set(questions);
      if (questions.length !== uniqueQuestions.size) {
        setError("Please select different questions for each field");
        return;
      }

      const response = await API.post("/complete-security-setup", {
        securityQuestions,
      });

      if (response.data.success) {
        setBackupCodes(response.data.backupCodes || []);
        setActiveStep(1);
        setSuccess("Security questions saved successfully!");
      }
    } catch (err) {
      console.error("Security setup error:", err);
      setError(
        err.response?.data?.message || "Failed to setup security questions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText).then(() => {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    });
  };

  const handleViewCodes = () => {
    setShowBackupCodes(!showBackupCodes);
  };

  const handleCompleteSetup = () => {
    setActiveStep(2);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                Please set up security questions for password recovery. These will be used if you forget your password.
              </Typography>
            </Alert>

            {securityQuestions.map((q, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 600, color: "#374151" }}
                >
                  Security Question {index + 1}
                </Typography>
                
                <TextField
                  select
                  fullWidth
                  label="Select Question"
                  value={q.question}
                  onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                  SelectProps={{ native: true }}
                  sx={{ mb: 2 }}
                >
                  <option value="">Choose a question...</option>
                  {predefinedQuestions.map((question, qIndex) => (
                    <option key={qIndex} value={question}>
                      {question}
                    </option>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  label="Your Answer"
                  value={q.answer}
                  onChange={(e) => handleQuestionChange(index, "answer", e.target.value)}
                  placeholder="Enter your answer here..."
                  helperText="Make sure you'll remember this answer"
                />
              </Box>
            ))}

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Important: Save These Backup Codes!
              </Typography>
              <Typography variant="body2">
                These backup codes can be used to reset your password if you forget your security question answers. Save them in a secure location.
              </Typography>
            </Alert>

            <Paper
              sx={{
                p: 3,
                backgroundColor: "#f8fafc",
                border: "2px dashed #059669",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <SecurityOutlined sx={{ fontSize: 48, color: "#059669", mb: 2 }} />
              
              {!showBackupCodes ? (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
                    Your Backup Codes are Ready
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: "#6b7280" }}>
                    {backupCodes.length} backup codes have been generated
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityOutlined />}
                    onClick={handleViewCodes}
                    sx={{ mr: 2 }}
                  >
                    View Codes
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
                    Your Backup Codes
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    {backupCodes.map((code, index) => (
                      <Chip
                        key={index}
                        label={code}
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.9rem",
                          backgroundColor: "#ffffff",
                          border: "1px solid #059669",
                        }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <Button
                      variant="contained"
                      startIcon={<ContentCopyOutlined />}
                      onClick={handleCopyBackupCodes}
                      sx={{
                        backgroundColor: copiedCodes ? "#10b981" : "#059669",
                        "&:hover": { backgroundColor: copiedCodes ? "#10b981" : "#047857" },
                      }}
                    >
                      {copiedCodes ? "Copied!" : "Copy All Codes"}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityOffOutlined />}
                      onClick={handleViewCodes}
                    >
                      Hide Codes
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>

            {success && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                {success}
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <CheckCircleOutlined
              sx={{ fontSize: 80, color: "#10b981", mb: 2 }}
            />
            <Typography variant="h5" sx={{ mb: 2, color: "#059669", fontWeight: 600 }}>
              Security Setup Complete!
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280" }}>
              Your account is now secured with security questions and backup codes.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={false} // Prevent closing by clicking outside
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          py: 3,
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          color: "white",
          fontWeight: 600,
        }}
      >
        <KeyOutlined sx={{ mr: 1, verticalAlign: "middle" }} />
        Secure Your Account
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": {
                    color: index <= activeStep ? "#059669" : "#9ca3af",
                    fontWeight: index === activeStep ? 600 : 400,
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 0,
          justifyContent: "space-between",
          flexDirection: activeStep === 2 ? "column" : "row",
        }}
      >
        {activeStep === 0 && (
          <>
            <Button
              onClick={onSkip}
              variant="outlined"
              sx={{
                color: "#6b7280",
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
              }}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSubmitQuestions}
              variant="contained"
              disabled={loading || securityQuestions.some(q => !q.question.trim() || !q.answer.trim())}
              sx={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                "&:hover": { background: "linear-gradient(135deg, #047857 0%, #065f46 100%)" },
                minWidth: 120,
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Continue"}
            </Button>
          </>
        )}

        {activeStep === 1 && (
          <>
            <Button
              onClick={onSkip}
              variant="outlined"
              sx={{
                color: "#6b7280",
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
              }}
            >
              Skip Setup
            </Button>
            <Button
              onClick={handleCompleteSetup}
              variant="contained"
              disabled={!showBackupCodes}
              sx={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                "&:hover": { background: "linear-gradient(135deg, #047857 0%, #065f46 100%)" },
                minWidth: 120,
              }}
            >
              I've Saved the Codes
            </Button>
          </>
        )}

        {activeStep === 2 && (
          <Button
            onClick={onComplete}
            variant="contained"
            fullWidth
            size="large"
            sx={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              "&:hover": { background: "linear-gradient(135deg, #047857 0%, #065f46 100%)" },
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 600,
            }}
          >
            Continue to Dashboard
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}