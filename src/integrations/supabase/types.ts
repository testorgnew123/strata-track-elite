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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          file_path: string
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          project_id: string
          title: string
          uploader_id: string | null
          version: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          project_id: string
          title: string
          uploader_id?: string | null
          version?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string
          title?: string
          uploader_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          provider_id: string | null
          recipient_email: string
          recipient_id: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          provider_id?: string | null
          recipient_email: string
          recipient_id?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          provider_id?: string | null
          recipient_email?: string
          recipient_id?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["milestone_status"]
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          enabled: boolean
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          subject: string
          updated_at: string
        }
        Insert: {
          body_template: string
          enabled?: boolean
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          subject: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          enabled?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link_to: string | null
          project_id: string | null
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link_to?: string | null
          project_id?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link_to?: string | null
          project_id?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          language: Database["public"]["Enums"]["app_language"]
          mobile: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: Database["public"]["Enums"]["app_language"]
          mobile?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          mobile?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progress_updates: {
        Row: {
          author_id: string | null
          caption: string | null
          category: Database["public"]["Enums"]["progress_category"]
          created_at: string
          id: string
          photo_url: string | null
          project_id: string
          taken_at: string
        }
        Insert: {
          author_id?: string | null
          caption?: string | null
          category?: Database["public"]["Enums"]["progress_category"]
          created_at?: string
          id?: string
          photo_url?: string | null
          project_id: string
          taken_at?: string
        }
        Update: {
          author_id?: string | null
          caption?: string | null
          category?: Database["public"]["Enums"]["progress_category"]
          created_at?: string
          id?: string
          photo_url?: string | null
          project_id?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ratings: {
        Row: {
          client_id: string
          created_at: string
          feedback: string | null
          id: string
          project_id: string
          stars: number
        }
        Insert: {
          client_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          project_id: string
          stars: number
        }
        Update: {
          client_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          project_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          client_display_name: string | null
          code: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          expected_handover_date: string | null
          id: string
          name: string
          progress_percent: number
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_display_name?: string | null
          code: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          expected_handover_date?: string | null
          id?: string
          name: string
          progress_percent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_display_name?: string | null
          code?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          expected_handover_date?: string | null
          id?: string
          name?: string
          progress_percent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      queries: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["query_priority"]
          project_id: string
          status: Database["public"]["Enums"]["query_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["query_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["query_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["query_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["query_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      query_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          query_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          query_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          query_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_replies_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "queries"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["readiness_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["readiness_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["readiness_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          note: string | null
          project_id: string
          referee_contact: string
          referee_name: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          project_id: string
          referee_contact: string
          referee_name: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          project_id?: string
          referee_contact?: string
          referee_name?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          project_id: string
          requested_by: string
          requested_date: string
          requested_slot: string | null
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          requested_by: string
          requested_date: string
          requested_slot?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          requested_by?: string
          requested_date?: string
          requested_slot?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      _admin_ids: { Args: never; Returns: string[] }
      _project_client_ids: { Args: { _project_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_language: "en" | "hi"
      app_role: "client" | "engineer" | "admin"
      document_category:
        | "contract"
        | "floor_plan"
        | "permit"
        | "report"
        | "invoice_doc"
        | "other"
      milestone_status: "pending" | "in_progress" | "completed"
      notification_kind:
        | "milestone_pending_ack"
        | "visit_reminder"
        | "query_reply"
        | "document_added"
        | "progress_added"
        | "handover_ready"
      progress_category:
        | "structure"
        | "plumbing"
        | "electrical"
        | "finishing"
        | "exterior"
        | "other"
      project_status:
        | "planning"
        | "in_progress"
        | "on_hold"
        | "handover"
        | "completed"
      query_priority: "low" | "normal" | "high"
      query_status: "open" | "answered" | "closed"
      readiness_status: "pending" | "done" | "na"
      visit_status: "requested" | "confirmed" | "completed" | "cancelled"
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
      app_language: ["en", "hi"],
      app_role: ["client", "engineer", "admin"],
      document_category: [
        "contract",
        "floor_plan",
        "permit",
        "report",
        "invoice_doc",
        "other",
      ],
      milestone_status: ["pending", "in_progress", "completed"],
      notification_kind: [
        "milestone_pending_ack",
        "visit_reminder",
        "query_reply",
        "document_added",
        "progress_added",
        "handover_ready",
      ],
      progress_category: [
        "structure",
        "plumbing",
        "electrical",
        "finishing",
        "exterior",
        "other",
      ],
      project_status: [
        "planning",
        "in_progress",
        "on_hold",
        "handover",
        "completed",
      ],
      query_priority: ["low", "normal", "high"],
      query_status: ["open", "answered", "closed"],
      readiness_status: ["pending", "done", "na"],
      visit_status: ["requested", "confirmed", "completed", "cancelled"],
    },
  },
} as const
