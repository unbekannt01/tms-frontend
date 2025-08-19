"use client"

import { useState } from "react"
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from "@mui/material"
import API from "../api"
import { useNavigate } from "react-router-dom"

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    age: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await API.post("/users/register", form)
      navigate("/login")
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 2,
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
          maxHeight: "90vh",
          overflow: "auto",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
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
          sx={{
            mb: 4,
            color: "#6b7280",
            fontSize: "0.95rem",
          }}
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
              "& .MuiAlert-icon": {
                color: "#dc2626",
              },
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {Object.keys(form).map((key) => (
            <TextField
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
              name={key}
              type={key === "password" ? "password" : key === "age" ? "number" : "text"}
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
                  "&:hover fieldset": {
                    borderColor: "#059669",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#059669",
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#059669",
                },
              }}
            />
          ))}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 4px 14px 0 rgba(5, 150, 105, 0.3)",
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                boxShadow: "0 6px 20px 0 rgba(5, 150, 105, 0.4)",
                transform: "translateY(-1px)",
              },
              "&:disabled": {
                background: "#d1d5db",
                boxShadow: "none",
              },
              transition: "all 0.2s ease-in-out",
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#ffffff" }} /> : "Create Account"}
          </Button>
        </form>

        <Typography
          variant="body2"
          sx={{
            mt: 3,
            color: "#6b7280",
          }}
        >
          Already have an account?{" "}
          <Button
            variant="text"
            onClick={() => navigate("/login")}
            sx={{
              color: "#059669",
              textTransform: "none",
              fontWeight: 600,
              p: 0,
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "transparent",
                color: "#047857",
              },
            }}
          >
            Sign in
          </Button>
        </Typography>
      </Paper>
    </Box>
  )
}
