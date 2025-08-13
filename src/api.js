import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach sessionId if exists
API.interceptors.request.use((req) => {
  const sessionId = localStorage.getItem("sessionId")
  if (sessionId) {
    req.headers["x-session-id"] = sessionId
  }
  return req
})

// Handle session expiration and automatic logout
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code

      // Handle different types of 401 errors
      if (errorCode === "NO_SESSION" || errorCode === "SESSION_INVALID" || errorCode === "SESSION_ERROR") {
        // Clear storage
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
