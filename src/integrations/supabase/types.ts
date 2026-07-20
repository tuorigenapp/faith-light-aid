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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          plan: string
          scheduled_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          plan: string
          scheduled_at: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          plan?: string
          scheduled_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
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
      daily_activity: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          reference_id: string | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_devotionals: {
        Row: {
          challenge: string
          created_at: string
          day_of_year: number
          id: string
          image_key: string | null
          quote: string
          reflection: string
          scripture: string
          word: string
        }
        Insert: {
          challenge: string
          created_at?: string
          day_of_year: number
          id?: string
          image_key?: string | null
          quote: string
          reflection: string
          scripture: string
          word: string
        }
        Update: {
          challenge?: string
          created_at?: string
          day_of_year?: number
          id?: string
          image_key?: string | null
          quote?: string
          reflection?: string
          scripture?: string
          word?: string
        }
        Relationships: []
      }
      diagnostic_results: {
        Row: {
          ai_summary: string | null
          answers: Json
          created_at: string
          id: string
          level: string
          recommended_plan: string | null
          risks: string[] | null
          scores: Json
          strengths: string[] | null
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          ai_summary?: string | null
          answers: Json
          created_at?: string
          id?: string
          level: string
          recommended_plan?: string | null
          risks?: string[] | null
          scores: Json
          strengths?: string[] | null
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          ai_summary?: string | null
          answers?: Json
          created_at?: string
          id?: string
          level?: string
          recommended_plan?: string | null
          risks?: string[] | null
          scores?: Json
          strengths?: string[] | null
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      exercise_completions: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_completions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          day_index: number | null
          description: string | null
          difficulty: string
          duration_minutes: number | null
          id: string
          image_key: string | null
          scripture: string | null
          sort_order: number
          steps: Json | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          day_index?: number | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number | null
          id?: string
          image_key?: string | null
          scripture?: string | null
          sort_order?: number
          steps?: Json | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          day_index?: number | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number | null
          id?: string
          image_key?: string | null
          scripture?: string | null
          sort_order?: number
          steps?: Json | null
          title?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          full_name: string
          id: string
          lineage: string
          notes: string | null
          relationship: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          lineage: string
          notes?: string | null
          relationship: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          lineage?: string
          notes?: string | null
          relationship?: string
          user_id?: string
        }
        Relationships: []
      }
      gem_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          meta: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          meta?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      intake_sessions: {
        Row: {
          ai_plan: Json | null
          ai_summary: string | null
          childhood: Json | null
          closure_completed_at: string | null
          created_at: string
          genealogy: Json | null
          id: string
          primary_focus: string | null
          stage: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_plan?: Json | null
          ai_summary?: string | null
          childhood?: Json | null
          closure_completed_at?: string | null
          created_at?: string
          genealogy?: Json | null
          id?: string
          primary_focus?: string | null
          stage?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_plan?: Json | null
          ai_summary?: string | null
          childhood?: Json | null
          closure_completed_at?: string | null
          created_at?: string
          genealogy?: Json | null
          id?: string
          primary_focus?: string | null
          stage?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          mood: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind: string
          mood?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          mood?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_items: {
        Row: {
          category: string
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          required_plan: string
          resource_url: string | null
          title: string
        }
        Insert: {
          category: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          required_plan?: string
          resource_url?: string | null
          title: string
        }
        Update: {
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          required_plan?: string
          resource_url?: string | null
          title?: string
        }
        Relationships: []
      }
      manifest_audios: {
        Row: {
          affirmation: string
          audio_url: string | null
          category_id: string
          cover_url: string | null
          created_at: string
          day_index: number
          duration_seconds: number | null
          id: string
          title: string
        }
        Insert: {
          affirmation: string
          audio_url?: string | null
          category_id: string
          cover_url?: string | null
          created_at?: string
          day_index: number
          duration_seconds?: number | null
          id?: string
          title: string
        }
        Update: {
          affirmation?: string
          audio_url?: string | null
          category_id?: string
          cover_url?: string | null
          created_at?: string
          day_index?: number
          duration_seconds?: number | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "manifest_audios_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "manifest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      manifest_categories: {
        Row: {
          affirmation_ya_tengo: string
          color: string | null
          created_at: string
          gratitude_gracias: string
          id: string
          identity_yo_soy: string
          petition: string
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          affirmation_ya_tengo: string
          color?: string | null
          created_at?: string
          gratitude_gracias: string
          id: string
          identity_yo_soy: string
          petition: string
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          affirmation_ya_tengo?: string
          color?: string | null
          created_at?: string
          gratitude_gracias?: string
          id?: string
          identity_yo_soy?: string
          petition?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      manifest_entries: {
        Row: {
          audio_id: string
          completed: boolean | null
          created_at: string
          gratitud: string | null
          id: string
          peticion: string | null
          played: boolean | null
          updated_at: string
          user_id: string
          ya_tengo: string | null
          yo_soy: string | null
        }
        Insert: {
          audio_id: string
          completed?: boolean | null
          created_at?: string
          gratitud?: string | null
          id?: string
          peticion?: string | null
          played?: boolean | null
          updated_at?: string
          user_id: string
          ya_tengo?: string | null
          yo_soy?: string | null
        }
        Update: {
          audio_id?: string
          completed?: boolean | null
          created_at?: string
          gratitud?: string | null
          id?: string
          peticion?: string | null
          played?: boolean | null
          updated_at?: string
          user_id?: string
          ya_tengo?: string | null
          yo_soy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manifest_entries_audio_id_fkey"
            columns: ["audio_id"]
            isOneToOne: false
            referencedRelation: "manifest_audios"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: Json
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: Json
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          consecutive_days: number
          country: string | null
          created_at: string
          current_stage: number
          display_name: string | null
          email: string | null
          full_name: string | null
          gems: number
          id: string
          last_activity_at: string | null
          spiritual_level: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          consecutive_days?: number
          country?: string | null
          created_at?: string
          current_stage?: number
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gems?: number
          id: string
          last_activity_at?: string | null
          spiritual_level?: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          consecutive_days?: number
          country?: string | null
          created_at?: string
          current_stage?: number
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gems?: number
          id?: string
          last_activity_at?: string | null
          spiritual_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      stage_progress: {
        Row: {
          completed_at: string | null
          completed_tasks: Json | null
          created_at: string
          id: string
          notes: string | null
          stage_id: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_tasks?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          stage_id: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_tasks?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          stage_id?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_progress_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          created_at: string
          deep_explanation: string | null
          description: string | null
          focus_area: string | null
          id: number
          image_key: string | null
          prayer: string | null
          problem_tags: string[] | null
          recommended_action: string | null
          reflection: string | null
          scripture: string | null
          scripture_reference: string | null
          solution_steps: Json | null
          subtitle: string | null
          tasks: Json | null
          title: string
        }
        Insert: {
          created_at?: string
          deep_explanation?: string | null
          description?: string | null
          focus_area?: string | null
          id: number
          image_key?: string | null
          prayer?: string | null
          problem_tags?: string[] | null
          recommended_action?: string | null
          reflection?: string | null
          scripture?: string | null
          scripture_reference?: string | null
          solution_steps?: Json | null
          subtitle?: string | null
          tasks?: Json | null
          title: string
        }
        Update: {
          created_at?: string
          deep_explanation?: string | null
          description?: string | null
          focus_area?: string | null
          id?: number
          image_key?: string | null
          prayer?: string | null
          problem_tags?: string[] | null
          recommended_action?: string | null
          reflection?: string | null
          scripture?: string | null
          scripture_reference?: string | null
          solution_steps?: Json | null
          subtitle?: string | null
          tasks?: Json | null
          title?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          ai_messages_used: number
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_messages_used?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_messages_used?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_gems: {
        Args: { _amount: number; _meta?: Json; _reason: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
