export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      episodes: {                       // Table for podcast episodes
        Row: {
          audio_url: string             //Cloudflare R2 URL
          date: string                  // Date of the episode
          description: string | null    // Episode description
          episode_num: number | null    // Episode number
          episode_slug: string          // UUID v7
          id: number                    // PK
          passage: string | null        // Bible passage
          podcast_slug: string          // FK to podcasts table
          series: string | null         // Series name    
          speaker_id: string | null     // FK to speakers table 
          title: string
        }
        Insert: {
          audio_url: string
          date: string
          description?: string | null
          episode_num?: number | null
          episode_slug?: string
          id?: number
          passage?: string | null
          podcast_slug: string
          series?: string | null
          speaker_id?: string | null
          title: string
        }
        Update: {
          audio_url?: string
          date?: string
          description?: string | null
          episode_num?: number | null
          episode_slug?: string
          id?: number
          passage?: string | null
          podcast_slug?: string
          series?: string | null
          speaker_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_podcast_slug_fkey"
            columns: ["podcast_slug"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["feed_slug"]
          },
          {
            foreignKeyName: "episodes_speaker_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          category: string | null
          description: string | null
          feed_slug: string
          id: string
          image_url: string | null
          language: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          feed_slug: string
          id?: string
          image_url?: string | null
          language?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          feed_slug?: string
          id?: string
          image_url?: string | null
          language?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      speakers: {
        Row: {
          first_name: string
          id: string
          last_name: string | null
          speaker_slug: string | null
          user_id: string | null
        }
        Insert: {
          first_name: string
          id?: string
          last_name?: string | null
          speaker_slug?: string | null
          user_id?: string | null
        }
        Update: {
          first_name?: string
          id?: string
          last_name?: string | null
          speaker_slug?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_uuid_v7: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
