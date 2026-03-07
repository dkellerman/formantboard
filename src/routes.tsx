import { Navigate, Route, Routes } from "react-router-dom";
import { App } from "./App";
import { ApiPage } from "@/pages/ApiPage";
import { devRoutes } from "@/pages/dev/devRoutes";
import { HomePage } from "@/pages/HomePage";
import { SandboxPage } from "@/pages/SandboxPage";
import { VowelsPage } from "@/pages/VowelsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/apidocs" element={<ApiPage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/vowels" element={<VowelsPage />} />
        {devRoutes}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
