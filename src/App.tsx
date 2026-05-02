import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";
import { FeedProvider } from "@/contexts/FeedContext";
import AppSidebar from "@/components/AppSidebar";
import Onboarding from "@/components/Onboarding";
import EvolutionEvent from "@/components/EvolutionEvent";
// FeedbackWidget removed from layout — accessible via Settings if/when re-enabled.
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import NaviPage from "./pages/NaviPage";
import MavisChat from "./pages/MavisChat";
import CharacterPage from "./pages/CharacterPage";
import QuestsPage from "./pages/QuestsPage";
import JournalPage from "./pages/JournalPage";
import StatsPage from "./pages/StatsPage";
import PartyPage from "./pages/PartyPage";
import SettingsPage from "./pages/SettingsPage";
import UpgradePage from "./pages/UpgradePage";
import AdminPage from "./pages/AdminPage";
import GamesPage from "./pages/GamesPage";
import GuildPage from "./pages/GuildPage";
import SocialPage from "./pages/SocialPage";
import InboxPage from "./pages/InboxPage";
import AgentPage from "./pages/AgentPage";
import SearchPage from "./pages/SearchPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { tierFromLevel, tierNameFromLevel, evolutionTitleFromMbtiAndLevel } from "@/lib/classEvolution";
import { useFeed } from "@/contexts/FeedContext";
import { toast } from "@/hooks/use-toast";

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
      <FeedProvider>
        <AppShell />
      </FeedProvider>
    </AppDataProvider>
  );
}

const STREAK_MILESTONES = [7, 14, 30, 60, 100];

function AppShell() {
  const { profile, updateProfile } = useAppData();
  const { autoPost } = useFeed();
  const { user } = useAuth();
  const operatorLevel = profile.operator_level ?? 1;
  const lastTier = (profile as any).last_evolution_tier ?? 1;
  const newTier = tierFromLevel(operatorLevel);
  const showEvolution = newTier > lastTier && operatorLevel > 1;

  // Track operator level changes → auto-post LEVEL_UP to feed
  const prevLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevLevelRef.current !== null && prevLevelRef.current < operatorLevel) {
      const evolutionTitle = evolutionTitleFromMbtiAndLevel(profile.mbti_type ?? "", operatorLevel);
      autoPost(
        "LEVEL_UP",
        `${profile.display_name ?? "Operator"} reached Level ${operatorLevel} — ${evolutionTitle}`,
        { old_level: prevLevelRef.current, new_level: operatorLevel, evolution_title: evolutionTitle, tier_name: tierNameFromLevel(operatorLevel) }
      );
    }
    prevLevelRef.current = operatorLevel;
  }, [operatorLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track streak milestones → auto-post STREAK to feed + award streak freeze
  const prevStreakRef = useRef<number | null>(null);
  useEffect(() => {
    const streak = profile.current_streak ?? 0;
    if (prevStreakRef.current !== null && prevStreakRef.current < streak) {
      const crossed = STREAK_MILESTONES.filter((m) => m > (prevStreakRef.current ?? 0) && m <= streak);
      if (crossed.length > 0) {
        autoPost(
          "STREAK",
          `${profile.display_name ?? "Operator"} hit a ${streak}-day streak`,
          { streak_days: streak }
        );
      }
      // Award 1 streak freeze for every 7-day milestone
      if (streak > 0 && streak % 7 === 0 && user) {
        supabase.functions.invoke("navi-actions", {
          body: { actions: [{ type: "award_streak_freeze", params: {} }] },
        }).catch(() => {});
      }
    }
    prevStreakRef.current = streak;
  }, [profile.current_streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global DM toast notification
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`global-dm-toast-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${user.id}` },
        async (payload) => {
          const msg = payload.new as any;
          const { data: sender } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", msg.sender_id)
            .single();
          toast({
            title: `${sender?.display_name ?? "Operator"} sent you a message`,
            description: msg.content?.slice(0, 60) ?? "",
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build chat context for EvolutionEvent's NAVI message
  const chatContext = {
    navi_level: profile.navi_level,
    navi_name: profile.navi_name,
    display_name: profile.display_name,
    operator_level: operatorLevel,
    mbti_type: profile.mbti_type,
    character_class: profile.character_class,
    bond_affection: profile.bond_affection,
    bond_trust: profile.bond_trust,
    bond_loyalty: profile.bond_loyalty,
    current_streak: profile.current_streak,
    xp_total: profile.xp_total,
  };

  return (
    <>
      {showEvolution && (
        <EvolutionEvent
          operatorLevel={operatorLevel}
          lastEvolutionTier={lastTier}
          mbtiType={profile.mbti_type}
          naviName={profile.navi_name}
          displayName={profile.display_name}
          chatContext={chatContext}
          onDismiss={(tier) => {
            updateProfile({ last_evolution_tier: tier } as any);
            const evolutionTitle = evolutionTitleFromMbtiAndLevel(profile.mbti_type ?? "", operatorLevel);
            autoPost(
              "EVOLUTION",
              `${profile.display_name ?? "Operator"} evolved to ${tierNameFromLevel(operatorLevel)}: ${evolutionTitle}`,
              { old_tier: lastTier, new_tier: tier, evolution_title: evolutionTitle, mbti_type: profile.mbti_type }
            );
          }}
        />
      )}
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
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/guild" element={<GuildPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/agents" element={<AgentPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
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
