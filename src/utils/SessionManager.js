// Frontend session management utility for JWT + Session based auth
class SessionManager {
  constructor() {
    this.checkInterval = null
    this.isChecking = false
    this.baseURL = "http://localhost:3001/api"
  }

  startSessionCheck() {
    // Clear any existing interval
    this.stopSessionCheck()

    // Start periodic checks after 30 seconds
    setTimeout(() => {
      this.checkInterval = setInterval(() => {
        this.validateSession()
      }, 60000) // Check every minute
    }, 30000)
  }

  stopSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  async validateSession() {
    if (this.isChecking) return

    const accessToken = localStorage.getItem("accessToken")
    const sessionId = localStorage.getItem("sessionId")

    if (!accessToken && !sessionId) {
      this.handleSessionExpired()
      return
    }

    this.isChecking = true

    try {
      const headers = {
        "Content-Type": "application/json",
      }

      // Primary: Use JWT token
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      // Fallback: Use session ID
      if (sessionId) {
        headers["x-session-id"] = sessionId
      }

      const response = await fetch(`${this.baseURL}/session/check`, {
        method: "GET",
        headers: headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          const errorData = await response.json()
          // Handle JWT-specific errors
          if (
            errorData.code === "TOKEN_INVALIDATED" ||
            errorData.code === "TOKEN_EXPIRED" ||
            errorData.code === "AUTH_FAILED" ||
            errorData.code === "NO_AUTH"
          ) {
            this.handleSessionExpired()
          }
        }
      }
    } catch (error) {
      // Don't logout on network errors, but log them
      console.warn("Session validation network error:", error)
    } finally {
      this.isChecking = false
    }
  }

  handleSessionExpired() {
    // Clear all authentication data
    localStorage.removeItem("accessToken")
    localStorage.removeItem("sessionId")
    localStorage.removeItem("user")
    localStorage.removeItem("resetToken")
    localStorage.removeItem("resetEmail")
    localStorage.removeItem("loginTime")

    // Stop session checking
    this.stopSessionCheck()

    // Check if we're already on an auth page
    const currentPath = window.location.pathname
    const authPaths = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password", "/"]

    if (!authPaths.includes(currentPath)) {
      window.location.href = "/login?reason=session_expired"
    }
  }

  handleAppFocus() {
    // Only validate if user has been logged in for more than 30 seconds
    const loginTime = localStorage.getItem("loginTime")
    if (loginTime && Date.now() - Number.parseInt(loginTime) > 30000) {
      setTimeout(() => {
        this.validateSession()
      }, 1000)
    }
  }

  async getActiveSessions() {
    try {
      const accessToken = localStorage.getItem("accessToken")
      const sessionId = localStorage.getItem("sessionId")

      if (!accessToken && !sessionId) return []

      const headers = {
        "Content-Type": "application/json",
      }

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }
      if (sessionId) {
        headers["x-session-id"] = sessionId
      }

      const response = await fetch(`${this.baseURL}/sessions`, {
        headers: headers,
      })

      if (response.ok) {
        const data = await response.json()
        return data.sessions || []
      }

      // If unauthorized, clear storage and redirect
      if (response.status === 401) {
        this.handleSessionExpired()
      }

      return []
    } catch (error) {
      console.error("Error fetching sessions:", error)
      return []
    }
  }

  async terminateSession(sessionIdToTerminate) {
    try {
      const accessToken = localStorage.getItem("accessToken")
      const sessionId = localStorage.getItem("sessionId")

      if (!accessToken && !sessionId) return false

      const headers = {
        "Content-Type": "application/json",
      }

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }
      if (sessionId) {
        headers["x-session-id"] = sessionId
      }

      const response = await fetch(`${this.baseURL}/sessions/${sessionIdToTerminate}`, {
        method: "DELETE",
        headers: headers,
      })

      return response.ok
    } catch (error) {
      console.error("Error terminating session:", error)
      return false
    }
  }
}

const sessionManager = new SessionManager()

export const startSessionMonitoring = () => {
  localStorage.setItem("loginTime", Date.now().toString())
  setTimeout(() => {
    sessionManager.startSessionCheck()
  }, 5000)
}

export const stopSessionMonitoring = () => {
  localStorage.removeItem("loginTime")
  sessionManager.stopSessionCheck()
}

export const handleAppFocus = () => {
  sessionManager.handleAppFocus()
}

export const getActiveSessions = () => {
  return sessionManager.getActiveSessions()
}

export const terminateSession = (sessionId) => {
  return sessionManager.terminateSession(sessionId)
}

export { sessionManager }
