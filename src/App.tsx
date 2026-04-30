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
import PartyPage from "./pages/PartyPage";
import SocialPage from "./pages/SocialPage";
import SettingsPage from "./pages/SettingsPage";
import UpgradePage from "./pages/UpgradePage";
import CheckoutReturn from "./pages/CheckoutReturn";
import NotFound from "./pages/NotFound";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import EvolutionEvent from "@/components/EvolutionEvent";
import { useAppData } from "@/contexts/AppDataContext";
import { tierFromLevel } from "@/lib/xpSystem";
import { postToFeed } from "@/lib/feedHelpers";

const queryClient = new QueryClient();

function EvolutionWatcher() {
  const { profile, updateProfile, feed } = useAppData();
  const [active, setActive] = useState<{ oldTier: number; newTier: number } | null>(null);

  const operatorLevel = (profile as any)?.operator_level ?? 1;
  const lastTier = (profile as any)?.last_evolution_tier ?? 1;
  const currentTier = tierFromLevel(operatorLevel);

  useEffect(() => {
    if (!profile) return;
    if (active) return;
    if (currentTier > lastTier) {
      setActive({ oldTier: lastTier, newTier: currentTier });
    }
  }, [profile, currentTier, lastTier, active]);

  if (!active) return null;

  return (
    <EvolutionEvent
      oldTier={active.oldTier}
      newTier={active.newTier}
      mbtiType={(profile as any)?.mbti_type || ""}
      naviLevel={(profile as any)?.navi_level || 1}
      naviName={(profile as any)?.navi_name || "NAVI"}
      operatorName={(profile as any)?.display_name || "Operator"}
      onDismiss={async () => {
        // Persist tier update
        await updateProfile({ last_evolution_tier: active.newTier } as any);
        // Auto-post evolution to feed
        const { evolutionTitleFromMbtiAndLevel, TIER_NAMES } = await import("@/lib/xpSystem");
        const newTitle = evolutionTitleFromMbtiAndLevel(
          (profile as any)?.mbti_type || "",
          operatorLevel
        );
        const tierName = TIER_NAMES[active.newTier as 1 | 2 | 3 | 4 | 5] || "ASCENDING";
        await postToFeed({
          userId: (profile as any)?.id ?? "",
          display_name: (profile as any)?.display_name ?? null,
          navi_name: (profile as any)?.navi_name ?? null,
          character_class: (profile as any)?.character_class ?? null,
          mbti_type: (profile as any)?.mbti_type ?? null,
          operator_level: operatorLevel,
          content_type: "EVOLUTION",
          content: `${(profile as any)?.display_name || "Operator"} evolved to ${tierName}: ${newTitle}`,
          metadata: {
            old_tier: active.oldTier,
            new_tier: active.newTier,
            evolution_title: newTitle,
            mbti_type: (profile as any)?.mbti_type,
          },
        });
        setActive(null);
      }}
    />
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setShowOnboarding(null);
      return;
    }
    const localDone = localStorage.getItem("navi_onboarding_done") === "1";
    const profileDone = profile?.onboarding_done === true;
    if (localDone || profileDone) {
      setShowOnboarding(false);
    } else if (profile !== undefined) {
      setShowOnboarding(true);
    }
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  if (showOnboarding === null) return null;
  if (showOnboarding) return <Onboarding onComplete={() => setShowOnboarding(false)} />;

  return (
    <AppDataProvider>
      <PaymentTestModeBanner />
      <EvolutionWatcher />
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/navi" element={<NaviPage />} />
            <Route path="/mavis" element={<MavisChat />} />
            <Route path="/character" element={<CharacterPage />} />
            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/party" element={<PartyPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
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
