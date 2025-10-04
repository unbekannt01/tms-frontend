"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRoles,
  createRole,
  updateRole,
  assignRole,
  getUsers,
} from "../services/roleService";

const groupPermissions = (permissions) => {
  const groups = {
    task: [],
    user: [],
    role: [],
    project: [],
  };

  permissions.forEach((permission) => {
    const [resource] = permission.split(":");
    if (groups[resource]) {
      groups[resource].push(permission);
    }
  });

  return groups;
};

const RoleManagement = () => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([]);
  const [selectedRoleName, setSelectedRoleName] = useState("");

  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    permissions: [],
  });
  const [assignData, setAssignData] = useState({
    userId: "",
    roleId: "",
  });

  // Available permissions (you can expand this list)
  const availablePermissions = {
    task: [
      "task:create:own",
      "task:create:all",
      "task:read:own",
      "task:read:team",
      "task:read:all",
      "task:update:own",
      "task:update:team",
      "task:update:all",
      "task:delete:own",
      "task:delete:team",
      "task:delete:all",
      "task:assign",
    ],
    user: [
      "user:create",
      "user:read:own",
      "user:read:team",
      "user:read:all",
      "user:update:own",
      "user:update:team",
      "user:update:all",
      "user:delete:all",
    ],
    role: ["role:assign", "role:manage"],
    project: [
      "project:create",
      "project:read:own",
      "project:read:team",
      "project:read:all",
      "project:update:own",
      "project:update:team",
      "project:update:all",
      "project:delete:own",
      "project:delete:team",
      "project:delete:all",
      "project:manage",
    ],
  };

  useEffect(() => {
    // Check authentication and permissions
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setCurrentUser(parsedUser);

    // Check if user has role management permissions
    const userPermissions = parsedUser.roleId?.permissions || [];
    const hasRoleManagePermission =
      userPermissions.includes("role:manage") ||
      parsedUser.roleId?.name === "admin";

    if (!hasRoleManagePermission) {
      setError("You don't have permission to manage roles");
      return;
    }

    const fetchData = async () => {
      try {
        const [rolesData, usersData] = await Promise.all([
          getRoles(),
          getUsers(),
        ]);
        setRoles(rolesData);
        setUsers(usersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await createRole(formData);
      const rolesData = await getRoles();
      setRoles(rolesData);
      setShowCreateForm(false);
      setFormData({
        name: "",
        displayName: "",
        description: "",
        permissions: [],
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await updateRole(editingRole._id, formData);
      const rolesData = await getRoles();
      setRoles(rolesData);
      setEditingRole(null);
      setFormData({
        name: "",
        displayName: "",
        description: "",
        permissions: [],
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      await assignRole(assignData.userId, assignData.roleId);
      setShowAssignForm(false);
      setAssignData({ userId: "", roleId: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePermissionChange = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const startEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions || [],
    });
  };

  const showAllPermissions = (role) => {
    setSelectedRolePermissions(role.permissions || []);
    setSelectedRoleName(role.displayName || role.name);
    setShowPermissionModal(true);
  };

  const formatPermission = (permission) => {
    return permission
      .split(":")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            backgroundColor: "white",
            padding: "3rem",
            borderRadius: "1rem",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(6, 95, 70, 0.1)",
            maxWidth: "24rem",
            width: "90%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                animation: "spin 2s linear infinite",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "4px solid #e5e7eb",
                  borderTopColor: "#059669",
                }}
              />
            </div>
          </div>
          <p
            style={{
              marginTop: "0.5rem",
              color: "#1f2937",
              fontWeight: "600",
              fontSize: "1.125rem",
            }}
          >
            Loading roles...
          </p>
          <p
            style={{
              marginTop: "0.5rem",
              color: "#6b7280",
              fontSize: "0.875rem",
            }}
          >
            Please wait while we fetch your role data
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.75rem",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(6, 95, 70, 0.1)",
            maxWidth: "28rem",
          }}
        >
          <div
            style={{
              width: "4rem",
              height: "4rem",
              backgroundColor: "#fef2f2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <span style={{ color: "#dc2626", fontSize: "1.5rem" }}>⚠️</span>
          </div>
          <p
            style={{
              color: "#dc2626",
              marginBottom: "1.5rem",
              fontWeight: "500",
            }}
          >
            {error}
          </p>
          <button
            onClick={() => navigate("/admin-dashboard")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              color: "white",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              transition: "all 0.2s ease-in-out",
            }}
            onMouseEnter={(e) =>
              (e.target.style.background =
                "linear-gradient(135deg, #047857 0%, #065f46 100%)")
            }
            onMouseLeave={(e) =>
              (e.target.style.background =
                "linear-gradient(135deg, #059669 0%, #047857 100%)")
            }
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "auto",
      }}
    >
      <header
        style={{
          backgroundColor: "#ffffff",
          padding: "1.5rem 0",
          borderBottom: "1px solid rgba(6, 95, 70, 0.1)",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "1rem",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1.25rem",
                }}
              >
                R
              </span>
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  margin: 0,
                }}
              >
                Role Management
              </h1>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  margin: "0.25rem 0 0 0",
                }}
              >
                Configure user roles and permissions
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin-dashboard")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "transparent",
              color: "#059669",
              border: "1px solid #059669",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "500",
              transition: "all 0.2s ease-in-out",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(5, 150, 105, 0.04)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease-in-out",
                boxShadow: "0 4px 14px 0 rgba(5, 150, 105, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.target.style.background =
                  "linear-gradient(135deg, #047857 0%, #065f46 100%)";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow =
                  "0 6px 20px 0 rgba(5, 150, 105, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background =
                  "linear-gradient(135deg, #059669 0%, #047857 100%)";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 14px 0 rgba(5, 150, 105, 0.3)";
              }}
            >
              + Create Role
            </button>
            <button
              onClick={() => setShowAssignForm(true)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#ffffff",
                color: "#059669",
                border: "1px solid #059669",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(5, 150, 105, 0.04)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#ffffff";
                e.target.style.transform = "translateY(0)";
              }}
            >
              👤 Assign Role
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {roles.map((role) => (
              <div
                key={role._id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  border: "1px solid rgba(6, 95, 70, 0.1)",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        background:
                          "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "1.25rem",
                        }}
                      >
                        {role.displayName?.charAt(0) ||
                          role.name?.charAt(0) ||
                          "R"}
                      </span>
                    </div>

                    {/* Role Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <h3
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: "600",
                            margin: 0,
                            color: "#1f2937",
                          }}
                        >
                          {role.displayName || role.name}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            margin: "0.25rem 0 0 0",
                          }}
                        >
                          @{role.name}
                        </p>
                      </div>

                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          marginBottom: "1rem",
                          lineHeight: "1.5",
                        }}
                      >
                        {role.description}
                      </p>

                      {/* Permissions */}
                      <div style={{ marginBottom: "1rem" }}>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            marginBottom: "0.5rem",
                            fontWeight: "500",
                          }}
                        >
                          Permissions ({role.permissions?.length || 0})
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                          }}
                        >
                          {role.permissions?.slice(0, 4).map((permission) => (
                            <span
                              key={permission}
                              style={{
                                padding: "0.25rem 0.75rem",
                                backgroundColor: "#f0fdf4",
                                color: "#059669",
                                border: "1px solid #bbf7d0",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                              }}
                            >
                              {permission}
                            </span>
                          ))}
                          {role.permissions?.length > 4 && (
                            <span
                              onClick={() => showAllPermissions(role)}
                              style={{
                                padding: "0.25rem 0.75rem",
                                background:
                                  "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                color: "white",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background =
                                  "linear-gradient(135deg, #047857 0%, #065f46 100%)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background =
                                  "linear-gradient(135deg, #059669 0%, #047857 100%)";
                              }}
                            >
                              +{role.permissions.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => startEdit(role)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          backgroundColor: "#f9fafb",
                          color: "#059669",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          transition: "all 0.2s ease-in-out",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor =
                            "rgba(5, 150, 105, 0.04)";
                          e.target.style.borderColor = "#059669";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#f9fafb";
                          e.target.style.borderColor = "#e5e7eb";
                        }}
                      >
                        ✏️ Edit Role
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(showCreateForm || editingRole) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              maxWidth: "32rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    background:
                      "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "0.75rem",
                  }}
                >
                  <span style={{ color: "white", fontSize: "0.875rem" }}>
                    {editingRole ? "✏️" : "+"}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {editingRole ? "Edit Role" : "Create New Role"}
                </h3>
              </div>
              <form
                onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Role Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      placeholder="e.g., admin, manager, user"
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#059669";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(5, 150, 105, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      placeholder="e.g., Administrator, Task Manager, Regular User"
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#059669";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(5, 150, 105, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        resize: "vertical",
                        minHeight: "5rem",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      placeholder="Describe the role and its responsibilities..."
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#059669";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(5, 150, 105, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Permissions
                    </label>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                      }}
                    >
                      {/* Task Permissions */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.75rem",
                            paddingBottom: "0.5rem",
                            borderBottom: "2px solid #059669",
                          }}
                        >
                          <span
                            style={{ fontSize: "1rem", marginRight: "0.5rem" }}
                          >
                            📋
                          </span>
                          <h4
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              color: "#059669",
                              margin: 0,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Task Permissions
                          </h4>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: "0.5rem",
                          }}
                        >
                          {availablePermissions.task.map((permission) => (
                            <label
                              key={permission}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0.5rem 0.75rem",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.375rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                backgroundColor: formData.permissions.includes(
                                  permission
                                )
                                  ? "#f0fdf4"
                                  : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (
                                  !formData.permissions.includes(permission)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "#f9fafb";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (
                                  !formData.permissions.includes(permission)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(
                                  permission
                                )}
                                onChange={() =>
                                  handlePermissionChange(permission)
                                }
                                style={{
                                  marginRight: "0.5rem",
                                  width: "1rem",
                                  height: "1rem",
                                  accentColor: "#059669",
                                  cursor: "pointer",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#374151",
                                  fontWeight: "500",
                                }}
                              >
                                {permission.split(":").slice(1).join(":")}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* User Permissions */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.75rem",
                            paddingBottom: "0.5rem",
                            borderBottom: "2px solid #3b82f6",
                          }}
                        >
                          <span
                            style={{ fontSize: "1rem", marginRight: "0.5rem" }}
                          >
                            👤
                          </span>
                          <h4
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              color: "#3b82f6",
                              margin: 0,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            User Permissions
                          </h4>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: "0.5rem",
                          }}
                        >
                          {availablePermissions.user.map((permission) => (
                            <label
                              key={permission}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0.5rem 0.75rem",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.375rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                backgroundColor: formData.permissions.includes(
                                  permission
                                )
                                  ? "#eff6ff"
                                  : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (
                                  !formData.permissions.includes(permission)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "#f9fafb";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (
                                  !formData.permissions.includes(permission)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(
                                  permission
                                )}
                                onChange={() =>
                                  handlePermissionChange(permission)
                                }
                                style={{
                                  marginRight: "0.5rem",
                                  width: "1rem",
                                  height: "1rem",
                                  accentColor: "#3b82f6",
                                  cursor: "pointer",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#374151",
                                  fontWeight: "500",
                                }}
                              >
                                {permission.split(":").slice(1).join(":")}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Role Permissions */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.75rem",
                            paddingBottom: "0.5rem",
                            borderBottom: "2px solid #8b5cf6",
                          }}
                        >
                          <span
                            style={{ fontSize: "1rem", marginRight: "0.5rem" }}
                          >
                            🔐
                          </span>
                          <h4
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              color: "#8b5cf6",
                              margin: 0,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Role Permissions
                          </h4>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: "0.5rem",
                          }}
                        >
                          {availablePermissions.role.map((permission) => (
                            <label
                              key={permission}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0.5rem 0.75rem",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.375rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                backgroundColor: formData.permissions.includes(
                                  permission
                                )
                                  ? "#f5f3ff"
                                  : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (
                                  !formData.permissions.includes(permission)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "#f9fafb";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (
                                  !formData.permissions.includes(permission)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(
                                  permission
                                )}
                                onChange={() =>
                                  handlePermissionChange(permission)
                                }
                                style={{
                                  marginRight: "0.5rem",
                                  width: "1rem",
                                  height: "1rem",
                                  accentColor: "#8b5cf6",
                                  cursor: "pointer",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#374151",
                                  fontWeight: "500",
                                }}
                              >
                                {permission.split(":").slice(1).join(":")}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Project Permissions */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.75rem",
                            paddingBottom: "0.5rem",
                            borderBottom: "2px solid #f59e0b",
                          }}
                        >
                          <span
                            style={{ fontSize: "1rem", marginRight: "0.5rem" }}
                          >
                            📁
                          </span>
                          <h4
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              color: "#f59e0b",
                              margin: 0,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Project Permissions
                          </h4>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: "0.5rem",
                          }}
                        >
                          {availablePermissions.project.map((permission) => (
                            <label
                              key={permission}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0.5rem 0.75rem",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.375rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                backgroundColor: formData.permissions.includes(
                                  permission
                                )
                                  ? "#fffbeb"
                                  : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (
                                  !formData.permissions.includes(permission)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "#f9fafb";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (
                                  !formData.permissions.includes(permission)
                                ) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(
                                  permission
                                )}
                                onChange={() =>
                                  handlePermissionChange(permission)
                                }
                                style={{
                                  marginRight: "0.5rem",
                                  width: "1rem",
                                  height: "1rem",
                                  accentColor: "#f59e0b",
                                  cursor: "pointer",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#374151",
                                  fontWeight: "500",
                                }}
                              >
                                {permission.split(":").slice(1).join(":")}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingRole(null);
                      setFormData({
                        name: "",
                        displayName: "",
                        description: "",
                        permissions: [],
                      });
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      color: "#374151",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#e5e7eb")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.75rem 1.5rem",
                      background:
                        "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "white",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "all 0.2s ease-in-out",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.background =
                        "linear-gradient(135deg, #047857 0%, #065f46 100%)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background =
                        "linear-gradient(135deg, #059669 0%, #047857 100%)")
                    }
                  >
                    {editingRole ? "Update Role" : "Create Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              maxWidth: "28rem",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    backgroundColor: "#dcfce7",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "0.75rem",
                  }}
                >
                  <span style={{ color: "#16a34a", fontSize: "0.875rem" }}>
                    👤
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Assign Role to User
                </h3>
              </div>
              <form onSubmit={handleAssignRole}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Select User
                    </label>
                    <select
                      value={assignData.userId}
                      onChange={(e) =>
                        setAssignData((prev) => ({
                          ...prev,
                          userId: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        backgroundColor: "white",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#10b981";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(16, 185, 129, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <option value="">Choose a user...</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email}) -
                          Current Role: {user.roleId?.name || "No Role"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Select Role
                    </label>
                    <select
                      value={assignData.roleId}
                      onChange={(e) =>
                        setAssignData((prev) => ({
                          ...prev,
                          roleId: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        backgroundColor: "white",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = "#10b981";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(16, 185, 129, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <option value="">Choose a role...</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.displayName} ({role.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignForm(false);
                      setAssignData({ userId: "", roleId: "" });
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      color: "#374151",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#e5e7eb")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#10b981",
                      color: "white",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#059669")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#10b981")
                    }
                  >
                    Assign Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPermissionModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowPermissionModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "2rem",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                {selectedRoleName} Permissions
              </h3>
              <button
                onClick={() => setShowPermissionModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "0.25rem",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  margin: "0 0 1rem 0",
                }}
              >
                Total permissions: {selectedRolePermissions.length}
              </p>
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {selectedRolePermissions.map((permission, index) => (
                <div
                  key={index}
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "500", color: "#1f2937" }}>
                    {formatPermission(permission)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      fontFamily: "monospace",
                    }}
                  >
                    {permission}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button
                onClick={() => setShowPermissionModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
