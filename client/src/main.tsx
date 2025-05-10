import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// For MVP: No authentication wrapper needed
createRoot(document.getElementById("root")!).render(
  <App />
);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service Worker registration failed:', err);
    });
  });
}