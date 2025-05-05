import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// For MVP: No authentication wrapper needed
createRoot(document.getElementById("root")!).render(
  <App />
);
