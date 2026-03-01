import { Navigate, Route, Routes } from "react-router-dom";
import { App } from "./App";
import { ApiPage } from "@/pages/ApiPage";
import { DevAnalysisPage } from "@/pages/DevAnalysisPage";
import { DevNaturalnessPage } from "@/pages/DevNaturalnessPage";
import { DevResponsePage } from "@/pages/DevResponsePage";
import { DevTestPage } from "@/pages/DevTestPage";
import { HomePage } from "@/pages/HomePage";
import { SandboxPage } from "@/pages/SandboxPage";
import { VowelsPage } from "@/pages/VowelsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/vowels" element={<VowelsPage />} />
        <Route path="/dev/analysis" element={<DevAnalysisPage />} />
        <Route path="/dev/analysis/:topic" element={<DevAnalysisPage />} />
        <Route path="/dev/naturalness" element={<DevNaturalnessPage />} />
        <Route path="/dev/test" element={<DevTestPage />} />
        <Route path="/dev/response" element={<DevResponsePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
