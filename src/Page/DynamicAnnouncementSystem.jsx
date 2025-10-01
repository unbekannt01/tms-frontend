// src/Page/DynamicAnnouncementSystem.jsx
// 🎯 SUPER EASY TO EDIT - Just modify the ANNOUNCEMENTS array below!
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import ChatIcon from "@mui/icons-material/Chat";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import BuildIcon from "@mui/icons-material/Build";
import { useNavigate } from "react-router-dom";

// ============================================
// 🎨 EDIT ANNOUNCEMENTS HERE - SUPER SIMPLE!
// ============================================

const ANNOUNCEMENTS = [
  {
    // 🔐 SECURITY SETUP ANNOUNCEMENT
    id: "security-setup-v1",
    enabled: true, // Set to false to disable
    title: "Hold Up! Your Account Needs a Superhero Cape! 🦸",
    subtitle: "2-Minute Setup for Maximum Protection",
    icon: SecurityIcon,
    iconColor: "#f59e0b",
    emoji: "🔐",
    badge: "IMPLEMENTED",
    badgeColor: "#10b981",
    content: [
      {
        type: "text",
        text: "Hey there, awesome user! 👋 We've got something super important (and super easy) for you to do!"
      },
      {
        type: "feature",
        icon: "🛡️",
        title: "Set up Security Questions",
        description: "Think of them as your secret handshake with TaskFlow!"
      },
      {
        type: "feature",
        icon: "🎫",
        title: "Save Your Backup Code",
        description: "It's like a golden ticket to get back in if you ever forget your password. (We've all been there, no judgment! 😅)"
      },
      {
        type: "callout",
        style: "success",
        text: "✅ This feature is LIVE and ready to use! Protect your account in just 2 minutes!"
      }
    ],
    actionButton: {
      label: "Set Up Now 🚀",
      link: "/profile"
    }
  },

  {
    // 🖼️ PROFILE PICTURE ANNOUNCEMENT
    id: "profile-picture-v1",
    enabled: true,
    title: "Show Off Your Beautiful Face! 📸",
    subtitle: "Personalize Your Profile with a Cool Avatar",
    icon: AccountCircleIcon,
    iconColor: "#06b6d4",
    emoji: "🖼️",
    badge: "IMPLEMENTED",
    badgeColor: "#10b981",
    content: [
      {
        type: "text",
        text: "Time to ditch that boring default avatar and show the world who you are! ✨"
      },
      {
        type: "feature",
        icon: "📸",
        title: "Upload Your Profile Picture",
        description: "Make your profile pop with a custom photo!"
      },
      {
        type: "feature",
        icon: "🎨",
        title: "Choose Your Avatar",
        description: "Pick from our cool collection of avatars or upload your own masterpiece!"
      },
      {
        type: "list",
        title: "✨ Why it's awesome:",
        items: [
          "Stand out in team chats! 💬",
          "Look professional (or fun, we don't judge!) 🎭",
          "Your colleagues will know it's you instantly! 👋",
          "It takes 30 seconds and makes you look 100% cooler! 😎"
        ]
      },
      {
        type: "callout",
        style: "success",
        text: "✅ This feature is LIVE! Upload your photo and make your profile shine!"
      }
    ],
    actionButton: {
      label: "Upload Photo Now 📸",
      link: "/profile"
    }
  },

  {
    // 💬 CHAT FEATURE ANNOUNCEMENT - ✅ ADDED BACK!
    id: "chat-feature-v1",
    enabled: true,
    title: "New Feature Alert! Slide Into Your Manager's DMs! 🎉",
    subtitle: "Direct Messaging Is Here!",
    icon: ChatIcon,
    iconColor: "#8b5cf6",
    emoji: "💬",
    badge: "IMPLEMENTED",
    badgeColor: "#10b981",
    content: [
      {
        type: "text",
        text: "Guess what? We just dropped something HOT! 🔥"
      },
      {
        type: "feature",
        icon: "📱",
        title: "Direct Chat Feature",
        description: "Now you can chat with your manager without awkward emails or waiting for meetings!"
      },
      {
        type: "list",
        title: "✨ Why it's awesome:",
        items: [
          "Quick questions? Instant answers! ⚡",
          "No more 'checking email' limbo 📧",
          "Real-time conversations (like texting, but professional!) 💼",
          "Attach files, share updates, be productive! 🚀"
        ]
      },
      {
        type: "callout",
        style: "success",
        text: "✅ This feature is LIVE! Look for the chat icon in your dashboard sidebar!"
      }
    ],
    actionButton: {
      label: "Try Chat Now 💬",
      link: "/chat"
    }
  },

  // ============================================
  // 🚀 UPCOMING FEATURE ANNOUNCEMENT
  // ============================================
  {
    id: "sprint-project-management-v1",
    enabled: true,
    title: "🚀 Coming Soon: Sprint & Project Management!",
    subtitle: "We're Building Your Next Productivity Superpower",
    icon: BuildIcon,
    iconColor: "#10b981",
    emoji: "🚀",
    badge: "COMING SOON",
    badgeColor: "#f59e0b",
    content: [
      {
        type: "text",
        text: "Our development team is working hard on something AMAZING! Get ready for a complete project management suite that will revolutionize how you work! 🔥"
      },
      {
        type: "feature",
        icon: "🏗️",
        title: "Sprint & Project Management",
        description: "Manager creates projects, assigns them to specific users, and users can only view their own projects and tasks — structure: Sprints → Projects → Tasks"
      },
      {
        type: "list",
        title: "✨ What you'll get:",
        items: [
          "Sprint planning made simple and visual 📊",
          "Only see your own assigned projects and tasks 🎯",
          "Clear hierarchy: Sprints → Projects → Tasks 📋",
          "Perfect for teams and solo contributors 👥",
          "Progress tracking and productivity insights 📈"
        ]
      },
      {
        type: "callout",
        style: "info",
        text: "🌟 Want to be notified when this launches? Have feature requests? Contact us! Your feedback shapes TaskFlow's future! 💡"
      }
    ],
    actionButton: {
      label: "Contact Us About This Feature 📧",
      link: "/contact"
    }
  },
];

