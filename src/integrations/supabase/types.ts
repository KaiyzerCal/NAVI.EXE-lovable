export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          unlocked: boolean
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          unlocked?: boolean
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          unlocked?: boolean
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          user_id: string
          xp_amount?: number
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
      buffs: {
        Row: {
          created_at: string
          description: string
          duration_hours: number | null
          effect_type: string
          expires_at: string | null
          id: string
          modifier_value: number
          name: string
          source: string
          stat_affected: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          duration_hours?: number | null
          effect_type?: string
          expires_at?: string | null
          id?: string
          modifier_value?: number
          name: string
          source?: string
          stat_affected?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_hours?: number | null
          effect_type?: string
          expires_at?: string | null
          id?: string
          modifier_value?: number
          name?: string
          source?: string
          stat_affected?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          buff_id: string | null
          description: string
          id: string
          is_equipped: boolean
          name: string
          obtained_at: string
          obtained_from: string
          rarity: string
          slot: string
          stat_bonuses: Json
          user_id: string
        }
        Insert: {
          buff_id?: string | null
          description?: string
          id?: string
          is_equipped?: boolean
          name: string
          obtained_at?: string
          obtained_from?: string
          rarity?: string
          slot?: string
          stat_bonuses?: Json
          user_id: string
        }
        Update: {
          buff_id?: string | null
          description?: string
          id?: string
          is_equipped?: boolean
          name?: string
          obtained_at?: string
          obtained_from?: string
          rarity?: string
          slot?: string
          stat_bonuses?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_buff_id_fkey"
            columns: ["buff_id"]
            isOneToOne: false
            referencedRelation: "buffs"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          importance: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          importance?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          importance?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      media: {
        Row: {
          ai_description: string | null
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          user_id: string
        }
        Insert: {
          ai_description?: string | null
          created_at?: string
          file_name: string
          file_size?: number
          file_type: string
          file_url: string
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          user_id: string
        }
        Update: {
          ai_description?: string | null
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      navi_core_memory: {
        Row: {
          content: string
          created_at: string
          id: string
          importance: number
          memory_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          importance?: number
          memory_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          importance?: number
          memory_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bond_affection: number
          bond_loyalty: number
          bond_trust: number
          character_class: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          equipped_skin: string
          id: string
          last_active: string | null
          longest_streak: number
          mbti_type: string | null
          navi_level: number
          navi_name: string
          navi_personality: string
          notification_settings: Json
          subclass: string | null
          user_navi_description: string | null
          xp_total: number
        }
        Insert: {
          bond_affection?: number
          bond_loyalty?: number
          bond_trust?: number
          character_class?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          equipped_skin?: string
          id: string
          last_active?: string | null
          longest_streak?: number
          mbti_type?: string | null
          navi_level?: number
          navi_name?: string
          navi_personality?: string
          notification_settings?: Json
          subclass?: string | null
          user_navi_description?: string | null
          xp_total?: number
        }
        Update: {
          bond_affection?: number
          bond_loyalty?: number
          bond_trust?: number
          character_class?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          equipped_skin?: string
          id?: string
          last_active?: string | null
          longest_streak?: number
          mbti_type?: string | null
          navi_level?: number
          navi_name?: string
          navi_personality?: string
          notification_settings?: Json
          subclass?: string | null
          user_navi_description?: string | null
          xp_total?: number
        }
        Relationships: []
      }
      quests: {
        Row: {
          buff_reward_id: string | null
          completed: boolean
          created_at: string
          debuff_penalty_id: string | null
          equipment_reward_id: string | null
          id: string
          linked_skill_id: string | null
          loot_description: string
          name: string
          progress: number
          total: number
          type: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          buff_reward_id?: string | null
          completed?: boolean
          created_at?: string
          debuff_penalty_id?: string | null
          equipment_reward_id?: string | null
          id?: string
          linked_skill_id?: string | null
          loot_description?: string
          name: string
          progress?: number
          total?: number
          type?: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          buff_reward_id?: string | null
          completed?: boolean
          created_at?: string
          debuff_penalty_id?: string | null
          equipment_reward_id?: string | null
          id?: string
          linked_skill_id?: string | null
          loot_description?: string
          name?: string
          progress?: number
          total?: number
          type?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quests_buff_reward_id_fkey"
            columns: ["buff_reward_id"]
            isOneToOne: false
            referencedRelation: "buffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_debuff_penalty_id_fkey"
            columns: ["debuff_penalty_id"]
            isOneToOne: false
            referencedRelation: "buffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_equipment_reward_id_fkey"
            columns: ["equipment_reward_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_linked_skill_id_fkey"
            columns: ["linked_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          level: number
          max_level: number
          name: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          level?: number
          max_level?: number
          name: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          level?: number
          max_level?: number
          name?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      skin_unlock_conditions: {
        Row: {
          description: string | null
          id: string
          skin_name: string
          unlock_type: string
          unlock_value: number
        }
        Insert: {
          description?: string | null
          id?: string
          skin_name: string
          unlock_type?: string
          unlock_value?: number
        }
        Update: {
          description?: string | null
          id?: string
          skin_name?: string
          unlock_type?: string
          unlock_value?: number
        }
        Relationships: []
      }
      subskills: {
        Row: {
          created_at: string
          description: string
          id: string
          level: number
          name: string
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          level?: number
          name: string
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          level?: number
          name?: string
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subskills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_unlocked_skins: {
        Row: {
          id: string
          skin_name: string
          unlock_source: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          skin_name: string
          unlock_source?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          skin_name?: string
          unlock_source?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "user"],
    },
  },
} as const
