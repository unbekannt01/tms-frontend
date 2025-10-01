"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  Button,
  Chip,
  InputAdornment,
  Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import API from "../api";
import { chatAPI } from "../services/chatService";
import { getSocket } from "../services/socket";
import { useNavigate } from "react-router-dom";
import {
  startSessionMonitoring,
  stopSessionMonitoring,
} from "../utils/SessionManager";

export default function Chat() {
  const navigate = useNavigate();
  const [self, setSelf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [online, setOnline] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const bottomRef = useRef(null);
  const activeConvoRef = useRef(null);

  useEffect(() => {
    activeConvoRef.current = activeConvo;
  }, [activeConvo]);

  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const sessionId = localStorage.getItem("sessionId");
    if (!userData || !sessionId) {
      console.log("[v0] Not logged in - redirecting to login");
      navigate("/login");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(userData);
      setSelf(parsed);
      startSessionMonitoring();
    } catch {
      localStorage.clear();
      navigate("/login");
      return;
    }

    Promise.all([
      API.get("/users").then((r) => r.data),
      chatAPI.listConversations(),
    ])
      .then(([allUsers, convos]) => {
        setConversations(convos || []);
        const myRole = parsed?.roleId?.name || "";
        let list = (allUsers || []).filter((u) => !u.isDeleted);
        if (myRole === "manager") {
          list = list.filter(
            (u) => u.roleId?.name !== "manager" && u.roleId?.name !== "admin"
          );
        } else {
          list = list.filter((u) => u.roleId?.name === "manager");
        }
        list = list.filter((u) => String(u._id) !== String(parsed?._id));
        setUsers(list);
      })
      .finally(() => setLoading(false));

    const onConnectError = (err) => {
      console.log("[v0] socket connect_error:", err?.message);
      if ((err?.message || "").toLowerCase().includes("unauthorized")) {
        navigate("/login");
      }
    };
    socket.on("connect_error", onConnectError);

    const onPresenceSnapshot = ({ users }) => {
      setOnline(() => {
        const map = {};
        (users || []).forEach((id) => {
          map[String(id)] = true;
        });
        return map;
      });
    };
    socket.on("presence:snapshot", onPresenceSnapshot);

    const onPresence = ({ userId, online: isOnline }) => {
      setOnline((prev) => ({ ...prev, [String(userId)]: !!isOnline }));
    };
    socket.on("presence:update", onPresence);

    const onMessage = async (msg) => {
      const current = activeConvoRef.current;

      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;

        const meId =
          String(
            (JSON.parse(localStorage.getItem("user") || "{}") || {})._id
          ) ||
          self?._id ||
          "";
        if (meId && String(msg.from) === meId) {
          const idx = prev.findIndex(
            (m) =>
              String(m._id || "").startsWith("tmp-") &&
              String(m.conversationId) === String(msg.conversationId) &&
              m.content === msg.content
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = msg;
            return next;
          }
        }

        return [...prev, msg];
      });

      if (current && String(msg.conversationId) === String(current._id)) {
        scrollToBottom();
      }

      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) => String(c._id) === String(msg.conversationId)
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            lastMessage: {
              from: msg.from,
              to: msg.to,
              content: msg.content,
              createdAt: msg.createdAt,
            },
            lastMessageAt: msg.createdAt,
          };
          const [moved] = next.splice(idx, 1);
          next.unshift(moved);
          return next;
        }
        return prev;
      });

      if (
        !conversations.some((c) => String(c._id) === String(msg.conversationId))
      ) {
        try {
          const me = self || JSON.parse(localStorage.getItem("user") || "{}");
          const otherId =
            String(msg.from) === String(me?._id)
              ? String(msg.to)
              : String(msg.from);
          const convo = await chatAPI.getOrCreateConversation(otherId);
          setConversations((prev) => {
            if (prev.some((c) => String(c._id) === String(convo._id)))
              return prev;
            return [
              {
                ...convo,
                lastMessage: {
                  from: msg.from,
                  to: msg.to,
                  content: msg.content,
                  createdAt: msg.createdAt,
                },
                lastMessageAt: msg.createdAt,
              },
              ...prev,
            ];
          });
        } catch (e) {
          console.log(
            "[v0] Failed to fetch new conversation on incoming message",
            e
          );
        }
      }
    };
    socket.on("chat:message", onMessage);

    const onDeleted = ({ conversationId }) => {
      setConversations((prev) =>
        prev.filter((c) => String(c._id) !== String(conversationId))
      );
      const current = activeConvoRef.current;
      if (current && String(current._id) === String(conversationId)) {
        setActiveConvo(null);
        setMessages([]);
      }
    };
    socket.on("chat:deleted", onDeleted);

    return () => {
      socket.off("chat:message", onMessage);
      socket.off("connect_error", onConnectError);
      socket.off("presence:update", onPresence);
      socket.off("presence:snapshot", onPresenceSnapshot);
      socket.off("chat:deleted", onDeleted);
      stopSessionMonitoring();
    };
  }, [socket, navigate]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectUser = async (target) => {
    setLoading(true);
    try {
      const convo = await chatAPI.getOrCreateConversation(target._id);
      setActiveConvo(convo);
      socket.emit("chat:join", { conversationId: convo._id });
      const msgs = await chatAPI.getMessages(convo._id);
      setMessages(msgs);
      setTimeout(scrollToBottom, 50);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (convo) => {
    setLoading(true);
    try {
      setActiveConvo(convo);
      socket.emit("chat:join", { conversationId: convo._id });
      const msgs = await chatAPI.getMessages(convo._id);
      setMessages(msgs);
      setTimeout(scrollToBottom, 50);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !activeConvo) return;
    const recipient =
      activeConvo.participants?.find(
        (p) => String(p._id || p) !== String(self._id)
      ) || users.find((u) => true);
    const payload = {
      conversationId: activeConvo._id,
      to: String(recipient?._id || recipient),
      content: input.trim(),
    };
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      conversationId: activeConvo._id,
      from: self._id,
      to: payload.to,
      content: payload.content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    scrollToBottom();

    socket.emit("chat:message", payload);
  };

  const deleteActiveConversation = async () => {
    if (!activeConvo) return;
    const confirm = window.confirm(
      "Delete this chat history for both participants? This cannot be undone."
    );
    if (!confirm) return;
    try {
      if (typeof chatAPI?.deleteConversation === "function") {
        await chatAPI.deleteConversation(activeConvo._id);
      } else {
        await API.delete(`/chat/conversations/${activeConvo._id}`);
      }
      setConversations((prev) =>
        prev.filter((c) => String(c._id) !== String(activeConvo._id))
      );
      setActiveConvo(null);
      setMessages([]);
    } catch (e) {
      console.log("[v0] delete conversation failed", e);
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const userName = (u.userName || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || userName.includes(query);
  });

  const filteredConversations = conversations.filter((c) => {
    const other =
      (c.participants || []).find((p) => String(p._id) !== String(self?._id)) ||
      {};
    const fullName = `${other.firstName || ""} ${
      other.lastName || ""
    }`.toLowerCase();
    const userName = (other.userName || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || userName.includes(query);
  });

  if (loading && !self) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#059669" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)",
        py: 3,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px 0 rgba(5, 150, 105, 0.3)",
              }}
            >
              <ChatBubbleOutlineIcon sx={{ color: "#fff", fontSize: 28 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Messages
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Stay connected with your team
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 2,
              borderColor: "#059669",
              color: "#059669",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              "&:hover": {
                borderColor: "#047857",
                backgroundColor: "rgba(5, 150, 105, 0.04)",
              },
            }}
          >
            Back
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "380px 1fr" },
            gap: 0,
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid rgba(6, 95, 70, 0.1)",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            minHeight: 700,
          }}
        >
          {/* Left Sidebar */}
          <Box
            sx={{
              bgcolor: "#fff",
              borderRight: { md: "1px solid #e5e7eb" },
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Search Bar */}
            <Box sx={{ p: 2.5, borderBottom: "1px solid #e5e7eb" }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#f9fafb",
                    "& fieldset": { borderColor: "#e5e7eb" },
                    "&:hover fieldset": { borderColor: "#059669" },
                    "&.Mui-focused fieldset": { borderColor: "#059669" },
                  },
                }}
              />
            </Box>

            {/* Conversations */}
            <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  color: "#6b7280",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                RECENT CHATS
              </Typography>
              <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
                <List dense sx={{ gap: 0.5 }}>
                  {filteredConversations.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "#9ca3af", textAlign: "center", py: 2 }}
                    >
                      No conversations found
                    </Typography>
                  ) : (
                    filteredConversations.map((c) => {
                      const other =
                        (c.participants || []).find(
                          (p) => String(p._id) !== String(self?._id)
                        ) || {};
                      const isActive =
                        activeConvo &&
                        String(activeConvo._id) === String(c._id);
                      return (
                        <ListItemButton
                          key={c._id}
                          onClick={() => selectConversation(c)}
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            py: 1.5,
                            px: 2,
                            transition: "all 0.2s",
                            "&:hover": { bgcolor: "#f3f4f6" },
                            ...(isActive
                              ? {
                                  bgcolor: "#ecfdf5",
                                  border: "1px solid #a7f3d0",
                                  "&:hover": { bgcolor: "#d1fae5" },
                                }
                              : {}),
                          }}
                        >
                          <Badge
                            overlap="circular"
                            anchorOrigin={{
                              vertical: "bottom",
                              horizontal: "right",
                            }}
                            variant="dot"
                            sx={{
                              mr: 1.5,
                              "& .MuiBadge-badge": {
                                backgroundColor: online[String(other._id)]
                                  ? "#10b981"
                                  : "#9ca3af",
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                border: "2px solid #fff",
                              },
                            }}
                          >
                            <Avatar
                              src={other.avatar?.url}
                              sx={{
                                width: 44,
                                height: 44,
                                fontSize: "1rem",
                                fontWeight: 600,
                                bgcolor: "#059669",
                              }}
                            >
                              {!other.avatar?.url &&
                                `${other.firstName?.[0] || ""}${
                                  other.lastName?.[0] || ""
                                }`}
                            </Avatar>
                          </Badge>
                          <ListItemText
                            primary={
                              `${other.firstName || ""} ${
                                other.lastName || ""
                              }`.trim() || other.userName
                            }
                            secondary={
                              c.lastMessage?.content || "Start chatting"
                            }
                            primaryTypographyProps={{
                              sx: {
                                fontWeight: 600,
                                fontSize: "0.95rem",
                                color: "#1f2937",
                              },
                            }}
                            secondaryTypographyProps={{
                              sx: {
                                color: "#6b7280",
                                fontSize: "0.85rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })
                  )}
                </List>
              </Box>
            </Box>

            {/* Available Users */}
            <Box
              sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  color: "#6b7280",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                {self?.roleId?.name === "manager" ? "TEAM MEMBERS" : "MANAGERS"}
              </Typography>
              <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 320 }}>
                <List dense sx={{ gap: 0.5 }}>
                  {filteredUsers.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "#9ca3af", textAlign: "center", py: 2 }}
                    >
                      No users found
                    </Typography>
                  ) : (
                    filteredUsers.map((u) => (
                      <ListItemButton
                        key={u._id}
                        onClick={() => selectUser(u)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          py: 1.5,
                          px: 2,
                          transition: "all 0.2s",
                          "&:hover": { bgcolor: "#f3f4f6" },
                        }}
                      >
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          variant="dot"
                          sx={{
                            mr: 1.5,
                            "& .MuiBadge-badge": {
                              backgroundColor: online[String(u._id)]
                                ? "#10b981"
                                : "#9ca3af",
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              border: "2px solid #fff",
                            },
                          }}
                        >
                          <Avatar
                            src={u.avatar?.url}
                            sx={{
                              width: 40,
                              height: 40,
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              bgcolor: "#6b7280",
                            }}
                          >
                            {!u.avatar?.url &&
                              `${u.firstName?.[0] || ""}${
                                u.lastName?.[0] || ""
                              }`}
                          </Avatar>
                        </Badge>
                        <ListItemText
                          primary={`${u.firstName} ${u.lastName}`}
                          secondary={
                            online[String(u._id)] ? "Online" : "Offline"
                          }
                          primaryTypographyProps={{
                            sx: {
                              fontWeight: 600,
                              fontSize: "0.9rem",
                              color: "#1f2937",
                            },
                          }}
                          secondaryTypographyProps={{
                            sx: {
                              color: online[String(u._id)]
                                ? "#059669"
                                : "#9ca3af",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                            },
                          }}
                        />
                      </ListItemButton>
                    ))
                  )}
                </List>
              </Box>
            </Box>
          </Box>

          {/* Right Chat Area */}
          <Box
            sx={{
              bgcolor: "#fafafa",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                p: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                bgcolor: "#fff",
              }}
            >
              {activeConvo ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {(() => {
                    const other =
                      (activeConvo.participants || []).find(
                        (p) => String(p._id) !== String(self?._id)
                      ) || {};
                    const isOnline = online[String(other._id)];
                    const name =
                      `${other.firstName || ""} ${
                        other.lastName || ""
                      }`.trim() ||
                      other.userName ||
                      "Conversation";
                    return (
                      <>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          variant="dot"
                          sx={{
                            "& .MuiBadge-badge": {
                              backgroundColor: isOnline ? "#10b981" : "#9ca3af",
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              border: "3px solid #fff",
                            },
                          }}
                        >
                          <Avatar
                            src={other.avatar?.url}
                            sx={{
                              width: 48,
                              height: 48,
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              bgcolor: "#059669",
                            }}
                          >
                            {!other.avatar?.url &&
                              `${other.firstName?.[0] || ""}${
                                other.lastName?.[0] || ""
                              }`}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "#1f2937",
                              lineHeight: 1.2,
                            }}
                          >
                            {name}
                          </Typography>
                          <Chip
                            label={isOnline ? "Online" : "Offline"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              bgcolor: isOnline ? "#dcfce7" : "#f3f4f6",
                              color: isOnline ? "#166534" : "#6b7280",
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              ) : (
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#6b7280" }}
                >
                  Select a conversation
                </Typography>
              )}
              {activeConvo && (
                <IconButton
                  onClick={deleteActiveConversation}
                  sx={{
                    color: "#dc2626",
                    "&:hover": { bgcolor: "#fee2e2" },
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              )}
            </Box>

            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {!activeConvo ? (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                  }}
                >
                  <ChatBubbleOutlineIcon
                    sx={{ fontSize: 64, mb: 2, opacity: 0.3 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    No conversation selected
                  </Typography>
                  <Typography variant="body2">
                    Pick a user from the sidebar to start chatting
                  </Typography>
                </Box>
              ) : loading && messages.length === 0 ? (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={28} sx={{ color: "#059669" }} />
                </Box>
              ) : (
                <>
                  {messages.map((m, idx) => {
                    const mine = String(m.from) === String(self._id);
                    const showAvatar =
                      idx === 0 ||
                      String(messages[idx - 1]?.from) !== String(m.from);
                    return (
                      <Box
                        key={m._id}
                        sx={{
                          display: "flex",
                          justifyContent: mine ? "flex-end" : "flex-start",
                          mb: 1.5,
                          alignItems: "flex-end",
                          gap: 1,
                        }}
                      >
                        {!mine && showAvatar && (
                          <Avatar
                            src={
                              activeConvo.participants.find(
                                (p) => String(p._id) === String(m.from)
                              )?.avatar?.url
                            }
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: "0.85rem",
                              bgcolor: "#6b7280",
                            }}
                          >
                            {(() => {
                              const sender = activeConvo.participants.find(
                                (p) => String(p._id) === String(m.from)
                              );
                              return `${sender?.firstName?.[0] || ""}${
                                sender?.lastName?.[0] || ""
                              }`;
                            })()}
                          </Avatar>
                        )}
                        {!mine && !showAvatar && <Box sx={{ width: 32 }} />}
                        <Box
                          sx={{
                            maxWidth: "65%",
                            px: 2,
                            py: 1.5,
                            borderRadius: 2.5,
                            bgcolor: mine ? "#059669" : "#fff",
                            color: mine ? "#fff" : "#1f2937",
                            boxShadow: mine
                              ? "0 2px 8px rgba(5, 150, 105, 0.25)"
                              : "0 1px 3px rgba(0, 0, 0, 0.1)",
                            ...(mine
                              ? {
                                  borderTopRightRadius: 6,
                                  borderBottomRightRadius: 6,
                                }
                              : {
                                  borderTopLeftRadius: 6,
                                  borderBottomLeftRadius: 6,
                                }),
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              whiteSpace: "pre-wrap",
                              fontSize: "0.95rem",
                              lineHeight: 1.5,
                              mb: 0.5,
                            }}
                          >
                            {m.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: mine ? 0.8 : 0.6,
                              fontSize: "0.7rem",
                              display: "block",
                              textAlign: "right",
                            }}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </Box>

            {/* Input Area */}
            <Box
              sx={{
                p: 2.5,
                borderTop: "1px solid #e5e7eb",
                bgcolor: "#fff",
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder={
                    activeConvo
                      ? "Type your message..."
                      : "Select a conversation to start"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!activeConvo}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!input.trim()) return;
                      send();
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "#f9fafb",
                      "& fieldset": { borderColor: "#e5e7eb" },
                      "&:hover fieldset": { borderColor: "#059669" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                  }}
                />
                <IconButton
                  onClick={send}
                  disabled={!activeConvo || !input.trim()}
                  sx={{
                    width: 48,
                    height: 48,
                    background:
                      !activeConvo || !input.trim()
                        ? "#e5e7eb"
                        : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: !activeConvo || !input.trim() ? "#9ca3af" : "#fff",
                    boxShadow:
                      !activeConvo || !input.trim()
                        ? "none"
                        : "0 4px 14px 0 rgba(5, 150, 105, 0.3)",
                    "&:hover": {
                      background:
                        !activeConvo || !input.trim()
                          ? "#e5e7eb"
                          : "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                      boxShadow:
                        !activeConvo || !input.trim()
                          ? "none"
                          : "0 6px 20px 0 rgba(5, 150, 105, 0.4)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
