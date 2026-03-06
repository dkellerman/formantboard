import { Navigate, Route } from "react-router-dom";
import { DevIndexPage } from "@/pages/dev/DevIndexPage";
import { DevResponsePage } from "@/pages/dev/DevResponsePage";
import { DevTestPage } from "@/pages/dev/DevTestPage";
import { SoundIndexPage } from "@/pages/dev/sound/SoundIndexPage";
import { SoundTopicPage } from "@/pages/dev/sound/SoundTopicPage";

export const devRoutes = (
  <>
    <Route path="/dev" element={<DevIndexPage />} />
    <Route path="/dev/sound" element={<SoundIndexPage />} />
    <Route path="/dev/sound/:topic" element={<SoundTopicPage />} />
    <Route path="/dev/analysis" element={<Navigate to="/dev/sound" replace />} />
    <Route path="/dev/analysis/:topic" element={<Navigate to="/dev/sound" replace />} />
    <Route path="/dev/naturalness" element={<Navigate to="/dev/sound" replace />} />
    <Route path="/dev/test" element={<DevTestPage />} />
    <Route path="/dev/response" element={<DevResponsePage />} />
  </>
);
