import { useEffect, useState } from "react";

export const MOBILE_MAX_WIDTH = 900;

function getViewportSnapshot() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;
  const isMobile = width <= MOBILE_MAX_WIDTH;

  return {
    width,
    height,
    isLandscape,
    isMobile,
    isMobileLandscape: isMobile && isLandscape,
  };
}

export function useViewport() {
  const [viewport, setViewport] = useState(getViewportSnapshot);

  useEffect(() => {
    function handleResize() {
      setViewport(getViewportSnapshot());
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return viewport;
}
