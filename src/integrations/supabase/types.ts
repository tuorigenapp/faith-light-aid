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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_backup_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          requested_by: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          requested_by: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          requested_by?: string
        }
        Relationships: []
      }
      admin_backups: {
        Row: {
          created_at: string
          email: string
          id: string
          requested_by: string | null
          size_bytes: number | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          requested_by?: string | null
          size_bytes?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          requested_by?: string | null
          size_bytes?: number | null
          status?: string
        }
        Relationships: []
      }
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
      cancellation_surveys: {
        Row: {
          comment: string | null
          created_at: string
          from_plan: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_plan?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_plan?: string | null
          id?: string
          reason?: string
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
      daily_quizzes: {
        Row: {
          correct_key: string
          created_at: string
          day: string
          explanation: string
          id: string
          options: Json
          question: string
        }
        Insert: {
          correct_key: string
          created_at?: string
          day: string
          explanation: string
          id?: string
          options: Json
          question: string
        }
        Update: {
          correct_key?: string
          created_at?: string
          day?: string
          explanation?: string
          id?: string
          options?: Json
          question?: string
        }
        Relationships: []
      }
      daily_reflections: {
        Row: {
          created_at: string
          day: string
          id: string
          options: Json
          question: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          options: Json
          question: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          options?: Json
          question?: string
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
          photo_url: string | null
          relationship: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          lineage: string
          notes?: string | null
          photo_url?: string | null
          relationship: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          lineage?: string
          notes?: string | null
          photo_url?: string | null
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
      hoja_transfers: {
        Row: {
          created_at: string
          id: string
          note: string | null
          points: number
          status: string
          to_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          points: number
          status?: string
          to_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          points?: number
          status?: string
          to_email?: string
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          external_key: string | null
          id: string
          kind: string
          required_plan: string
          resource_url: string | null
          slug: string | null
          sort_order: number
          title: string
        }
        Insert: {
          category: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          external_key?: string | null
          id?: string
          kind: string
          required_plan?: string
          resource_url?: string | null
          slug?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          external_key?: string | null
          id?: string
          kind?: string
          required_plan?: string
          resource_url?: string | null
          slug?: string | null
          sort_order?: number
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
          exercise: string | null
          id: string
          is_published: boolean
          lesson: string | null
          pdf_url: string | null
          quiz: Json
          title: string
          updated_at: string
          word_game: Json
        }
        Insert: {
          affirmation: string
          audio_url?: string | null
          category_id: string
          cover_url?: string | null
          created_at?: string
          day_index: number
          duration_seconds?: number | null
          exercise?: string | null
          id?: string
          is_published?: boolean
          lesson?: string | null
          pdf_url?: string | null
          quiz?: Json
          title: string
          updated_at?: string
          word_game?: Json
        }
        Update: {
          affirmation?: string
          audio_url?: string | null
          category_id?: string
          cover_url?: string | null
          created_at?: string
          day_index?: number
          duration_seconds?: number | null
          exercise?: string | null
          id?: string
          is_published?: boolean
          lesson?: string | null
          pdf_url?: string | null
          quiz?: Json
          title?: string
          updated_at?: string
          word_game?: Json
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
          cover_url: string | null
          created_at: string
          description: string | null
          gratitude_gracias: string
          group_key: string
          id: string
          identity_yo_soy: string
          is_published: boolean
          pdf_url: string | null
          petition: string
          program_group: string
          required_plan: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          affirmation_ya_tengo: string
          color?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gratitude_gracias: string
          group_key?: string
          id: string
          identity_yo_soy: string
          is_published?: boolean
          pdf_url?: string | null
          petition: string
          program_group?: string
          required_plan?: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          affirmation_ya_tengo?: string
          color?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gratitude_gracias?: string
          group_key?: string
          id?: string
          identity_yo_soy?: string
          is_published?: boolean
          pdf_url?: string | null
          petition?: string
          program_group?: string
          required_plan?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
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
      marketing_campaigns: {
        Row: {
          audience_type: string
          button_text: string | null
          button_url: string | null
          channel: string
          click_count: number
          content: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          last_sent_at: string | null
          list_id: string | null
          max_per_day: number
          name: string
          scheduled_at: string | null
          sent_count: number
          sent_today: number
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          audience_type?: string
          button_text?: string | null
          button_url?: string | null
          channel: string
          click_count?: number
          content: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          last_sent_at?: string | null
          list_id?: string | null
          max_per_day?: number
          name: string
          scheduled_at?: string | null
          sent_count?: number
          sent_today?: number
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          audience_type?: string
          button_text?: string | null
          button_url?: string | null
          channel?: string
          click_count?: number
          content?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          last_sent_at?: string | null
          list_id?: string | null
          max_per_day?: number
          name?: string
          scheduled_at?: string | null
          sent_count?: number
          sent_today?: number
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "marketing_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_events: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_list_members: {
        Row: {
          created_at: string
          list_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          list_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "marketing_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_lists: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          filter_type: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_type?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_type?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      ministracion_lecturas: {
        Row: {
          created_at: string
          dictamen: string | null
          dob: string | null
          headline: string | null
          id: string
          linea_tiempo: string | null
          ministracion: string | null
          name: string | null
          question: string | null
          rompe_ciclo: string | null
          senales: Json | null
          user_id: string
          versiculo: string | null
        }
        Insert: {
          created_at?: string
          dictamen?: string | null
          dob?: string | null
          headline?: string | null
          id?: string
          linea_tiempo?: string | null
          ministracion?: string | null
          name?: string | null
          question?: string | null
          rompe_ciclo?: string | null
          senales?: Json | null
          user_id: string
          versiculo?: string | null
        }
        Update: {
          created_at?: string
          dictamen?: string | null
          dob?: string | null
          headline?: string | null
          id?: string
          linea_tiempo?: string | null
          ministracion?: string | null
          name?: string | null
          question?: string | null
          rompe_ciclo?: string | null
          senales?: Json | null
          user_id?: string
          versiculo?: string | null
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          email_enabled: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pareja_lecturas: {
        Row: {
          advice: string | null
          created_at: string
          id: string
          next_step: string | null
          partner_dob: string | null
          partner_name: string | null
          pattern: string | null
          question: string | null
          self_dob: string | null
          self_name: string | null
          summary: string | null
          user_id: string
          verdict: string | null
        }
        Insert: {
          advice?: string | null
          created_at?: string
          id?: string
          next_step?: string | null
          partner_dob?: string | null
          partner_name?: string | null
          pattern?: string | null
          question?: string | null
          self_dob?: string | null
          self_name?: string | null
          summary?: string | null
          user_id: string
          verdict?: string | null
        }
        Update: {
          advice?: string | null
          created_at?: string
          id?: string
          next_step?: string | null
          partner_dob?: string | null
          partner_name?: string | null
          pattern?: string | null
          question?: string | null
          self_dob?: string | null
          self_name?: string | null
          summary?: string | null
          user_id?: string
          verdict?: string | null
        }
        Relationships: []
      }
      patrones_consultas: {
        Row: {
          birthdate: string | null
          created_at: string
          id: string
          name: string | null
          observation: string | null
          patterns: Json | null
          question: string | null
          recommendations: Json | null
          reflection: string | null
          user_id: string
        }
        Insert: {
          birthdate?: string | null
          created_at?: string
          id?: string
          name?: string | null
          observation?: string | null
          patterns?: Json | null
          question?: string | null
          recommendations?: Json | null
          reflection?: string | null
          user_id: string
        }
        Update: {
          birthdate?: string | null
          created_at?: string
          id?: string
          name?: string | null
          observation?: string | null
          patterns?: Json | null
          question?: string | null
          recommendations?: Json | null
          reflection?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          consecutive_days: number
          content_pref: string | null
          country: string | null
          created_at: string
          current_stage: number
          display_name: string | null
          email: string | null
          excluded_from_metrics: boolean
          full_name: string | null
          gems: number
          id: string
          intention: string | null
          interests: string[] | null
          last_activity_at: string | null
          profile_completed_at: string | null
          referral_code: string | null
          spiritual_level: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          consecutive_days?: number
          content_pref?: string | null
          country?: string | null
          created_at?: string
          current_stage?: number
          display_name?: string | null
          email?: string | null
          excluded_from_metrics?: boolean
          full_name?: string | null
          gems?: number
          id: string
          intention?: string | null
          interests?: string[] | null
          last_activity_at?: string | null
          profile_completed_at?: string | null
          referral_code?: string | null
          spiritual_level?: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          consecutive_days?: number
          content_pref?: string | null
          country?: string | null
          created_at?: string
          current_stage?: number
          display_name?: string | null
          email?: string | null
          excluded_from_metrics?: boolean
          full_name?: string | null
          gems?: number
          id?: string
          intention?: string | null
          interests?: string[] | null
          last_activity_at?: string | null
          profile_completed_at?: string | null
          referral_code?: string | null
          spiritual_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string
          id: string
          p256dh: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint: string
          id?: string
          p256dh?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          invited_email: string | null
          owner_id: string
          reward_gems: number
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          invited_email?: string | null
          owner_id: string
          reward_gems?: number
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          invited_email?: string | null
          owner_id?: string
          reward_gems?: number
          status?: string
        }
        Relationships: []
      }
      satisfaction_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          section: string
          stars: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          section: string
          stars: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          section?: string
          stars?: number
          user_id?: string
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
      stage_rewards: {
        Row: {
          created_at: string
          id: string
          insignia: string | null
          leaves: number
          stage_id: number
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          insignia?: string | null
          leaves?: number
          stage_id: number
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          insignia?: string | null
          leaves?: number
          stage_id?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      stage_step_entries: {
        Row: {
          answers: Json
          confirmed: boolean
          created_at: string
          id: string
          kind: string
          response: string | null
          stage_id: number
          step_key: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          confirmed?: boolean
          created_at?: string
          id?: string
          kind?: string
          response?: string | null
          stage_id: number
          step_key: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          confirmed?: boolean
          created_at?: string
          id?: string
          kind?: string
          response?: string | null
          stage_id?: number
          step_key?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      wheel_spins: {
        Row: {
          created_at: string
          id: string
          prize_key: string
          prize_label: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prize_key: string
          prize_label: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prize_key?: string
          prize_label?: string
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
      create_hoja_transfer: {
        Args: { _hojas: number; _to_email: string }
        Returns: string
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
      app_role: "admin" | "user" | "marketing" | "soporte"
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
      app_role: ["admin", "user", "marketing", "soporte"],
    },
  },
} as const