// ============================================
// ⚙️ CONFIGURATION (Optional)
// ============================================
const CONFIG = {
  viewLimit: 3,
  delayMs: 2000,
  useSessionStorage: true,
};

// ============================================
// 🎨 STYLING PRESETS
// ============================================
const CALLOUT_STYLES = {
  warning: {
    bgcolor: "#fef3c7",
    border: "2px dashed #f59e0b",
    color: "#92400e"
  },
  info: {
    bgcolor: "#dbeafe",
    border: "2px dashed #3b82f6",
    color: "#1e40af"
  },
  success: {
    bgcolor: "#f0fdf4",
    border: "2px dashed #10b981",
    color: "#065f46"
  }
};

// ============================================
// 📦 MAIN COMPONENT WITH FAST SCROLL SUPPORT
// ============================================

export default function DynamicAnnouncementSystem({ open, onClose }) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeAnnouncements, setActiveAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const contentRef = useRef(null);

  // Use external open prop if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;

  useEffect(() => {
    // Filter enabled announcements
    const enabled = ANNOUNCEMENTS.filter(ann => ann.enabled);
    setActiveAnnouncements(enabled);

    // Only auto-show if not externally controlled
    if (open === undefined) {
      const timer = setTimeout(() => {
        const unviewedIndex = enabled.findIndex(
          (ann) => getViewCount(ann.id) < CONFIG.viewLimit
        );
        
        if (unviewedIndex !== -1) {
          setCurrentIndex(unviewedIndex);
          setInternalOpen(true);
        }
      }, CONFIG.delayMs);

      return () => clearTimeout(timer);
    } else if (open && enabled.length > 0) {
      // If externally controlled and opened, start from first announcement
      setCurrentIndex(0);
    }
  }, [open]);

//   // ✨ Add FAST scrolling with mouse wheel and touch support
// useEffect(() => {
//   const handleWheel = (e) => {
//     if (!isOpen || !contentRef.current) return;
    
//     e.preventDefault();
//     const container = contentRef.current;
//     container.scrollTop += e.deltaY * 5; // ✅ SUPER FAST (was 1.5)
//   };

//   const handleTouchStart = (e) => {
//     if (!isOpen || !contentRef.current) return;
//     touchStartY = e.touches[0].clientY; // Fixed: was missing [0]
//   };

//   const handleTouchMove = (e) => {
//     if (!isOpen || !contentRef.current || !touchStartY) return;
    
//     const touchY = e.touches[0].clientY; // Fixed: was missing [0]
//     const diff = touchStartY - touchY;
//     const container = contentRef.current;
    
//     container.scrollTop += diff * 4; // ✅ SUPER FAST (was 1.8)
//     touchStartY = touchY;
//   };

//   let touchStartY = null;

//   if (isOpen) {
//     // Add event listeners for both desktop and mobile
//     document.addEventListener('wheel', handleWheel, { passive: false });
//     document.addEventListener('touchstart', handleTouchStart, { passive: true });
//     document.addEventListener('touchmove', handleTouchMove, { passive: true });
//   }

