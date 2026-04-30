import { createContext, useContext, useState, ReactNode } from "react";
import { useProfile, type ProfileData } from "@/hooks/useProfile";
import { useQuests, type Quest, type QuestType, type CreateQuestInput, type UpdateQuestInput } from "@/hooks/useQuests";
import { useJournal, type JournalEntry, type CreateJournalInput, type UpdateJournalInput } from "@/hooks/useJournal";
import { useAchievements, type Achievement } from "@/hooks/useAchievements";
import { useOperatorSkills, useEquipment, useActiveEffects, type OperatorSkill, type EquipmentItem, type ActiveEffect } from "@/hooks/useSkillsAndEquipment";
import { useFeed, type FeedPost, type FeedReply } from "@/hooks/useFeed";
import { useDirectMessages } from "@/hooks/useDirectMessages";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Feed slice exposed through context
interface FeedContextSlice {
  posts: FeedPost[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  newPostsCount: number;
  error: string | null;
  fetchInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (params: {
    content_type: string;
    content: string;
    metadata?: Record<string, any>;
    display_name: string | null;
    navi_name: string | null;
    character_class: string | null;
    mbti_type: string | null;
    operator_level: number;
  }) => Promise<FeedPost | null>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  fetchReplies: (postId: string) => Promise<FeedReply[]>;
  addReply: (postId: string, content: string, displayName: string | null) => Promise<FeedReply | null>;
  clearNewPosts: () => void;
}

// Inbox slice exposed through context
interface InboxContextSlice {
  dmUnreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  fetchInboxThreads: () => Promise<import("@/hooks/useDirectMessages").InboxThread[]>;
  fetchDMThread: (otherId: string) => Promise<import("@/hooks/useDirectMessages").DirectMessage[]>;
  sendDM: (recipientId: string, content: string) => Promise<import("@/hooks/useDirectMessages").DirectMessage | null>;
  markDMRead: (messageIds: string[]) => Promise<void>;
  deleteDM: (messageId: string, isSender: boolean) => Promise<void>;
  deleteNaviThread: (otherId: string, isSender: boolean) => Promise<void>;
  deleteDMThread: (otherId: string) => Promise<void>;
}

interface AppDataContextType {
  // Ready flag
  isReady: boolean;

  // Profile
  profile: ProfileData & { id?: string };
  profileLoading: boolean;
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>;
  refetchProfile: () => Promise<void>;

  // Quests
  quests: Quest[];
  questsLoading: boolean;
  questStats: { total: number; active: number; completed: number; xpEarned: number };
  createQuest: (input: CreateQuestInput) => Promise<Quest | null>;
  updateQuest: (id: string, input: UpdateQuestInput) => Promise<void>;
  toggleQuest: (id: string) => Promise<void>;
  deleteQuest: (id: string) => Promise<void>;
  refetchQuests: () => Promise<void>;

  // Journal
  entries: JournalEntry[];
  journalLoading: boolean;
  createEntry: (input: CreateJournalInput) => Promise<JournalEntry | null>;
  updateEntry: (id: string, input: UpdateJournalInput) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refetchJournal: () => Promise<void>;

  // Achievements
  achievements: Achievement[];
  achievementsLoading: boolean;
  checkAchievements: (stats: any) => Promise<void>;
  achievementStats: { total: number; unlocked: number };
  refetchAchievements: () => Promise<void>;

