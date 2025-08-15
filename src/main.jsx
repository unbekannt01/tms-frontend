import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

const root = document.getElementById("root");
const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";

if (maintenanceMode) {
  root.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      height:100vh;
      font-family:sans-serif;
      background:#f4f4f4;
      text-align:center;
    ">
      <h1 style="margin:0; font-size:2rem;">🚧 Website Under Development 🚧</h1>
      <p style="color:#555;">We’ll be live soon. Thank you for your patience!</p>
    </div>
  `;
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