//   return () => {
//     document.removeEventListener('wheel', handleWheel);
//     document.removeEventListener('touchstart', handleTouchStart);
//     document.removeEventListener('touchmove', handleTouchMove);
//   };
// }, [isOpen]);

  const getViewCount = (announcementId) => {
    const count = sessionStorage.getItem(`announcement_${announcementId}`);
    return count ? parseInt(count, 10) : 0;
  };

  const incrementViewCount = (announcementId) => {
    const currentCount = getViewCount(announcementId);
    sessionStorage.setItem(`announcement_${announcementId}`, currentCount + 1);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
    
    if (activeAnnouncements[currentIndex]) {
      incrementViewCount(activeAnnouncements[currentIndex].id);
    }
  };

  const handleNext = () => {
    if (activeAnnouncements[currentIndex]) {
      incrementViewCount(activeAnnouncements[currentIndex].id);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < activeAnnouncements.length) {
      setCurrentIndex(nextIndex);
      // Scroll to top when switching announcements
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      // Scroll to top when switching announcements
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  const handleActionClick = () => {
    const current = activeAnnouncements[currentIndex];
    if (current?.actionButton?.link) {
      navigate(current.actionButton.link);
      handleClose();
    }
  };

  const renderContent = (contentItem) => {
    switch (contentItem.type) {
      case "text":
        return (
          <Typography key={Math.random()} sx={{ mb: 2, fontSize: "1rem", lineHeight: 1.7 }}>
            {contentItem.text}
          </Typography>
        );

      case "feature":
        return (
          <Typography key={Math.random()} sx={{ mb: 2, fontSize: "1rem", lineHeight: 1.7 }}>
            {contentItem.icon} <strong>{contentItem.title}</strong> - {contentItem.description}
          </Typography>
        );

      case "list":
        return (
          <Box key={Math.random()} sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1, fontSize: "1rem", fontWeight: 600 }}>
              {contentItem.title}
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              {contentItem.items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "8px" }}>{item}</li>
              ))}
            </Box>
          </Box>
        );

      case "callout":
        const style = CALLOUT_STYLES[contentItem.style] || CALLOUT_STYLES.info;
        return (
          <Typography
            key={Math.random()}
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              fontSize: "0.95rem",
              fontStyle: "italic",
              ...style
            }}
          >
            {contentItem.text}
          </Typography>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !activeAnnouncements[currentIndex]) {
    return null;
  }

  const current = activeAnnouncements[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === activeAnnouncements.length - 1;
  const IconComponent = current.icon;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
          maxHeight: "90vh", // ✨ Ensure dialog doesn't exceed viewport
        },
      }}
    >
      {/* Badge */}
      <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}>
        <Chip
          label={current.badge}
          size="small"
          sx={{
            bgcolor: current.badgeColor,
            color: "white",
            fontWeight: 700,
            fontSize: "0.75rem",
            animation: current.badge === "COMING SOON" ? "pulse 2s infinite" : "none",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.7 },
            },
          }}
        />
      </Box>

      {/* Icon */}
      <Box sx={{ textAlign: "center", pt: 4, pb: 2 }}>
        <Box
          sx={{
            display: "inline-block",
            p: 2,
            borderRadius: "50%",
            bgcolor: "#f1f5f9",
            mb: 1,
          }}
        >
          <IconComponent sx={{ fontSize: 40, color: current.iconColor }} />
        </Box>
      </Box>

      {/* Title */}
      <DialogTitle
        sx={{
          textAlign: "center",
          fontFamily: "Manrope, sans-serif",
          fontWeight: 700,
          fontSize: "1.6rem",
          px: 4,
          pt: 0,
          pb: 0,
          background: "linear-gradient(135deg, #059669, #10b981)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1.3,
        }}
      >
        {current.title}
      </DialogTitle>

      {/* Subtitle */}
      {current.subtitle && (
        <Typography
          sx={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.9rem",
            px: 4,
            pb: 2,
          }}
        >
          {current.subtitle}
        </Typography>
      )}

      {/* ✨ Scrollable Content with FAST scrolling */}
      <DialogContent 
        ref={contentRef}
        sx={{ 
          px: 4, 
          py: 3, 
          maxHeight: "50vh", 
          overflowY: "auto",
          scrollBehavior: "smooth",
          // Custom scrollbar styling
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#10b981",
            borderRadius: "10px",
            "&:hover": {
              background: "#059669",
            },
          },
        }}
      >
        {current.content.map(renderContent)}

        {/* ✨ Scroll hint for users */}
        <Box
          sx={{
            mt: 3,
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          💡 Scroll to see more • {currentIndex + 1} of {activeAnnouncements.length} updates
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          flexDirection: "column",
          gap: 1,
          px: 4,
          pb: 3,
          pt: 1,
        }}
      >
        <Button
          onClick={handleActionClick}
          variant="contained"
          fullWidth
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            py: 1.5,
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            boxShadow: "0 4px 12px rgba(5,150,105,0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #047857, #065f46)",
              boxShadow: "0 6px 16px rgba(5,150,105,0.5)",
            },
          }}
        >
          {current.actionButton.label}
        </Button>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={handleClose}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              color: "#64748b",
              flex: 1,
              "&:hover": { backgroundColor: "#f1f5f9" },
            }}
          >
            Close
          </Button>

          <Box sx={{ display: "flex", gap: 1, flex: 1 }}>
            {!isFirst && (
              <Button
                onClick={handlePrevious}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#059669",
                  flex: 1,
                  "&:hover": { backgroundColor: "#f0fdf4" },
                }}
              >
                ← Previous
              </Button>
            )}

            {!isLast && (
              <Button
                onClick={handleNext}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#059669",
                  flex: 1,
                  "&:hover": { backgroundColor: "#f0fdf4" },
                }}
              >
                Next →
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
