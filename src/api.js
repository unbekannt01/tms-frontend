import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach authentication headers
API.interceptors.request.use((req) => {
  const accessToken = localStorage.getItem("accessToken")
  const sessionId = localStorage.getItem("sessionId")

  // Primary: Use JWT token
  if (accessToken) {
    req.headers.Authorization = `Bearer ${accessToken}`
  }

  // Fallback: Use session ID
  if (sessionId) {
    req.headers["x-session-id"] = sessionId
  }

  return req
})

// Handle authentication errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code

      // Handle JWT and session-related errors
      const authErrors = [
        "NO_AUTH",
        "TOKEN_INVALIDATED",
        "TOKEN_EXPIRED",
        "AUTH_FAILED",
        "USER_NOT_FOUND",
        "SESSION_INVALID",
        "NO_SESSION",
      ]

      if (authErrors.includes(errorCode)) {
        // Clear all authentication data
        localStorage.clear()

        // Only redirect if not already on login/auth pages
        const currentPath = window.location.pathname
        const authPaths = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password", "/"]

        if (!authPaths.includes(currentPath)) {
          setTimeout(() => {
            window.location.href = "/login?reason=session_expired"
          }, 500)
        }
      }
    }

    return Promise.reject(error)
  },
)

export default API
