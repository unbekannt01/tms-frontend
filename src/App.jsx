"use client"

import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import { useEffect } from "react"
import Home from "./Page/Home"
import Login from "./Page/Login"
import Register from "./Page/Register"
import EmailVerification from "./Page/EmailVerification"
import VerificationSuccess from "./Page/VerificationSuccess"
import VerificationError from "./Page/VerificationError"
import Dashboard from "./Page/Dashboard"
import AdminDashboard from "./Page/AdminDashboard"
import ManagerDashboard from "./Page/ManagerDashboard"
import RoleManagement from "./Page/RoleManagement"
import Sessions from "./Page/Session"
import ForgotPassword from "./Page/ForgotPassword"
import VerifyOtp from "./Page/VerifyOtp"
import ResetPassword from "./Page/ResetPassword"
import ResetWithBackupCode from "./Page/ResetWithBackupCode"
import ResetWithSecurityQuestions from "./Page/ResetWithSecurityQuestions"
import Profile from "./Page/Profile"
import AdminTaskDashboard from "./Page/TaskDashboards/AdminTaskDashboard"
import ManagerTaskDashboard from "./Page/TaskDashboards/ManagerTaskDashboard"
import UserTaskDashboard from "./Page/TaskDashboards/UserTaskDashboard"
import { handleAppFocus, validateSessionNow, validateIfStale } from "./utils/SessionManager"
import UserManagement from "./Page/UserManagement"
import ThankYou from "./Page/ThankYou"
import Chat from "./Page/Chat.jsx"

// Public paths to skip session validation
const publicPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
  "/reset-backup-code",
  "/reset-security-questions",
  "/",
]

// Role-based task router
const TaskRouter = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const userRole = user?.role?.toLowerCase()

  if (userRole === "admin") return <AdminTaskDashboard user={user} />
  if (userRole === "manager") return <ManagerTaskDashboard user={user} />
  return <UserTaskDashboard user={user} />
}

// Routes
const router = createBrowserRouter(
  [
    { path: "/", element: <Home /> },
    { path: "/thank-you", element: <ThankYou /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/email-verification", element: <EmailVerification /> },
    { path: "/verification-success", element: <VerificationSuccess /> },
    { path: "/verification-error", element: <VerificationError /> },
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/admin-dashboard", element: <AdminDashboard /> },
    { path: "/user-management", element: <UserManagement /> },
    { path: "/manager-dashboard", element: <ManagerDashboard /> },
    { path: "/role-management", element: <RoleManagement /> },
    { path: "/sessions", element: <Sessions /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/verify-otp", element: <VerifyOtp /> },
    { path: "/reset-password", element: <ResetPassword /> },
    { path: "/reset-backup-code", element: <ResetWithBackupCode /> },
    {
      path: "/reset-security-questions",
      element: <ResetWithSecurityQuestions />,
    },
    { path: "/profile", element: <Profile /> },
    { path: "/tasks", element: <TaskRouter /> },
    { path: "/admin-tasks", element: <AdminTaskDashboard /> },
    { path: "/manager-tasks", element: <ManagerTaskDashboard /> },
    { path: "/user-tasks", element: <UserTaskDashboard /> },
    { path: "/chat", element: <Chat /> },
    { path: "*", element: <Navigate to="/" /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
)

export default function App() {
  useEffect(() => {
    const currentPath = window.location.pathname

    // Only validate sessions for non-public pages
    if (!publicPaths.includes(currentPath)) validateSessionNow()

    const handleFocus = () => {
      if (!publicPaths.includes(currentPath)) handleAppFocus()
    }
    const handleActivity = () => {
      if (!publicPaths.includes(currentPath)) validateIfStale(15000)
    }
    const handleVisibilityChange = () => {
      if (!document.hidden && !publicPaths.includes(currentPath)) handleAppFocus()
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener("click", handleActivity, { passive: true })
    window.addEventListener("keydown", handleActivity, { passive: true })
    window.addEventListener("touchstart", handleActivity, { passive: true })
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("click", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      window.removeEventListener("touchstart", handleActivity)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return <RouterProvider router={router} />
}
