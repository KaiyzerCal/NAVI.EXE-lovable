import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import ErrorFallback from "@/components/ErrorFallback";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";
import { removeStaleChannel } from "@/lib/realtimeChannel";
import { FeedProvider } from "@/contexts/FeedContext";
import { UnreadMessagesProvider } from "@/contexts/UnreadMessagesContext";
import AppSidebar from "@/components/AppSidebar";
import Onboarding from "@/components/Onboarding";
import EvolutionEvent from "@/components/EvolutionEvent";
// FeedbackWidget removed from layout — accessible via Settings if/when re-enabled.
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import AuthPage from "./pages/AuthPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { tierFromLevel, tierNameFromLevel, evolutionTitleFromMbtiAndLevel } from "@/lib/classEvolution";
import { useFeed } from "@/contexts/FeedContext";
import { toast } from "@/hooks/use-toast";

// Lazy-loaded routes — split into async chunks to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const NaviPage = lazy(() => import("./pages/NaviPage"));
const MavisChat = lazy(() => import("./pages/MavisChat"));
const CharacterPage = lazy(() => import("./pages/CharacterPage"));
const QuestsPage = lazy(() => import("./pages/QuestsPage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const PartyPage = lazy(() => import("./pages/PartyPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const GamesPage = lazy(() => import("./pages/GamesPage"));
const GuildPage = lazy(() => import("./pages/GuildPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const SocialPage = lazy(() => import("./pages/SocialPage"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const AgentPage = lazy(() => import("./pages/AgentPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
const SeasonPage = lazy(() => import("./pages/SeasonPage"));
const ChallengePage = lazy(() => import("./pages/ChallengePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem("navi_onboarding_done");
    if (done) return; // fast path: already cached locally
    // localStorage empty (new device / cleared cache) — check DB as source of truth
    supabase
      .from("profiles")
      .select("onboarding_done")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if ((data as any)?.onboarding_done) {
          localStorage.setItem("navi_onboarding_done", "1"); // cache for next time
        } else {
          setShowOnboarding(true);
        }
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    const path = window.location.pathname;
    if (path === "/privacy") return <div className="min-h-screen bg-background p-6"><PrivacyPolicyPage /></div>;
    if (path === "/terms") return <div className="min-h-screen bg-background p-6"><TermsOfServicePage /></div>;
    return <AuthPage />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <AppDataProvider>
      <FeedProvider>
        <UnreadMessagesProvider>
          <AppShell />
        </UnreadMessagesProvider>
      </FeedProvider>
    </AppDataProvider>
  );
}

const STREAK_MILESTONES = [7, 14, 30, 60, 100];

function AppShell() {
  const { profile, updateProfile } = useAppData();
  const { autoPost, newPostCount, clearNewCount } = useFeed();
  const { user } = useAuth();
  const location = useLocation();
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

  // Toast when new feed posts arrive and user isn't on the social page
  const prevNewPostCountRef = useRef(0);
  useEffect(() => {
    if (newPostCount > 0 && newPostCount > prevNewPostCountRef.current) {
      const onSocialPage = window.location.pathname === "/social";
      if (!onSocialPage) {
        toast({
          title: "New activity in feed",
          description: `${newPostCount} new post${newPostCount !== 1 ? "s" : ""} from operators`,
        });
      }
    }
    prevNewPostCountRef.current = newPostCount;
  }, [newPostCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global DM toast notification — watches navi_messages (the unified message table).
  // RLS limits delivery to threads the user participates in; we skip messages the
  // user sent themselves so only incoming messages produce a toast.
  useEffect(() => {
    if (!user) return;
    const channelName = `global-dm-toast-${user.id}`;
    removeStaleChannel(channelName);
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "navi_messages" },
        (payload) => {
          const msg = payload.new as any;
          // Only toast for messages from someone else
          if (!msg.sender_user_id || msg.sender_user_id === user.id) return;
          toast({
            title: `${msg.sender_navi_name ?? "Operator"} sent you a message`,
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
        {/* AppSidebar renders only a fixed-position hamburger + overlay Sheet
            on mobile (no docked column), so extra top clearance keeps that
            button from sitting on top of page content. */}
        <main className="flex-1 p-6 pt-16 md:pt-6 overflow-y-auto">
          {/* Per-route boundary: a crash on one page no longer takes the sidebar/nav
              down with it — the user can still navigate elsewhere. */}
          <Sentry.ErrorBoundary
            key={location.pathname}
            fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}
          >
          <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={24} /></div>}>
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
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/agents" element={<AgentPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/market" element={<MarketplacePage />} />
          <Route path="/season" element={<SeasonPage />} />
          <Route path="/challenges" element={<ChallengePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </Sentry.ErrorBoundary>
        </main>
      </div>
    </>
  );
}

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="navi-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              {/* Privacy/Terms must be reachable without an account — app store
                  reviewers and prospective users need to view them pre-login. */}
              <Routes>
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/*" element={<AppContent />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