  // Skills
  skills: OperatorSkill[];
  skillsLoading: boolean;
  addSkill: (input: { name: string; description?: string; category?: string; level?: number }) => Promise<OperatorSkill | null>;
  updateSkill: (id: string, updates: Partial<Pick<OperatorSkill, "name" | "description" | "level" | "xp" | "category">>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  refetchSkills: () => Promise<void>;

  // Equipment
  items: EquipmentItem[];
  equipmentLoading: boolean;
  addItem: (input: any) => Promise<EquipmentItem | null>;
  equipItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refetchEquipment: () => Promise<void>;

  // Effects
  effects: ActiveEffect[];
  effectsLoading: boolean;
  addEffect: (input: any) => Promise<ActiveEffect | null>;
  removeEffect: (id: string) => Promise<void>;
  refetchEffects: () => Promise<void>;

  // Chat state (persists across tab switches)
  chatMessages: DisplayMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>>;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  chatDbLoaded: boolean;
  setChatDbLoaded: (v: boolean) => void;

  // Feed (persists across tab switches)
  feed: FeedContextSlice;

  // Inbox / DMs
  inbox: InboxContextSlice;
  dmUnreadCount: number;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function useAppData(): AppDataContextType {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

const INITIAL_MESSAGE: DisplayMessage = {
  id: "initial",
  role: "assistant",
  content: "Systems online, Operator. NAVI AI initialized. How can I assist you today?",
  timestamp: new Date(),
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { profile, loading: profileLoading, updateProfile, refetchProfile } = useProfile();
  const { quests, loading: questsLoading, stats: questStats, createQuest, updateQuest, toggleQuest, deleteQuest, refetch: refetchQuests } = useQuests();
  const { entries, loading: journalLoading, createEntry, updateEntry, deleteEntry, refetch: refetchJournal } = useJournal();
  const { achievements, loading: achievementsLoading, checkAchievements, stats: achievementStats, refetch: refetchAchievements } = useAchievements();
  const { skills, loading: skillsLoading, addSkill, updateSkill, deleteSkill, refetch: refetchSkills } = useOperatorSkills();
  const { items, loading: equipmentLoading, addItem, equipItem, updateItem, deleteItem, refetch: refetchEquipment } = useEquipment();
  const { effects, loading: effectsLoading, addEffect, removeEffect, refetch: refetchEffects } = useActiveEffects();

  // Feed — lives at context level so it persists across page navigations
  const {
    posts, loading: feedLoading, loadingMore, hasMore, newPostsCount, error: feedError,
    fetchInitial, loadMore, createPost, deletePost, toggleLike, fetchReplies, addReply, clearNewPosts,
  } = useFeed();

  // DM / inbox
  const {
    dmUnreadCount, fetchUnreadCount, fetchInboxThreads, fetchDMThread, sendDM, markDMRead,
    deleteDM, deleteNaviThread, deleteDMThread,
  } = useDirectMessages();

  // Chat state persisted across tab switches
  const [chatMessages, setChatMessages] = useState<DisplayMessage[]>([INITIAL_MESSAGE]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatDbLoaded, setChatDbLoaded] = useState(false);

  const isReady = !profileLoading;

  if (!isReady) return null;

  const feed: FeedContextSlice = {
    posts,
    loading: feedLoading,
    loadingMore,
    hasMore,
    newPostsCount,
    error: feedError,
    fetchInitial,
    loadMore,
    createPost,
    deletePost,
    toggleLike,
    fetchReplies,
    addReply,
    clearNewPosts,
  };

  const inbox: InboxContextSlice = {
    dmUnreadCount,
    fetchUnreadCount,
    fetchInboxThreads,
    fetchDMThread,
    sendDM,
    markDMRead,
    deleteDM,
    deleteNaviThread,
    deleteDMThread,
  };

  return (
    <AppDataContext.Provider value={{
      isReady,
      profile: profile as ProfileData & { id?: string },
      profileLoading,
      updateProfile,
      refetchProfile,
      quests, questsLoading, questStats, createQuest, updateQuest, toggleQuest, deleteQuest, refetchQuests,
      entries, journalLoading, createEntry, updateEntry, deleteEntry, refetchJournal,
      achievements, achievementsLoading, checkAchievements, achievementStats, refetchAchievements,
      skills, skillsLoading, addSkill, updateSkill, deleteSkill, refetchSkills,
      items, equipmentLoading, addItem, equipItem, updateItem, deleteItem, refetchEquipment,
      effects, effectsLoading, addEffect, removeEffect, refetchEffects,
      chatMessages, setChatMessages, conversationId, setConversationId, chatDbLoaded, setChatDbLoaded,
      feed,
      inbox,
      dmUnreadCount,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}
