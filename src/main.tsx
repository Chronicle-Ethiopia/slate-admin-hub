import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enable React's strict mode for development
createRoot(document.getElementById("root")!).render(
  <App />
);
