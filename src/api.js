import axios from "axios"

const API = axios.create({
  baseURL: "https://nodejs-migration.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach both sessionId and JWT token if they exist
API.interceptors.request.use((req) => {
  const sessionId = localStorage.getItem("sessionId")
  const accessToken = localStorage.getItem("accessToken")

  if (sessionId) {
    req.headers["x-session-id"] = sessionId
  }

  if (accessToken) {
    req.headers["Authorization"] = `Bearer ${accessToken}`
  }

  return req
})

// Handle both session and JWT token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code
      const errorMessage = error.response?.data?.message || ""

      // Handle different types of 401 errors
      if (
        errorCode === "NO_SESSION" ||
        errorCode === "SESSION_INVALID" ||
        errorCode === "SESSION_ERROR" ||
        errorMessage.includes("JWT") ||
        errorMessage.includes("token") ||
        errorMessage.includes("expired")
      ) {
        // Clear all authentication data including JWT token
        localStorage.removeItem("sessionId")
        localStorage.removeItem("accessToken")
        localStorage.removeItem("tokenExpiresAt")
        localStorage.removeItem("user")
        localStorage.removeItem("resetToken")
        localStorage.removeItem("resetEmail")
        localStorage.removeItem("loginTime")

        // Only redirect if not already on login/auth pages
        const currentPath = window.location.pathname
        const authPaths = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password", "/"]

        if (!authPaths.includes(currentPath)) {
          const reason =
            errorMessage.includes("JWT") || errorMessage.includes("token") ? "token_expired" : "session_expired"

          setTimeout(() => {
            window.location.href = `/login?reason=${reason}`
          }, 500)
        }
      }
    }
    return Promise.reject(error)
  },
)

export default API
