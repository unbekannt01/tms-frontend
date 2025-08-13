/* eslint-disable no-unused-vars */
// Frontend session management utility for session-based auth
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
      }, 5000) // Check every minute
    }, 5000)
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
    if (!sessionId) {
      this.handleSessionExpired()
      return
    }

    this.isChecking = true

    try {
      const response = await fetch(`${this.baseURL}/session/check`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.handleSessionExpired()
        }
      }
    } catch (error) {
      // Don't logout on network errors
    } finally {
      this.isChecking = false
    }
  }

  handleSessionExpired() {
    // Clear local storage
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
      const sessionId = localStorage.getItem("sessionId")
      if (!sessionId) return []

      const response = await fetch(`${this.baseURL}/sessions`, {
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
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
      if (!currentSessionId) return false

      const response = await fetch(`${this.baseURL}/sessions/${sessionIdToTerminate}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": currentSessionId,
        },
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

export { sessionManager }
