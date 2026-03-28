import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import AppSidebar from "@/components/AppSidebar";
import Onboarding from "@/components/Onboarding";
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import NaviPage from "./pages/NaviPage";
import MavisChat from "./pages/MavisChat";
import CharacterPage from "./pages/CharacterPage";
import QuestsPage from "./pages/QuestsPage";
import JournalPage from "./pages/JournalPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const done = localStorage.getItem("navi_onboarding_done");
      if (!done) setShowOnboarding(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <AppDataProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/navi" element={<NaviPage />} />
          <Route path="/mavis" element={<MavisChat />} />
          <Route path="/character" element={<CharacterPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </AppDataProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="navi-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
