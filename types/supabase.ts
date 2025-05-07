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
      categories: {
        Row: {
          apple_approved: boolean | null
          category_id: number
          created_at: string | null
          name: string
          parent_category_id: number | null
          updated_at: string | null
        }
        Insert: {
          apple_approved?: boolean | null
          category_id?: number
          created_at?: string | null
          name: string
          parent_category_id?: number | null
          updated_at?: string | null
        }
        Update: {
          apple_approved?: boolean | null
          category_id?: number
          created_at?: string | null
          name?: string
          parent_category_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      episode_speakers: {
        Row: {
          display_order: number | null
          episode_id: number
          role: string
          speaker_id: number
        }
        Insert: {
          display_order?: number | null
          episode_id: number
          role?: string
          speaker_id: number
        }
        Update: {
          display_order?: number | null
          episode_id?: number
          role?: string
          speaker_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "episode_speakers_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["episode_id"]
          },
          {
            foreignKeyName: "episode_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["speaker_id"]
          },
        ]
      }
      episode_transcripts: {
        Row: {
          created_at: string | null
          episode_id: number
          language_code: string | null
          mime_type: string
          rel_type: string | null
          transcript_id: number
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          episode_id: number
          language_code?: string | null
          mime_type: string
          rel_type?: string | null
          transcript_id?: number
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          episode_id?: number
          language_code?: string | null
          mime_type?: string
          rel_type?: string | null
          transcript_id?: number
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_transcripts_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["episode_id"]
          },
        ]
      }
      episodes: {
        Row: {
          audio_url: string | null
          content_encoded_html: string | null
          created_at: string | null
          description: string | null
          enclosure_length_bytes: number
          enclosure_mime_type: string
          enclosure_url: string
          episode_id: number
          guid: string | null
          itunes_duration_seconds: number | null
          itunes_episode_number: number | null
          itunes_episode_type: string | null
          itunes_explicit: boolean | null
          itunes_image_url: string | null
          itunes_season_number: number | null
          itunes_summary: string | null
          podcast_slug: string
          publication_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          content_encoded_html?: string | null
          created_at?: string | null
          description?: string | null
          enclosure_length_bytes: number
          enclosure_mime_type: string
          enclosure_url: string
          episode_id?: number
          guid?: string | null
          itunes_duration_seconds?: number | null
          itunes_episode_number?: number | null
          itunes_episode_type?: string | null
          itunes_explicit?: boolean | null
          itunes_image_url?: string | null
          itunes_season_number?: number | null
          itunes_summary?: string | null
          podcast_slug: string
          publication_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          content_encoded_html?: string | null
          created_at?: string | null
          description?: string | null
          enclosure_length_bytes?: number
          enclosure_mime_type?: string
          enclosure_url?: string
          episode_id?: number
          guid?: string | null
          itunes_duration_seconds?: number | null
          itunes_episode_number?: number | null
          itunes_episode_type?: string | null
          itunes_explicit?: boolean | null
          itunes_image_url?: string | null
          itunes_season_number?: number | null
          itunes_summary?: string | null
          podcast_slug?: string
          publication_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_podcast_slug_fkey"
            columns: ["podcast_slug"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["podcast_slug"]
          },
        ]
      }
      podcast_categories: {
        Row: {
          category_id: number
          podcast_id: number
        }
        Insert: {
          category_id: number
          podcast_id: number
        }
        Update: {
          category_id?: number
          podcast_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "podcast_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "podcast_categories_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["podcast_id"]
          },
        ]
      }
      podcast_speakers: {
        Row: {
          display_order: number | null
          podcast_id: number
          role: string
          speaker_id: number
        }
        Insert: {
          display_order?: number | null
          podcast_id: number
          role?: string
          speaker_id: number
        }
        Update: {
          display_order?: number | null
          podcast_id?: number
          role?: string
          speaker_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "podcast_speakers_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["podcast_id"]
          },
          {
            foreignKeyName: "podcast_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["speaker_id"]
          },
        ]
      }
      podcasts: {
        Row: {
          atom_link_self_url: string | null
          copyright_text: string | null
          created_at: string | null
          description: string | null
          image_url: string
          itunes_author_name: string | null
          itunes_complete: boolean | null
          itunes_explicit: boolean
          itunes_owner_email: string | null
          itunes_owner_name: string | null
          itunes_summary: string | null
          itunes_type: string | null
          language_code: string
          link_website: string
          podcast_id: number
          podcast_namespace_guid: string | null
          podcast_namespace_locked: boolean | null
          podcast_namespace_owner_email_for_lock: string | null
          podcast_slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          atom_link_self_url?: string | null
          copyright_text?: string | null
          created_at?: string | null
          description?: string | null
          image_url: string
          itunes_author_name?: string | null
          itunes_complete?: boolean | null
          itunes_explicit?: boolean
          itunes_owner_email?: string | null
          itunes_owner_name?: string | null
          itunes_summary?: string | null
          itunes_type?: string | null
          language_code?: string
          link_website: string
          podcast_id?: number
          podcast_namespace_guid?: string | null
          podcast_namespace_locked?: boolean | null
          podcast_namespace_owner_email_for_lock?: string | null
          podcast_slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          atom_link_self_url?: string | null
          copyright_text?: string | null
          created_at?: string | null
          description?: string | null
          image_url?: string
          itunes_author_name?: string | null
          itunes_complete?: boolean | null
          itunes_explicit?: boolean
          itunes_owner_email?: string | null
          itunes_owner_name?: string | null
          itunes_summary?: string | null
          itunes_type?: string | null
          language_code?: string
          link_website?: string
          podcast_id?: number
          podcast_namespace_guid?: string | null
          podcast_namespace_locked?: boolean | null
          podcast_namespace_owner_email_for_lock?: string | null
          podcast_slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      speakers: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          name: string
          profile_image_url: string | null
          speaker_id: number
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          name: string
          profile_image_url?: string | null
          speaker_id?: number
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          name?: string
          profile_image_url?: string | null
          speaker_id?: number
          updated_at?: string | null
          website_url?: string | null
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
