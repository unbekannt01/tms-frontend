import { io } from "socket.io-client"

let socket

export function getSocket() {
  if (socket) return socket

  const apiUrl = import.meta.env.VITE_API_URL
  // Derive base origin from API URL (handles http://host:port/api)
  const baseOrigin = (() => {
    try {
      return new URL(apiUrl).origin
    } catch {
      return window.location.origin
    }
  })()

  socket = io(baseOrigin, {
    transports: ["websocket"],
    withCredentials: true,
    auth: {
      accessToken: localStorage.getItem("accessToken") || null,
    },
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    try {
      socket.disconnect()
    } catch (e) {
      console.log("[v0] socket disconnect error", e?.message)
    } finally {
      socket = undefined
    }
  }
}
