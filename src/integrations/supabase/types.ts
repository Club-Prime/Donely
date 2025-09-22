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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      client_project_access: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_user_id: string
          content_md: string
          created_at: string | null
          id: string
          is_visible: boolean | null
          project_id: string
          sprint_id: string
          updated_at: string | null
        }
        Insert: {
          author_user_id: string
          content_md: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          project_id: string
          sprint_id: string
          updated_at?: string | null
        }
        Update: {
          author_user_id?: string
          content_md?: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          project_id?: string
          sprint_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      evidences: {
        Row: {
          created_at: string | null
          id: string
          mime_type: string | null
          report_id: string
          sprint_task_id: string | null
          size_bytes: number | null
          storage_key: string
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["evidence_type"]
          uploaded_by: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mime_type?: string | null
          report_id: string
          sprint_task_id?: string | null
          size_bytes?: number | null
          storage_key: string
          thumbnail_url?: string | null
          type: Database["public"]["Enums"]["evidence_type"]
          uploaded_by: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mime_type?: string | null
          report_id?: string
          sprint_task_id?: string | null
          size_bytes?: number | null
          storage_key?: string
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["evidence_type"]
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidences_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidences_sprint_task_id_fkey"
            columns: ["sprint_task_id"]
            isOneToOne: false
            referencedRelation: "sprint_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_display_name: string | null
          created_at: string | null
          description: string | null
          end_date_target: string | null
          id: string
          name: string
          progress_percent: number | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string | null
        }
        Insert: {
          client_display_name?: string | null
          created_at?: string | null
          description?: string | null
          end_date_target?: string | null
          id?: string
          name: string
          progress_percent?: number | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
        }
        Update: {
          client_display_name?: string | null
          created_at?: string | null
          description?: string | null
          end_date_target?: string | null
          id?: string
          name?: string
          progress_percent?: number | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          content_md: string | null
          created_at: string | null
          created_by: string
          id: string
          is_published: boolean | null
          project_id: string
          published_at: string | null
          sprint_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content_md?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_published?: boolean | null
          project_id: string
          published_at?: string | null
          sprint_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content_md?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_published?: boolean | null
          project_id?: string
          published_at?: string | null
          sprint_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          created_at: string | null
          dependency_ids: string[] | null
          description: string | null
          effort: number | null
          end_date: string | null
          id: string
          order_index: number | null
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["roadmap_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dependency_ids?: string[] | null
          description?: string | null
          effort?: number | null
          end_date?: string | null
          id?: string
          order_index?: number | null
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["roadmap_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dependency_ids?: string[] | null
          description?: string | null
          effort?: number | null
          end_date?: string | null
          id?: string
          order_index?: number | null
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["roadmap_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string | null
          id: string
          planned_scope: Json | null
          project_id: string
          sprint_number: number
          status: Database["public"]["Enums"]["sprint_status"] | null
          updated_at: string | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          planned_scope?: Json | null
          project_id: string
          sprint_number: number
          status?: Database["public"]["Enums"]["sprint_status"] | null
          updated_at?: string | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          id?: string
          planned_scope?: Json | null
          project_id?: string
          sprint_number?: number
          status?: Database["public"]["Enums"]["sprint_status"] | null
          updated_at?: string | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_tasks: {
        Row: {
          id: string
          sprint_id: string
          roadmap_item_id: string | null
          title: string
          description: string | null
          status: Database["public"]["Enums"]["task_status"]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          sprint_id: string
          roadmap_item_id?: string | null
          title: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          sprint_id?: string
          roadmap_item_id?: string | null
          title?: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprint_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_tasks_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_project_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_projects: {
        Args: Record<PropertyKey, never>
        Returns: {
          project_id: string
          project_name: string
          project_slug: string
        }[]
      }
      setup_admin_user: {
        Args: { _email: string; _name: string; _user_id: string }
        Returns: undefined
      }
      setup_demo_client: {
        Args: { _email: string; _name: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "ADMIN" | "CLIENT"
      evidence_type: "IMAGE" | "VIDEO"
      project_status: "PLANNED" | "ACTIVE" | "ON_HOLD" | "DONE"
      roadmap_status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
      sprint_status: "PLANNED" | "IN_PROGRESS" | "DONE"
      task_status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
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
      app_role: ["ADMIN", "CLIENT"],
      evidence_type: ["IMAGE", "VIDEO"],
      project_status: ["PLANNED", "ACTIVE", "ON_HOLD", "DONE"],
      roadmap_status: ["NOT_STARTED", "IN_PROGRESS", "DONE"],
      sprint_status: ["PLANNED", "IN_PROGRESS", "DONE"],
      task_status: ["NOT_STARTED", "IN_PROGRESS", "DONE"],
    },
  },
} as const
