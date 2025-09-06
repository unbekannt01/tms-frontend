import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPopup({ open, onClose }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    onClose(); // close popup first
    navigate(path); // then navigate
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          borderRadius: 16,
          maxWidth: 420,
          width: "100%",
          padding: 24,
          background: "linear-gradient(135deg, #f0fdf4, #d1fae5)",
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: 600,
          color: "#047857",
          fontSize: "1.3rem",
        }}
      >
        Forgot Your Password?
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          sx={{ textAlign: "center", mb: 3, color: "#374151" }}
        >
          Choose a method below to reset your password
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#059669",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: "#047857",
              },
            }}
            onClick={() => handleNavigate("/reset-backup-code")}
          >
            Reset using Backup Code 😎
          </Button>

          <Button
            fullWidth
            variant="outlined"
            sx={{
              borderColor: "#059669",
              color: "#059669",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: "#f0fdf4",
                borderColor: "#047857",
                color: "#047857",
              },
            }}
            onClick={() => handleNavigate("/reset-security-questions")}
          >
            Reset using Security Questions 🤔
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
