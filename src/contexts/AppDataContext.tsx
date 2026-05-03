import { createContext, useContext, useState, ReactNode } from "react";
import { useProfile, type ProfileData } from "@/hooks/useProfile";
import { useQuests, type Quest, type QuestType, type CreateQuestInput, type UpdateQuestInput } from "@/hooks/useQuests";
import { useJournal, type JournalEntry, type CreateJournalInput, type UpdateJournalInput } from "@/hooks/useJournal";
import { useAchievements, type Achievement } from "@/hooks/useAchievements";
import { useOperatorSkills, useEquipment, useActiveEffects, type OperatorSkill, type EquipmentItem, type ActiveEffect } from "@/hooks/useSkillsAndEquipment";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AppDataContextType {
  // Ready flag
  isReady: boolean;

  // Profile
  profile: ProfileData;
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

  // Unified refresh helper
  refreshAppData: (sections?: string[]) => Promise<void>;
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
  // All hooks called once at top level
  const { profile, loading: profileLoading, updateProfile, refetchProfile } = useProfile();
  const { quests, loading: questsLoading, stats: questStats, createQuest, updateQuest, toggleQuest, deleteQuest, refetch: refetchQuests } = useQuests();
  const { entries, loading: journalLoading, createEntry, updateEntry, deleteEntry, refetch: refetchJournal } = useJournal();
  const { achievements, loading: achievementsLoading, checkAchievements, stats: achievementStats, refetch: refetchAchievements } = useAchievements();
  const { skills, loading: skillsLoading, addSkill, updateSkill, deleteSkill, refetch: refetchSkills } = useOperatorSkills();
  const { items, loading: equipmentLoading, addItem, equipItem, updateItem, deleteItem, refetch: refetchEquipment } = useEquipment();
  const { effects, loading: effectsLoading, addEffect, removeEffect, refetch: refetchEffects } = useActiveEffects();

  // Chat state persisted across tab switches
  const [chatMessages, setChatMessages] = useState<DisplayMessage[]>([INITIAL_MESSAGE]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatDbLoaded, setChatDbLoaded] = useState(false);

  const isReady = !profileLoading;

  const refreshAppData = async (sections?: string[]) => {
    const wants = (s: string) => !sections || sections.length === 0 || sections.includes("all") || sections.includes(s);
    const tasks: Promise<any>[] = [];
    if (wants("profile") || wants("activity_log")) tasks.push(refetchProfile());
    if (wants("quests")) tasks.push(refetchQuests());
    if (wants("skills")) tasks.push(refetchSkills());
    if (wants("journal")) tasks.push(refetchJournal());
    if (wants("equipment")) tasks.push(refetchEquipment());
    if (wants("buffs")) tasks.push(refetchEffects());
    if (wants("achievements")) tasks.push(refetchAchievements());
    await Promise.all(tasks);
  };

  if (!isReady) {
    return null;
  }

  return (
    <AppDataContext.Provider value={{
      isReady,
      profile, profileLoading, updateProfile, refetchProfile,
      quests, questsLoading, questStats, createQuest, updateQuest, toggleQuest, deleteQuest, refetchQuests,
      entries, journalLoading, createEntry, updateEntry, deleteEntry, refetchJournal,
      achievements, achievementsLoading, checkAchievements, achievementStats, refetchAchievements,
      skills, skillsLoading, addSkill, updateSkill, deleteSkill, refetchSkills,
      items, equipmentLoading, addItem, equipItem, updateItem, deleteItem, refetchEquipment,
      effects, effectsLoading, addEffect, removeEffect, refetchEffects,
      chatMessages, setChatMessages, conversationId, setConversationId, chatDbLoaded, setChatDbLoaded,
      refreshAppData,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}
