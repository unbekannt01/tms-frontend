"use client";

import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import Home from "./Page/Home";
import Login from "./Page/Login";
import Register from "./Page/Register";
import EmailVerification from "./Page/EmailVerification";
import VerificationSuccess from "./Page/VerificationSuccess";
import VerificationError from "./Page/VerificationError";
import Dashboard from "./Page/Dashboard";
import AdminDashboard from "./Page/AdminDashboard";
import ManagerDashboard from "./Page/ManagerDashboard";
import RoleManagement from "./Page/RoleManagement";
import Sessions from "./Page/Session";
import ForgotPassword from "./Page/ForgotPassword";
import VerifyOtp from "./Page/VerifyOtp";
import ResetPassword from "./Page/ResetPassword";
import Profile from "./Page/Profile";
import AdminTaskDashboard from "./Page/TaskDashboards/AdminTaskDashboard";
import ManagerTaskDashboard from "./Page/TaskDashboards/ManagerTaskDashboard";
import UserTaskDashboard from "./Page/TaskDashboards/UserTaskDashboard";
import {
  handleAppFocus,
  validateSessionNow,
  validateIfStale,
} from "./utils/SessionManager";
import UserManagement from "./Page/UserManagement";
import ThankYou from "./Page/ThankYou";

// Role-based Task Router
const TaskRouter = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role?.toLowerCase();

  console.log("[v1] TaskRouter - User data:", user);
  console.log("[v1] TaskRouter - Detected role:", userRole);

  if (userRole === "admin") {
    return <AdminTaskDashboard user={user} />;
  } else if (userRole === "manager") {
    return <ManagerTaskDashboard user={user} />;
  } else {
    return <UserTaskDashboard user={user} />;
  }
};

// Define routes
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
    // { path: "/direct-reset-password", element: <DirectResetPassword /> },
    { path: "/profile", element: <Profile /> },
    { path: "/tasks", element: <TaskRouter /> },
    { path: "/admin-tasks", element: <AdminTaskDashboard /> },
    { path: "/manager-tasks", element: <ManagerTaskDashboard /> },
    { path: "/user-tasks", element: <UserTaskDashboard /> },
    { path: "*", element: <Navigate to="/" /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

export default function App() {
  useEffect(() => {
    // Validate session immediately on app mount/refresh
    validateSessionNow();

    // Handle app focus and visibility changes for session validation
    const handleFocus = () => {
      handleAppFocus();
    };

    // Activity-driven lightweight validation
    const handleActivity = () => {
      validateIfStale(15000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleAppFocus();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <RouterProvider router={router} />;
}
