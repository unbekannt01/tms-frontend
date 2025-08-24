import { Box, Paper, Typography, Container, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ThankYou() {
  const navigate = useNavigate();

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
              🎉 Thank You!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#64748b",
                mb: 4,
                fontSize: "1.1rem",
              }}
            >
              Your message has been successfully sent.  
              We’ll get back to you as soon as possible 🚀
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/")}
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
              Back to Home
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}