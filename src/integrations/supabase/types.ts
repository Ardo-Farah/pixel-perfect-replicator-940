export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      weekly_reports: {
        Row: {
          id: string
          week_number: number
          reporting_date: string
          published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          week_number: number
          reporting_date: string
          published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          week_number?: number
          reporting_date?: string
          published?: boolean
          created_at?: string
        }
        Relationships: []
      }
      report_summary: {
        Row: {
          id: string
          report_id: string
          new_events: number
          outbreaks: number
          grade_1: number
          grade_2: number
          grade_3: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          new_events?: number
          outbreaks?: number
          grade_1?: number
          grade_2?: number
          grade_3?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          new_events?: number
          outbreaks?: number
          grade_1?: number
          grade_2?: number
          grade_3?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "report_summary_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      mpox_data: {
        Row: {
          id: string
          report_id: string
          cumulative_cases: number
          new_cases_this_week: number
          deaths: number
          cfr: number
          counties_affected: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          cumulative_cases?: number
          new_cases_this_week?: number
          deaths?: number
          cfr?: number
          counties_affected?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          cumulative_cases?: number
          new_cases_this_week?: number
          deaths?: number
          cfr?: number
          counties_affected?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "mpox_data_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      mpox_counties: {
        Row: {
          id: string
          report_id: string
          county_name: string
          cases_2026: number
          is_hotspot: boolean
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          county_name: string
          cases_2026?: number
          is_hotspot?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          county_name?: string
          cases_2026?: number
          is_hotspot?: boolean
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "mpox_counties_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      mpox_demographics: {
        Row: {
          id: string
          report_id: string
          age_group: string | null
          sex: string | null
          occupation: string | null
          case_count: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          age_group?: string | null
          sex?: string | null
          occupation?: string | null
          case_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          age_group?: string | null
          sex?: string | null
          occupation?: string | null
          case_count?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "mpox_demographics_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      measles_data: {
        Row: {
          id: string
          report_id: string
          total_cases: number
          confirmed: number
          suspected: number
          counties_affected: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          total_cases?: number
          confirmed?: number
          suspected?: number
          counties_affected?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          total_cases?: number
          confirmed?: number
          suspected?: number
          counties_affected?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "measles_data_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      measles_counties: {
        Row: {
          id: string
          report_id: string
          county_name: string
          sub_county: string | null
          case_count: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          county_name: string
          sub_county?: string | null
          case_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          county_name?: string
          sub_county?: string | null
          case_count?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "measles_counties_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      anthrax_data: {
        Row: {
          id: string
          report_id: string
          county: string
          sub_county: string | null
          human_cases: number
          human_deaths: number
          animal_deaths: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          county: string
          sub_county?: string | null
          human_cases?: number
          human_deaths?: number
          animal_deaths?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          county?: string
          sub_county?: string | null
          human_cases?: number
          human_deaths?: number
          animal_deaths?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "anthrax_data_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      floods_data: {
        Row: {
          id: string
          report_id: string
          counties_affected: number
          total_deaths: number
          missing_persons: number
          coast_deaths: number
          eastern_deaths: number
          nyanza_deaths: number
          rift_valley_deaths: number
          western_deaths: number
          nairobi_deaths: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          counties_affected?: number
          total_deaths?: number
          missing_persons?: number
          coast_deaths?: number
          eastern_deaths?: number
          nyanza_deaths?: number
          rift_valley_deaths?: number
          western_deaths?: number
          nairobi_deaths?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          counties_affected?: number
          total_deaths?: number
          missing_persons?: number
          coast_deaths?: number
          eastern_deaths?: number
          nyanza_deaths?: number
          rift_valley_deaths?: number
          western_deaths?: number
          nairobi_deaths?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "floods_data_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      idsr_data: {
        Row: {
          id: string
          report_id: string
          completeness_pct: number
          timeliness_pct: number
          cebs_community_signals: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          completeness_pct?: number
          timeliness_pct?: number
          cebs_community_signals?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          completeness_pct?: number
          timeliness_pct?: number
          cebs_community_signals?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "idsr_data_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      idsr_counties: {
        Row: {
          id: string
          report_id: string
          county_name: string
          completeness_pct: number
          timeliness_pct: number
          below_threshold: boolean
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          county_name: string
          completeness_pct?: number
          timeliness_pct?: number
          below_threshold?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          county_name?: string
          completeness_pct?: number
          timeliness_pct?: number
          below_threshold?: boolean
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "idsr_counties_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      nutrition_data: {
        Row: {
          id: string
          report_id: string
          phase3_above: number
          phase4_5: number
          ipc_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          phase3_above?: number
          phase4_5?: number
          ipc_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          phase3_above?: number
          phase4_5?: number
          ipc_notes?: string | null
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "nutrition_data_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      nutrition_counties: {
        Row: {
          id: string
          report_id: string
          county_name: string
          ipc_phase: number
          projected_phase: number | null
          population_affected: number
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          county_name: string
          ipc_phase?: number
          projected_phase?: number | null
          population_affected?: number
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          county_name?: string
          ipc_phase?: number
          projected_phase?: number | null
          population_affected?: number
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "nutrition_counties_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      weather_data: {
        Row: {
          id: string
          report_id: string
          region: string
          max_temp_c: number | null
          min_temp_c: number | null
          rainfall_onset: string | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          region: string
          max_temp_c?: number | null
          min_temp_c?: number | null
          rainfall_onset?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          region?: string
          max_temp_c?: number | null
          min_temp_c?: number | null
          rainfall_onset?: string | null
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "weather_data_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }]
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          report_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          report_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          report_id?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "audit_log_report_id_fkey"; columns: ["report_id"]; referencedRelation: "weekly_reports"; referencedColumns: ["id"] },
          { foreignKeyName: "audit_log_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_id: string | null
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string | null
          parts?: Json
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string | null
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
