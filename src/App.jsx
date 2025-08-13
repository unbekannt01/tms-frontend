"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import Home from "./Page/Home"
import Login from "./Page/Login"
import Register from "./Page/Register"
import Dashboard from "./Page/Dashboard"
import Sessions from "./Page/Session"
import ForgotPassword from "./Page/ForgotPassword"
import VerifyOtp from "./Page/VerifyOtp"
import ResetPassword from "./Page/ResetPassword"
import { handleAppFocus } from "./utils/SessionManager"

export default function App() {
  useEffect(() => {
    // Handle app focus and visibility changes for session validation
    const handleFocus = () => {
      handleAppFocus()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleAppFocus()
      }
    }

    // Add event listeners
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}
