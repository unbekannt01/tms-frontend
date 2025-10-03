import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Maintenance flag
const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";

// Check API URL
const apiUrl = import.meta.env.VITE_API_URL;
const isDevMode = apiUrl.includes("localhost");

const root = document.getElementById("root");

createRoot(root).render(
  <StrictMode>
    <>
      {isDevMode && (
        <div
          style={{
            background: "orange",
            color: "white",
            padding: "8px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          🚧 Running in Development Mode (API: {apiUrl})
        </div>
      )}
      <App />
    </>
  </StrictMode>
);

// ✅ PWA Service Worker Registration
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {},
  onOfflineReady() {},
});
