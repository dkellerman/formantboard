import { Route } from "react-router-dom";
import { DevAnalysisPage } from "@/pages/dev/DevAnalysisPage";
import { DevIndexPage } from "@/pages/dev/DevIndexPage";
import { DevNaturalnessPage } from "@/pages/dev/DevNaturalnessPage";
import { DevResponsePage } from "@/pages/dev/DevResponsePage";
import { DevTestPage } from "@/pages/dev/DevTestPage";

export const devRoutes = (
  <>
    <Route path="/dev" element={<DevIndexPage />} />
    <Route path="/dev/analysis" element={<DevAnalysisPage />} />
    <Route path="/dev/analysis/:topic" element={<DevAnalysisPage />} />
    <Route path="/dev/naturalness" element={<DevNaturalnessPage />} />
    <Route path="/dev/test" element={<DevTestPage />} />
    <Route path="/dev/response" element={<DevResponsePage />} />
  </>
);
