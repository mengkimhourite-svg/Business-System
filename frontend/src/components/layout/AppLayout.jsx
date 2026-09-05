import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import { useLocalStorage } from "../../hooks/index.js";
import { Sidebar } from "./Sidebar.jsx";
import { Navbar } from "./Navbar.jsx";
import { useMediaQuery } from "../../hooks/index.js";
import { useLayoutTheme } from "../../context/LayoutThemeContext.jsx";
import { AIAssistantProvider } from "../../context/AIAssistantContext.jsx";
import { AIFloatingButton, AIAssistantPanel } from "../ai/index.js";
import { PageTransition } from "../ui/Motion.jsx";
import { WelcomeModal } from "./WelcomeModal.jsx";

export function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorage("sbs.sidebar.collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { theme, cssVars } = useLayoutTheme();
  const sidebarWidth = theme.sidebar.width;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <AIAssistantProvider>
      <div className="min-h-screen bg-background" style={cssVars}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white">
          Skip to content
        </a>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div style={{ paddingLeft: isDesktop ? (collapsed ? theme.sidebar.collapsedWidth : sidebarWidth) : 0 }} className={cn("flex min-h-screen flex-col transition-[padding] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]")}>
          <Navbar onMenuClick={() => setMobileOpen(true)} />
          <main id="main-content" className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8" tabIndex={-1}>
            <div className="mx-auto w-full max-w-[1600px]">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
        {/* AI Assistant (frontend-only; hidden when disabled in Settings → AI Assistant) */}
        <AIFloatingButton />
        <AIAssistantPanel />
        <WelcomeModal />
      </div>
    </AIAssistantProvider>
  );
}
