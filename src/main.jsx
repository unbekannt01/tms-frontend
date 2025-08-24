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

if (maintenanceMode) {
  root.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      height:100vh;
      width:100vw;
      font-family:sans-serif;
      background: linear-gradient(135deg, #f4f4f4, #e0e0e0);
      text-align:center;
    ">
      <h1 style="
        font-size:2.5rem;
        color:#333;
        margin-bottom:10px;
        display:flex;
        align-items:center;
        gap:10px;
      ">
        🚧 Website Under Development 🚧
      </h1>
      <p style="color:#555; font-size:1.1rem; max-width:400px;">
        We’ll be live soon. Thank you for your patience!
      </p>
    </div>
  `;
} else {
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
}

// ✅ PWA Service Worker Registration
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {},
  onOfflineReady() {},
});
