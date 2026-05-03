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

  // Refresh app data after action execution
  refreshAppData: (sections?: string[]) => Promise<void>;

  // Chat state (persists across tab switches)
  chatMessages: DisplayMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>>;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  chatDbLoaded: boolean;
  setChatDbLoaded: (v: boolean) => void;
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

  // Map section names and Supabase table names to refetch calls
  async function refreshAppData(sections?: string[]): Promise<void> {
    const all = !sections || sections.length === 0 || sections.includes("all");
    const wants = (name: string) => all || sections!.includes(name);

    const table = (t: string) =>
      t === "profiles" || t === "profile" ? wants("profile") :
      t === "quests" ? wants("quests") :
      t === "skills" ? wants("skills") :
      t === "journal_entries" || t === "journal" ? wants("journal") :
      t === "equipment" ? wants("equipment") :
      t === "buffs" || t === "effects" ? wants("buffs") :
      t === "achievements" ? wants("achievements") :
      false;

    const calls: Promise<void>[] = [];
    if (wants("profile") || table("profiles")) calls.push(refetchProfile());
    if (wants("quests") || table("quests")) calls.push(refetchQuests());
    if (wants("skills") || table("skills")) calls.push(refetchSkills());
    if (wants("journal") || table("journal_entries")) calls.push(refetchJournal());
    if (wants("equipment") || table("equipment")) calls.push(refetchEquipment());
    if (wants("buffs") || wants("effects") || table("buffs")) calls.push(refetchEffects());
    if (wants("achievements") || table("achievements")) calls.push(refetchAchievements());
    await Promise.all(calls);
  }

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
      refreshAppData,
      chatMessages, setChatMessages, conversationId, setConversationId, chatDbLoaded, setChatDbLoaded,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}
