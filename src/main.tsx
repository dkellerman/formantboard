import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./tailwind.css";
import { AppRoutes } from "./routes";
import { bootstrapThemeMode } from "@/hooks/useThemeMode";

bootstrapThemeMode();
document.body.className = "m-0 bg-background font-sans text-foreground antialiased";

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>,
);
