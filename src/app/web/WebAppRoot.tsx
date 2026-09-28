import { useEffect } from "react";
import { BrowserRouter as Router, Routes } from "react-router-dom";

import { useAppBootstrap } from "@/app/useAppBootstrap";
import { renderAuthRoutes, renderProductWebRoutes } from "@/app/web/routes";
import CookieConsentBanner from "@/components/web/CookieConsentBanner";
import { webCssVariables } from "@/theme/palette";

export default function WebAppRoot() {
  useAppBootstrap();

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(webCssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  return (
    <Router>
      <Routes>
        {renderAuthRoutes()}
        {renderProductWebRoutes()}
      </Routes>
      <CookieConsentBanner />
    </Router>
  );
}
