import API from "../api.js"

// Create a new role
export const createRole = async (roleData) => {
  try {
    const response = await API.post("/roles", roleData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Get all roles
export const getRoles = async () => {
  try {
    const response = await API.get("/roles")
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Update a role
export const updateRole = async (roleId, roleData) => {
  try {
    const response = await API.put(`/roles/${roleId}`, roleData)
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Assign role to user
export const assignRole = async (userId, roleId) => {
  try {
    const response = await API.post("/roles/assign", { userId, roleId })
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// Get all users (for role assignment)
export const getUsers = async () => {
  try {
    const response = await API.get("/users")
    return response.data
  } catch (error) {
    throw error.response?.data || error
  }
}
