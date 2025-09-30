"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Link,
} from "@mui/material";
import { PhotoCamera, Delete, Info } from "@mui/icons-material";
import API, { avatarAPI } from "../api";
import { useNavigate } from "react-router-dom";
import {
  startSessionMonitoring,
  stopSessionMonitoring,
} from "../utils/SessionManager";

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    age: "",
  });
  const [initialForm, setInitialForm] = useState(null); // For "no changes" check
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [showSizeWarning, setShowSizeWarning] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const sessionId = localStorage.getItem("sessionId");

    if (!userData || !sessionId) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      const profileData = {
        firstName: parsedUser.firstName || "",
        lastName: parsedUser.lastName || "",
        userName: parsedUser.userName || "",
        email: parsedUser.email || "",
        age: parsedUser.age || "",
      };

      setForm(profileData);
      setInitialForm(profileData); // Keep initial for comparison

      if (parsedUser.avatar?.url) {
        setAvatarUrl(parsedUser.avatar.url);
      }

      startSessionMonitoring();
    } catch (error) {
      localStorage.clear();
      navigate("/login");
      return;
    }

    setInitialLoading(false);

    return () => {
      stopSessionMonitoring();
    };
  }, [navigate]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file");
      setShowSizeWarning(false);
      return;
    }

    // Validate file size (50KB)
    if (file.size > 50 * 1024) {
      setAvatarError("Image size should be less than 50KB");
      setShowSizeWarning(true);
      return;
    }

    setAvatarLoading(true);
    setAvatarError("");
    setAvatarSuccess("");
    setShowSizeWarning(false);

    try {
      const { data } = await avatarAPI.uploadAvatar(file);
      setAvatarUrl(data.avatar.url);

      // Update user data in localStorage
      const updatedUser = { ...user, avatar: data.avatar };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setAvatarSuccess("Avatar updated successfully!");
    } catch (err) {
      setAvatarError(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarLoading(true);
    setAvatarError("");
    setAvatarSuccess("");

    try {
      await avatarAPI.deleteAvatar();
      setAvatarUrl("");

      // Update user data in localStorage
      const updatedUser = { ...user, avatar: null };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setAvatarSuccess("Avatar removed successfully!");
    } catch (err) {
      setAvatarError(err.response?.data?.message || "Failed to remove avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check if no changes made
    if (JSON.stringify(form) === JSON.stringify(initialForm)) {
      setSuccess("Nothing to update. Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.put("/users", form);

      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setInitialForm(form); // Update initial values after saving
      setSuccess("Profile updated successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      setPasswordLoading(false);
      return;
    }

    try {
      await API.post("/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess(
        "Password changed successfully! All other sessions have been logged out."
      );

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await API.patch(`/users/softDelete/${user._id}`);
      localStorage.clear();
      setDeleteLoading(false);
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account");
      setDeleteLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (initialLoading) {
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

  if (!user) {
    return null;
  }

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/dashboard")}
            sx={{
              mb: 2,
              borderColor: "#059669",
              color: "#059669",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#047857",
                backgroundColor: "rgba(5, 150, 105, 0.04)",
              },
            }}
          >
            ← Back to Dashboard
          </Button>
        </Box>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            mb: 3,
            backgroundColor: "#ffffff",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(6, 95, 70, 0.1)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "#059669",
              }}
            >
              Profile Picture
            </Typography>

            {avatarSuccess && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                {avatarSuccess}
              </Alert>
            )}

            {avatarError && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                {avatarError}
              </Alert>
            )}

            {showSizeWarning && (
              <Alert
                severity="warning"
                icon={<Info />}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fed7aa",
                }}
              >
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Your image is too large! Please reduce the size to under 50KB.
                </Typography>
                <Typography variant="body2">
                  You can compress your image here:{" "}
                  <Link
                    href="https://image.pi7.org/reduce-image-size-in-kb"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: "#d97706",
                      fontWeight: 600,
                      textDecoration: "underline",
                      "&:hover": {
                        color: "#b45309",
                      },
                    }}
                  >
                    Reduce Image Size Tool
                  </Link>
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: "2rem",
                    backgroundColor: "#059669",
                  }}
                >
                  {!avatarUrl &&
                    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}
                </Avatar>
                {avatarLoading && (
                  <CircularProgress
                    size={24}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-12px",
                      marginLeft: "-12px",
                      color: "#059669",
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />

                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  sx={{
                    borderColor: "#059669",
                    color: "#059669",
                    "&:hover": {
                      borderColor: "#047857",
                      backgroundColor: "rgba(5, 150, 105, 0.04)",
                    },
                  }}
                >
                  {avatarUrl ? "Change Avatar" : "Upload Avatar"}
                </Button>

                {avatarUrl && (
                  <Button
                    variant="outlined"
                    startIcon={<Delete />}
                    onClick={handleAvatarDelete}
                    disabled={avatarLoading}
                    sx={{
                      borderColor: "#dc2626",
                      color: "#dc2626",
                      "&:hover": {
                        borderColor: "#b91c1c",
                        backgroundColor: "rgba(220, 38, 38, 0.04)",
                      },
                    }}
                  >
                    Remove Avatar
                  </Button>
                )}
              </Box>
            </Box>

            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: "#6b7280",
              }}
            >
              Upload a profile picture. Max size: 50KB. Supported formats: JPG,
              PNG, GIF
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: "#6b7280",
              }}
            >
              Need to reduce image size?{" "}
              <Link
                href="https://image.pi7.org/reduce-image-size-in-kb"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#059669",
                  fontWeight: 500,
                  textDecoration: "underline",
                  "&:hover": {
                    color: "#047857",
                  },
                }}
              >
                Use this free compression tool
              </Link>
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            mb: 3,
            backgroundColor: "#ffffff",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(6, 95, 70, 0.1)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              sx={{
                mb: 1,
                fontWeight: 700,
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Update Profile
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 4,
                color: "#6b7280",
              }}
            >
              Keep your information up to date
            </Typography>

            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                {success}
              </Alert>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="First Name"
                name="firstName"
                type="text"
                value={form.firstName}
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

              <TextField
                label="Last Name"
                name="lastName"
                type="text"
                value={form.lastName}
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

              <TextField
                label="Username"
                name="userName"
                type="text"
                value={form.userName}
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

              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
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

              <TextField
                label="Age"
                name="age"
                type="number"
                value={form.age}
                fullWidth
                margin="normal"
                onChange={handleChange}
                sx={{
                  mb: 3,
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

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 4px 14px 0 rgba(5, 150, 105, 0.3)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #047857 0%, #065f46 100%)",
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
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "#ffffff" }} />
                ) : (
                  "Update Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            backgroundColor: "#ffffff",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(6, 95, 70, 0.1)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                fontWeight: 600,
                color: "#dc2626",
              }}
            >
              Change Password
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 4,
                color: "#6b7280",
              }}
            >
              Update your password to keep your account secure
            </Typography>

            {passwordSuccess && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                {passwordSuccess}
              </Alert>
            )}

            {passwordError && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                {passwordError}
              </Alert>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <TextField
                label="Current Password"
                name="oldPassword"
                type="password"
                value={passwordForm.oldPassword}
                fullWidth
                margin="normal"
                onChange={handlePasswordChange}
                required
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#f9fafb",
                    "&:hover fieldset": {
                      borderColor: "#dc2626",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#dc2626",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#dc2626",
                  },
                }}
              />

              <TextField
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                fullWidth
                margin="normal"
                onChange={handlePasswordChange}
                required
                helperText="Minimum 6 characters"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#f9fafb",
                    "&:hover fieldset": {
                      borderColor: "#dc2626",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#dc2626",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#dc2626",
                  },
                }}
              />

              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                fullWidth
                margin="normal"
                onChange={handlePasswordChange}
                required
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#f9fafb",
                    "&:hover fieldset": {
                      borderColor: "#dc2626",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#dc2626",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#dc2626",
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
                  background:
                    "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  boxShadow: "0 4px 14px 0 rgba(220,38,38,0.3)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)",
                    transform: "translateY(-1px)",
                  },
                }}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <CircularProgress size={24} sx={{ color: "#ffffff" }} />
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            mt: 3,
            backgroundColor: "#fff",
            boxShadow:
              "0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 600, color: "#ef4444" }}
            >
              Danger Zone
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: "#6b7280" }}>
              Once deleted, your account will be permanently removed after{" "}
              <b>30 Days.</b>.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                boxShadow: "0 4px 14px 0 rgba(220,38,38,0.3)",
                fontWeight: 600,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Delete My Account
            </Button>

            <Dialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
            >
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogContent>
                <Typography>
                  Are you sure? Your account will be <b>soft deleted</b> now and
                  permanently removed in 5 minutes.
                </Typography>
                {deleteError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {deleteError}
                  </Alert>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  sx={{
                    color: "#fff",
                    backgroundColor: "#ef4444",
                    "&:hover": { backgroundColor: "#dc2626" },
                  }}
                >
                  {deleteLoading ? (
                    <CircularProgress size={20} sx={{ color: "#fff" }} />
                  ) : (
                    "Yes, Delete"
                  )}
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
