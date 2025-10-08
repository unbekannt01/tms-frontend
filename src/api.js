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

// Security API helpers
export const securityAPI = {
  // Complete security setup (used in migration popup)
  completeSecuritySetup: (securityQuestions) =>
    API.post("/complete-security-setup", { securityQuestions }),

  // Set security questions
  setSecurityQuestions: (userId, securityQuestions) =>
    API.post("/setSecurityQuestions", { userId, securityQuestions }),

  // Get security questions for password reset
  getSecurityQuestions: (email) =>
    API.get(`/getSecurityQuestions?email=${email}`),

  // Verify security answers
  verifySecurityAnswers: (email, answers) =>
    API.post("/verifySecurityAnswers", { email, answers }),

  // Reset password with security questions
  resetPasswordWithSecurityQuestions: (email, securityAnswers, newPassword) =>
    API.post("/reset-password-with-security-answers", {
      email,
      securityAnswers,
      newPassword,
    }),

  // Reset password with backup code
  resetPasswordWithBackupCode: (email, code, newPassword) =>
    API.post("/reset-password-with-backup-code", {
      email,
      code,
      newPassword,
    }),
};

// NEW: Project API helpers
export const projectAPI = {
  // Create a new project
  createProject: (projectData) => API.post("/projects", projectData),

  // Get all projects with filters and pagination
  getProjects: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return API.get(`/projects?${searchParams}`);
  },

  // Get project by ID with tasks
  getProjectById: (projectId) => API.get(`/projects/${projectId}`),

  // Update project
  updateProject: (projectId, projectData) =>
    API.put(`/projects/${projectId}`, projectData),

  // Delete project
  deleteProject: (projectId) => API.delete(`/projects/${projectId}`),

  // Archive/Unarchive project
  toggleArchiveProject: (projectId) =>
    API.patch(`/projects/${projectId}/archive`),

  // Add team member to project
  addTeamMember: (projectId, userId, role = "developer") =>
    API.post(`/projects/${projectId}/team`, { userId, role }),

  // Remove team member from project
  removeTeamMember: (projectId, userId) =>
    API.delete(`/projects/${projectId}/team/${userId}`),

  // Get project statistics
  getProjectStats: () => API.get("/projects/stats"),

  // Get projects for dropdown (simple list)
  getProjectsList: () => API.get("/projects?limit=100&fields=name"),
};

// UPDATED: Task API helpers (now with project support)
export const taskAPI = {
  // Create task with project support
  createTask: (taskData) => API.post("/tasks", taskData),

  // Get tasks with project filtering
  getTasks: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return API.get(`/tasks?${searchParams}`);
  },

  // Get task by ID
  getTaskById: (taskId) => API.get(`/tasks/${taskId}`),

  // Update task
  updateTask: (taskId, taskData) => API.put(`/tasks/${taskId}`, taskData),

  // Delete task
  deleteTask: (taskId) => API.delete(`/tasks/${taskId}`),

  // Add comment to task
  addComment: (taskId, comment) =>
    API.post(`/tasks/${taskId}/comments`, { text: comment }),

  // Get task statistics
  getTaskStats: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return API.get(`/tasks/stats?${searchParams}`);
  },

  // Enhance task description with AI
  enhanceDescription: (title, description) =>
    API.post("/tasks/enhance-description", { title, description }),
};

// Maintenance API helpers
export const maintenanceAPI = {
  getStatus: () => API.get("/system/maintenance"),
  setStatus: (active, message) =>
    API.post("/admin/system/maintenance", { active, message }),
};

export default API;
