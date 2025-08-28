/* eslint-disable no-unused-vars */
// Frontend session management utility for JWT + session-based auth
class SessionManager {
  constructor() {
    this.checkInterval = null
    this.isChecking = false
    this.baseURL = import.meta.env.VITE_API_URL
    this.lastValidationAt = 0
  }

  startSessionCheck() {
    // Clear any existing interval
    this.stopSessionCheck()

    // Start periodic checks after 1 minute
    setTimeout(() => {
      this.checkInterval = setInterval(() => {
        this.validateSession()
      }, 60000) // Check every 1 minute
    }, 60000)
  }

  stopSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  async validateSession() {
    if (this.isChecking) return

    const sessionId = localStorage.getItem("sessionId")
    const accessToken = localStorage.getItem("accessToken") // <CHANGE> Get JWT token
    
    if (!sessionId) {
      this.handleSessionExpired()
      return
    }

    // <CHANGE> Check token expiration client-side first
    if (accessToken) {
      const tokenExpiresAt = localStorage.getItem("tokenExpiresAt")
      if (tokenExpiresAt && new Date() > new Date(tokenExpiresAt)) {
        this.handleSessionExpired("token_expired")
        return
      }
    }

    this.isChecking = true

    try {
      // <CHANGE> Send both session ID and JWT token for validation
      const headers = {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      }
      
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      const response = await fetch(`${this.baseURL}/session/check`, {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}))
          if (errorData.message?.includes("JWT") || errorData.message?.includes("token")) {
            this.handleSessionExpired("token_expired")
          } else {
            this.handleSessionExpired("session_expired")
          }
        }
      } else {
        this.lastValidationAt = Date.now()
      }
    } catch (error) {
      // Don't logout on network errors
    } finally {
      this.isChecking = false
    }
  }

  handleSessionExpired(reason = "session_expired") {
    // <CHANGE> Clear all authentication data including JWT token
    localStorage.removeItem("sessionId")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("tokenExpiresAt")
    localStorage.removeItem("user")
    localStorage.removeItem("resetToken")
    localStorage.removeItem("resetEmail")
    localStorage.removeItem("loginTime")

    // Stop session checking
    this.stopSessionCheck()
    this.lastValidationAt = 0

    // Check if we're already on an auth page
    const currentPath = window.location.pathname
    const authPaths = ["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password", "/"]

    if (!authPaths.includes(currentPath)) {
      window.location.href = `/login?reason=${reason}`
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
      const sessionId = localStorage.getItem("sessionId")
      const accessToken = localStorage.getItem("accessToken")
      
      if (!sessionId) return []

      // <CHANGE> Send both session ID and JWT token
      const headers = {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      }
      
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      const response = await fetch(`${this.baseURL}/sessions`, {
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        return data.sessions || []
      }
      return []
    } catch (error) {
      return []
    }
  }

  async terminateSession(sessionIdToTerminate) {
    try {
      const currentSessionId = localStorage.getItem("sessionId")
      const accessToken = localStorage.getItem("accessToken") // <CHANGE> Get JWT token
      
      if (!currentSessionId) return false

      // <CHANGE> Send both session ID and JWT token
      const headers = {
        "Content-Type": "application/json",
        "x-session-id": currentSessionId,
      }
      
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      const response = await fetch(`${this.baseURL}/sessions/${sessionIdToTerminate}`, {
        method: "DELETE",
        headers,
      })

      return response.ok
    } catch (error) {
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

// Force an immediate validation (used on app load/refresh)
export const validateSessionNow = () => {
  return sessionManager.validateSession()
}

export { sessionManager }

// Non-blocking validation if last check is stale
export const validateIfStale = (thresholdMs = 15000) => {
  const last = sessionManager.lastValidationAt || 0
  if (Date.now() - last >= thresholdMs) {
    setTimeout(() => {
      sessionManager.validateSession()
    }, 0)
  }
}