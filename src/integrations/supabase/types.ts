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
          created_at: string | null
          details: Json | null
          id: string
          metadata: Json
          report_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          metadata?: Json
          report_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          metadata?: Json
          report_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      cholera_data: {
        Row: {
          cases: number | null
          cfr: number | null
          county: string | null
          created_at: string
          deaths: number | null
          gaps_next_steps: string | null
          id: string
          prompt_action: string | null
          report_id: string
          response_activities: string | null
          response_updates: string | null
          sub_county: string | null
        }
        Insert: {
          cases?: number | null
          cfr?: number | null
          county?: string | null
          created_at?: string
          deaths?: number | null
          gaps_next_steps?: string | null
          id?: string
          prompt_action?: string | null
          report_id: string
          response_activities?: string | null
          response_updates?: string | null
          sub_county?: string | null
        }
        Update: {
          cases?: number | null
          cfr?: number | null
          county?: string | null
          created_at?: string
          deaths?: number | null
          gaps_next_steps?: string | null
          id?: string
          prompt_action?: string | null
          report_id?: string
          response_activities?: string | null
          response_updates?: string | null
          sub_county?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cholera_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      dengue_data: {
        Row: {
          cases: number | null
          cfr: number | null
          county: string | null
          created_at: string
          deaths: number | null
          gaps_next_steps: string | null
          id: string
          prompt_action: string | null
          report_id: string
          response_activities: string | null
          response_updates: string | null
          sub_county: string | null
        }
        Insert: {
          cases?: number | null
          cfr?: number | null
          county?: string | null
          created_at?: string
          deaths?: number | null
          gaps_next_steps?: string | null
          id?: string
          prompt_action?: string | null
          report_id: string
          response_activities?: string | null
          response_updates?: string | null
          sub_county?: string | null
        }
        Update: {
          cases?: number | null
          cfr?: number | null
          county?: string | null
          created_at?: string
          deaths?: number | null
          gaps_next_steps?: string | null
          id?: string
          prompt_action?: string | null
          report_id?: string
          response_activities?: string | null
          response_updates?: string | null
          sub_county?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dengue_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_type: string
          id: string
          name: string
          report_id: string | null
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
          week_number: number | null
        }
        Insert: {
          created_at?: string
          file_type: string
          id?: string
          name: string
          report_id?: string | null
          size_bytes?: number
          storage_path: string
          uploaded_by?: string | null
          week_number?: number | null
        }
        Update: {
          created_at?: string
          file_type?: string
          id?: string
          name?: string
          report_id?: string | null
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ebola_data: {
        Row: {
          cases: number | null
          cfr: number | null
          county: string | null
          created_at: string
          deaths: number | null
          gaps_next_steps: string | null
          id: string
          prompt_action: string | null
          report_id: string
          response_activities: string | null
          response_updates: string | null
          sub_county: string | null
        }
        Insert: {
          cases?: number | null
          cfr?: number | null
          county?: string | null
          created_at?: string
          deaths?: number | null
          gaps_next_steps?: string | null
          id?: string
          prompt_action?: string | null
          report_id: string
          response_activities?: string | null
          response_updates?: string | null
          sub_county?: string | null
        }
        Update: {
          cases?: number | null
          cfr?: number | null
          county?: string | null
          created_at?: string
          deaths?: number | null
          gaps_next_steps?: string | null
          id?: string
          prompt_action?: string | null
          report_id?: string
          response_activities?: string | null
          response_updates?: string | null
          sub_county?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ebola_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      floods_data: {
        Row: {
          central_deaths: number | null
          challenges: string | null
          coast_deaths: number | null
          counties_affected: number | null
          eastern_deaths: number | null
          epidemiological_risks: string | null
          health_facility_status: string | null
          id: string
          imst_activated: boolean | null
          missing_persons: number | null
          nairobi_deaths: number | null
          north_eastern_deaths: number
          northeastern_deaths: number | null
          nyanza_deaths: number | null
          prompt_action: string | null
          public_health_risks: string | null
          report_id: string | null
          response_actions: string | null
          rift_valley_deaths: number | null
          supplies_logistics: string | null
          total_deaths: number | null
          western_deaths: number | null
        }
        Insert: {
          central_deaths?: number | null
          challenges?: string | null
          coast_deaths?: number | null
          counties_affected?: number | null
          eastern_deaths?: number | null
          epidemiological_risks?: string | null
          health_facility_status?: string | null
          id?: string
          imst_activated?: boolean | null
          missing_persons?: number | null
          nairobi_deaths?: number | null
          north_eastern_deaths?: number
          northeastern_deaths?: number | null
          nyanza_deaths?: number | null
          prompt_action?: string | null
          public_health_risks?: string | null
          report_id?: string | null
          response_actions?: string | null
          rift_valley_deaths?: number | null
          supplies_logistics?: string | null
          total_deaths?: number | null
          western_deaths?: number | null
        }
        Update: {
          central_deaths?: number | null
          challenges?: string | null
          coast_deaths?: number | null
          counties_affected?: number | null
          eastern_deaths?: number | null
          epidemiological_risks?: string | null
          health_facility_status?: string | null
          id?: string
          imst_activated?: boolean | null
          missing_persons?: number | null
          nairobi_deaths?: number | null
          north_eastern_deaths?: number
          northeastern_deaths?: number | null
          nyanza_deaths?: number | null
          prompt_action?: string | null
          public_health_risks?: string | null
          report_id?: string | null
          response_actions?: string | null
          rift_valley_deaths?: number | null
          supplies_logistics?: string | null
          total_deaths?: number | null
          western_deaths?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "floods_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      idsr_counties: {
        Row: {
          below_threshold: boolean | null
          completeness_pct: number | null
          consecutive_weeks_below: number | null
          county_name: string
          id: string
          report_id: string | null
          timeliness_pct: number | null
        }
        Insert: {
          below_threshold?: boolean | null
          completeness_pct?: number | null
          consecutive_weeks_below?: number | null
          county_name: string
          id?: string
          report_id?: string | null
          timeliness_pct?: number | null
        }
        Update: {
          below_threshold?: boolean | null
          completeness_pct?: number | null
          consecutive_weeks_below?: number | null
          county_name?: string
          id?: string
          report_id?: string | null
          timeliness_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "idsr_counties_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      idsr_data: {
        Row: {
          cebs_community_signals: number | null
          cebs_hospital_signals: number | null
          completeness_pct: number | null
          dashboard_views: number | null
          id: string
          lowest_performing_week: number | null
          report_id: string | null
          timeliness_pct: number | null
        }
        Insert: {
          cebs_community_signals?: number | null
          cebs_hospital_signals?: number | null
          completeness_pct?: number | null
          dashboard_views?: number | null
          id?: string
          lowest_performing_week?: number | null
          report_id?: string | null
          timeliness_pct?: number | null
        }
        Update: {
          cebs_community_signals?: number | null
          cebs_hospital_signals?: number | null
          completeness_pct?: number | null
          dashboard_views?: number | null
          id?: string
          lowest_performing_week?: number | null
          report_id?: string | null
          timeliness_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "idsr_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      measles_counties: {
        Row: {
          case_count: number | null
          county_name: string
          id: string
          report_id: string | null
          sub_county: string | null
        }
        Insert: {
          case_count?: number | null
          county_name: string
          id?: string
          report_id?: string | null
          sub_county?: string | null
        }
        Update: {
          case_count?: number | null
          county_name?: string
          id?: string
          report_id?: string | null
          sub_county?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measles_counties_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      measles_data: {
        Row: {
          challenges: string | null
          clinical_notes: string | null
          confirmed: number | null
          counties_affected: number | null
          epidemiological_summary: string | null
          id: string
          laboratory_status: string | null
          report_id: string | null
          response_activities: string | null
          strategic_updates: string | null
          suspected: number | null
          total_cases: number | null
        }
        Insert: {
          challenges?: string | null
          clinical_notes?: string | null
          confirmed?: number | null
          counties_affected?: number | null
          epidemiological_summary?: string | null
          id?: string
          laboratory_status?: string | null
          report_id?: string | null
          response_activities?: string | null
          strategic_updates?: string | null
          suspected?: number | null
          total_cases?: number | null
        }
        Update: {
          challenges?: string | null
          clinical_notes?: string | null
          confirmed?: number | null
          counties_affected?: number | null
          epidemiological_summary?: string | null
          id?: string
          laboratory_status?: string | null
          report_id?: string | null
          response_activities?: string | null
          strategic_updates?: string | null
          suspected?: number | null
          total_cases?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measles_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      mpox_counties: {
        Row: {
          cases_2026: number | null
          county_name: string
          id: string
          is_hotspot: boolean | null
          report_id: string | null
        }
        Insert: {
          cases_2026?: number | null
          county_name: string
          id?: string
          is_hotspot?: boolean | null
          report_id?: string | null
        }
        Update: {
          cases_2026?: number | null
          county_name?: string
          id?: string
          is_hotspot?: boolean | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpox_counties_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      mpox_data: {
        Row: {
          active_facility: number | null
          active_home: number | null
          cfr: number | null
          challenges: string | null
          contacts_completed: number | null
          contacts_follow_up: number | null
          contacts_listed: number | null
          counties_affected: number | null
          cumulative_cases: number | null
          deaths: number | null
          genomic_subclade: string | null
          hiv_co_infection_deaths: number | null
          id: string
          new_cases_this_week: number | null
          recovered: number | null
          report_id: string | null
          response_activities: string | null
          traveller_screenings: number | null
          vaccinations: number | null
        }
        Insert: {
          active_facility?: number | null
          active_home?: number | null
          cfr?: number | null
          challenges?: string | null
          contacts_completed?: number | null
          contacts_follow_up?: number | null
          contacts_listed?: number | null
          counties_affected?: number | null
          cumulative_cases?: number | null
          deaths?: number | null
          genomic_subclade?: string | null
          hiv_co_infection_deaths?: number | null
          id?: string
          new_cases_this_week?: number | null
          recovered?: number | null
          report_id?: string | null
          response_activities?: string | null
          traveller_screenings?: number | null
          vaccinations?: number | null
        }
        Update: {
          active_facility?: number | null
          active_home?: number | null
          cfr?: number | null
          challenges?: string | null
          contacts_completed?: number | null
          contacts_follow_up?: number | null
          contacts_listed?: number | null
          counties_affected?: number | null
          cumulative_cases?: number | null
          deaths?: number | null
          genomic_subclade?: string | null
          hiv_co_infection_deaths?: number | null
          id?: string
          new_cases_this_week?: number | null
          recovered?: number | null
          report_id?: string | null
          response_activities?: string | null
          traveller_screenings?: number | null
          vaccinations?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mpox_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      mpox_demographics: {
        Row: {
          age_group: string | null
          case_count: number | null
          id: string
          occupation: string | null
          report_id: string | null
          sex: string | null
        }
        Insert: {
          age_group?: string | null
          case_count?: number | null
          id?: string
          occupation?: string | null
          report_id?: string | null
          sex?: string | null
        }
        Update: {
          age_group?: string | null
          case_count?: number | null
          id?: string
          occupation?: string | null
          report_id?: string | null
          sex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpox_demographics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_counties: {
        Row: {
          county_name: string
          id: string
          ipc_phase: number | null
          population_affected: number | null
          projected_phase: number | null
          report_id: string | null
        }
        Insert: {
          county_name: string
          id?: string
          ipc_phase?: number | null
          population_affected?: number | null
          projected_phase?: number | null
          report_id?: string | null
        }
        Update: {
          county_name?: string
          id?: string
          ipc_phase?: number | null
          population_affected?: number | null
          projected_phase?: number | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_counties_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_data: {
        Row: {
          contributing_factors: string | null
          id: string
          ipc_notes: string | null
          key_drivers: string | null
          phase3_above: number | null
          phase4_5: number | null
          report_id: string | null
        }
        Insert: {
          contributing_factors?: string | null
          id?: string
          ipc_notes?: string | null
          key_drivers?: string | null
          phase3_above?: number | null
          phase4_5?: number | null
          report_id?: string | null
        }
        Update: {
          contributing_factors?: string | null
          id?: string
          ipc_notes?: string | null
          key_drivers?: string | null
          phase3_above?: number | null
          phase4_5?: number | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          field_key: string
          id: string
          page_key: string
          section_key: string
          updated_at: string
          updated_by: string | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          field_key: string
          id?: string
          page_key: string
          section_key: string
          updated_at?: string
          updated_by?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          field_key?: string
          id?: string
          page_key?: string
          section_key?: string
          updated_at?: string
          updated_by?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assigned_counties: string[] | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          staff_id: string | null
          station: string | null
        }
        Insert: {
          assigned_counties?: string[] | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          staff_id?: string | null
          station?: string | null
        }
        Update: {
          assigned_counties?: string[] | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          staff_id?: string | null
          station?: string | null
        }
        Relationships: []
      }
      report_extraction_evidence: {
        Row: {
          confidence: number
          created_at: string
          field_path: string
          id: string
          numeric_value: number | null
          report_id: string
          slide_number: number | null
          source_snippet: string
          source_type: string
          value_text: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          field_path: string
          id?: string
          numeric_value?: number | null
          report_id: string
          slide_number?: number | null
          source_snippet: string
          source_type?: string
          value_text: string
        }
        Update: {
          confidence?: number
          created_at?: string
          field_path?: string
          id?: string
          numeric_value?: number | null
          report_id?: string
          slide_number?: number | null
          source_snippet?: string
          source_type?: string
          value_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_extraction_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_summary: {
        Row: {
          grade_1: number | null
          grade_2: number | null
          grade_3: number | null
          humanitarian_crises: number | null
          id: string
          new_events: number | null
          ongoing_events: number | null
          outbreaks: number | null
          protracted: number | null
          report_id: string | null
          ungraded: number | null
        }
        Insert: {
          grade_1?: number | null
          grade_2?: number | null
          grade_3?: number | null
          humanitarian_crises?: number | null
          id?: string
          new_events?: number | null
          ongoing_events?: number | null
          outbreaks?: number | null
          protracted?: number | null
          report_id?: string | null
          ungraded?: number | null
        }
        Update: {
          grade_1?: number | null
          grade_2?: number | null
          grade_3?: number | null
          humanitarian_crises?: number | null
          id?: string
          new_events?: number | null
          ongoing_events?: number | null
          outbreaks?: number | null
          protracted?: number | null
          report_id?: string | null
          ungraded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_summary_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_visuals: {
        Row: {
          created_at: string
          data: Json
          disease: string
          id: string
          metadata: Json
          narrative: string | null
          report_id: string
          section_key: string
          title: string
          visual_type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          disease: string
          id?: string
          metadata?: Json
          narrative?: string | null
          report_id: string
          section_key: string
          title: string
          visual_type: string
        }
        Update: {
          created_at?: string
          data?: Json
          disease?: string
          id?: string
          metadata?: Json
          narrative?: string | null
          report_id?: string
          section_key?: string
          title?: string
          visual_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_visuals_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
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
      weather_data: {
        Row: {
          id: string
          max_temp_c: number | null
          min_temp_c: number | null
          rainfall_cessation: string | null
          rainfall_onset: string | null
          region: string | null
          report_id: string | null
        }
        Insert: {
          id?: string
          max_temp_c?: number | null
          min_temp_c?: number | null
          rainfall_cessation?: string | null
          rainfall_onset?: string | null
          region?: string | null
          report_id?: string | null
        }
        Update: {
          id?: string
          max_temp_c?: number | null
          min_temp_c?: number | null
          rainfall_cessation?: string | null
          rainfall_onset?: string | null
          region?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_data_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          created_at: string | null
          id: string
          pptx_file_path: string | null
          published: boolean | null
          reporting_date: string
          source_sha256: string | null
          source_storage_path: string | null
          uploaded_by: string | null
          week_number: number
          xlsx_file_path: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pptx_file_path?: string | null
          published?: boolean | null
          reporting_date: string
          source_sha256?: string | null
          source_storage_path?: string | null
          uploaded_by?: string | null
          week_number: number
          xlsx_file_path?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pptx_file_path?: string | null
          published?: boolean | null
          reporting_date?: string
          source_sha256?: string | null
          source_storage_path?: string | null
          uploaded_by?: string | null
          week_number?: number
          xlsx_file_path?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_report: { Args: { _report_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      publish_reviewed_report: {
        Args: { _caller_id: string; _report_id: string; _storage_path: string }
        Returns: undefined
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
