import API from "../api"

export const chatAPI = {
  listConversations: () => API.get("/chat/conversations").then((r) => r.data),
  getOrCreateConversation: (targetUserId) => API.post("/chat/conversations", { targetUserId }).then((r) => r.data),
  getMessages: (conversationId, params = {}) =>
    API.get(`/chat/conversations/${conversationId}/messages`, {
      params,
    }).then((r) => r.data),
  sendMessage: (payload) => API.post("/chat/messages", payload).then((r) => r.data),
  markRead: (conversationId) => API.post("/chat/read", { conversationId }),
  deleteConversation: (conversationId) => API.delete(`/chat/conversations/${conversationId}`).then((r) => r.data),
}
