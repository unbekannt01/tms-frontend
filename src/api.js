import axios from "axios";
import { validateIfStale } from "./utils/SessionManager";

// Public pages that should skip session validation
const publicPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
  "/reset-backup-code",
  "/reset-security-questions",
  "/",
];

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach sessionId and JWT if exists
API.interceptors.request.use((req) => {
  const currentPath = window.location.pathname;

  // Skip session validation on public paths
  if (!publicPaths.includes(currentPath)) {
    validateIfStale(15000);
  }

  const sessionId = localStorage.getItem("sessionId");
  const accessToken = localStorage.getItem("accessToken");

  if (sessionId) req.headers["x-session-id"] = sessionId;
  if (accessToken) req.headers["Authorization"] = `Bearer ${accessToken}`;

  return req;
});

// Response interceptor: handle session/JWT expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || "";
      const currentPath = window.location.pathname;

      if (
        errorCode === "NO_SESSION" ||
        errorCode === "SESSION_INVALID" ||
        errorCode === "SESSION_ERROR" ||
        errorMessage.includes("JWT") ||
        errorMessage.includes("token") ||
        errorMessage.includes("expired")
      ) {
        // Clear authentication/localStorage data
        localStorage.removeItem("sessionId");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tokenExpiresAt");
        localStorage.removeItem("user");
        localStorage.removeItem("resetToken");
        localStorage.removeItem("resetEmail");
        localStorage.removeItem("loginTime");

        // Only redirect if not on public page
        if (!publicPaths.includes(currentPath)) {
          const reason =
            errorMessage.includes("JWT") || errorMessage.includes("token")
              ? "token_expired"
              : "session_expired";

          setTimeout(() => {
            window.location.href = `/login?reason=${reason}`;
          }, 500);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Avatar API helper
export const avatarAPI = {
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return API.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAvatar: (userId) => API.get(`/users/avatar/${userId}`),
  deleteAvatar: () => API.delete("/users/avatar"),
};

export default API;
