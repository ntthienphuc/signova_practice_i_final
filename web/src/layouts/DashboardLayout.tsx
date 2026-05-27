import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/learn-dashboard/Sidebar";
import { AuthModal } from "../components/AuthModal";
import { WelcomeMascotModal } from "../components/WelcomeMascotModal";
import { DashboardContext } from "../contexts/DashboardContext";
import { useAuth } from "../contexts/AuthContext";
import { pathToTab, tabToPath } from "../utils/dashboardRoutes";
import type { AppTab } from "../types/learn";

export default function DashboardLayout() {
  const { login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isImmersive, setIsImmersive] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("require_login") === "true") {
      setIsAuthOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const activeTab: AppTab = pathToTab(location.pathname);

  const handleTabChange = (tab: AppTab) => navigate(tabToPath(tab));

  const handleLogout = () => {
    logout();
    navigate("/learn-dashboard");
  };

  return (
    <DashboardContext.Provider value={{
      isImmersive,
      setIsImmersive,
      openAuth: () => setIsAuthOpen(true),
    }}>
      <div className={isImmersive ? "app-shell app-shell-learn-immersive" : "app-shell flow-shell"}>
        {!isImmersive && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            curriculumTopics={[]}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
          />
        )}
        <main className={isImmersive ? "learn-immersive-main" : "flow-main"}>
          <Outlet />
        </main>
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(newToken) => { login(newToken); setShowWelcome(true); }}
        />
        <WelcomeMascotModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      </div>
    </DashboardContext.Provider>
  );
}
