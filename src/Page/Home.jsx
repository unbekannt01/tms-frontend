import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { startSessionMonitoring } from "../utils/SessionManager";

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [notice, setNotice] = useState(""); // ✅ state for announcement

  useEffect(() => {
    fetch(`/config.json?ts=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setNotice(data.notice))
      .catch(() => {});

    // 🔹 Session check
    const user = localStorage.getItem("user");
    const sessionId = localStorage.getItem("sessionId");
    const accessToken = localStorage.getItem("accessToken");

    if (user && sessionId) {
      if (accessToken) {
        const tokenExpiresAt = localStorage.getItem("tokenExpiresAt");
        if (tokenExpiresAt && new Date() > new Date(tokenExpiresAt)) {
          localStorage.clear();
          setIsAuthenticated(false);
          return;
        }
      }

      setIsAuthenticated(true);
      startSessionMonitoring();
      navigate("/dashboard");
    }
    // ❌ Removed auto-popup logic - no longer shows popup automatically
  }, [navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleClose = () => setOpenDialog(false);
  const handleOpen = () => setOpenDialog(true); // ✅ allow manual open only

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
        <Box className="fade-in" sx={{ textAlign: "center" }}>
          {/* ✅ Dynamic Notice Banner */}
          {notice && (
            <Paper
              elevation={2}
              sx={{
                mb: 4,
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                textAlign: "center",
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, color: "#047857" }}
              >
                {notice}
              </Typography>
            </Paper>
          )}

          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
              }}
            >
              TaskFlow
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "#64748b",
                fontWeight: 400,
                mb: 4,
              }}
            >
              Streamline your workflow with intelligent task management
            </Typography>
          </Box>

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
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 600,
                color: "#1e293b",
                mb: 2,
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#64748b",
                mb: 4,
                fontSize: "1.1rem",
              }}
            >
              Sign in to access your personalized dashboard and manage your
              tasks efficiently.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/login")}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 4px 6px -1px rgb(5 150 105 / 0.3)",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                    boxShadow: "0 6px 8px -1px rgb(5 150 105 / 0.4)",
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/register")}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  borderColor: "#059669",
                  color: "#059669",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#047857",
                    backgroundColor: "#f0fdf4",
                  },
                }}
              >
                Create Account
              </Button>
            </Box>

            {/* ✅ Manual open button - only way to show popup */}
            <Button
              variant="text"
              size="small"
              onClick={handleOpen}
              sx={{
                mt: 3,
                textTransform: "none",
                fontSize: "0.9rem",
                color: "#64748b",
                "&:hover": { color: "#059669" },
              }}
            >
              Having issues? Click here to send us a message
            </Button>
          </Paper>
        </Box>
      </Container>

      {/* ✅ Popup dialog - now only opens manually */}
      <Dialog
        open={openDialog}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            p: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontFamily: "Manrope, sans-serif",
            fontWeight: 700,
            fontSize: "1.8rem",
            background: "linear-gradient(135deg, #059669, #10b981)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ⚡ Server's Caffeinated & Running Strong! ☕
        </DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Typography
            sx={{
              mb: 3,
              color: "#475569",
              textAlign: "center",
              fontSize: "1rem",
              lineHeight: 1.6,
            }}
          >
            ✨ Great news! Our servers are fully powered up and running smoothly
            till 19th September 2025! 🚀 But hey, if you need to reach out or
            just want to say hi, drop us a message below! 💌
          </Typography>

          <form
            action="https://formsubmit.co/testing.buddy1111@gmail.com"
            method="POST"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              required
              style={{
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "1rem",
                outline: "none",
                transition: "0.2s",
              }}
              onFocus={(e) => (e.target.style.border = "1px solid #10b981")}
              onBlur={(e) => (e.target.style.border = "1px solid #e2e8f0")}
            />

            <textarea
              name="message"
              placeholder="Your Message"
              required
              style={{
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                minHeight: "90px",
                fontSize: "1rem",
                outline: "none",
                transition: "0.2s",
              }}
              onFocus={(e) => (e.target.style.border = "1px solid #10b981")}
              onBlur={(e) => (e.target.style.border = "1px solid #e2e8f0")}
            />

            <input type="hidden" name="_captcha" value="false" />
            <input
              type="hidden"
              name="_next"
              value={`${window.location.origin}/thank-you`}
            />

            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: "12px",
                fontWeight: 600,
                textTransform: "none",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                boxShadow: "0 4px 10px rgba(16,185,129,0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #047857, #065f46)",
                  boxShadow: "0 6px 14px rgba(5,150,105,0.5)",
                },
              }}
            >
              Send Your Message 🚀
            </Button>
          </form>

          {/* ✅ Updated note with coffee break backup */}
          <Typography
            sx={{
              mt: 3,
              color: "#64748b",
              fontSize: "0.9rem",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Prefer direct contact? 📧 Email us at{" "}
            <a
              href="mailto:testing.buddy1111@gmail.com"
              style={{
                fontWeight: 600,
                color: "#059669",
                textDecoration: "none",
              }}
            >
              testing.buddy1111@gmail.com
            </a>{" "}
            📮 (Even when our servers take coffee breaks, we're always
            listening! ☕)
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={handleClose}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              color: "#475569",
              "&:hover": { backgroundColor: "#f1f5f9" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
