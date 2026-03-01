import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./tailwind.css";
import { AppRoutes } from "./routes";

const THEME_STORAGE_KEY = "theme";
const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
const initialThemeMode =
  storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
    ? storedTheme
    : "system";
const initialResolvedTheme =
  initialThemeMode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : initialThemeMode;

document.documentElement.classList.toggle("dark", initialResolvedTheme === "dark");
document.documentElement.style.colorScheme = initialResolvedTheme;
document.body.className = "m-0 bg-background font-sans text-foreground antialiased";

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>,
);
