import { Navigate, Route, Routes } from "react-router-dom";
import { App } from "./App";
import { DevResponsePage } from "./pages/DevResponsePage";
import { DevTestPage } from "./pages/DevTestPage";
import { HomePage } from "./pages/HomePage";
import { SandboxPage } from "./pages/SandboxPage";
import { VowelsPage } from "./pages/VowelsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<HomePage />} />
        <Route path="sandbox" element={<SandboxPage />} />
        <Route path="vowels" element={<VowelsPage />} />
        <Route path="dev/test" element={<DevTestPage />} />
        <Route path="dev/response" element={<DevResponsePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
