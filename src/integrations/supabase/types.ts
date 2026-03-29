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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_metrics: {
        Row: {
          chunks_selected_count: number | null
          citations_count: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          latency_ms: number | null
          metadata_json: Json | null
          model_name: string | null
          normalized_query: string | null
          prompt_tokens_estimate: number | null
          query_text: string | null
          rag_confidence_score: number | null
          request_id: string | null
          response_status: string | null
          response_text: string | null
          response_tokens_estimate: number | null
          search_metric_id: string | null
          search_result_count: number | null
          used_external_web: boolean | null
          used_model_general_knowledge: boolean | null
          used_rag: boolean | null
        }
        Insert: {
          chunks_selected_count?: number | null
          citations_count?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          metadata_json?: Json | null
          model_name?: string | null
          normalized_query?: string | null
          prompt_tokens_estimate?: number | null
          query_text?: string | null
          rag_confidence_score?: number | null
          request_id?: string | null
          response_status?: string | null
          response_text?: string | null
          response_tokens_estimate?: number | null
          search_metric_id?: string | null
          search_result_count?: number | null
          used_external_web?: boolean | null
          used_model_general_knowledge?: boolean | null
          used_rag?: boolean | null
        }
        Update: {
          chunks_selected_count?: number | null
          citations_count?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          metadata_json?: Json | null
          model_name?: string | null
          normalized_query?: string | null
          prompt_tokens_estimate?: number | null
          query_text?: string | null
          rag_confidence_score?: number | null
          request_id?: string | null
          response_status?: string | null
          response_text?: string | null
          response_tokens_estimate?: number | null
          search_metric_id?: string | null
          search_result_count?: number | null
          used_external_web?: boolean | null
          used_model_general_knowledge?: boolean | null
          used_rag?: boolean | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          char_count: number | null
          chunk_index: number
          chunk_metadata_json: Json
          content: string
          created_at: string
          document_id: string
          embedded_at: string | null
          embedding: string | null
          embedding_dim: number | null
          embedding_model: string | null
          id: string
          is_active: boolean
          keyword_tsv: unknown
          keyword_weight: number
          page_end: number | null
          page_start: number | null
          section_title: string | null
          semantic_weight: number
          text_hash: string | null
          token_count_estimate: number | null
          updated_at: string
        }
        Insert: {
          char_count?: number | null
          chunk_index?: number
          chunk_metadata_json?: Json
          content: string
          created_at?: string
          document_id: string
          embedded_at?: string | null
          embedding?: string | null
          embedding_dim?: number | null
          embedding_model?: string | null
          id?: string
          is_active?: boolean
          keyword_tsv?: unknown
          keyword_weight?: number
          page_end?: number | null
          page_start?: number | null
          section_title?: string | null
          semantic_weight?: number
          text_hash?: string | null
          token_count_estimate?: number | null
          updated_at?: string
        }
        Update: {
          char_count?: number | null
          chunk_index?: number
          chunk_metadata_json?: Json
          content?: string
          created_at?: string
          document_id?: string
          embedded_at?: string | null
          embedding?: string | null
          embedding_dim?: number | null
          embedding_model?: string | null
          id?: string
          is_active?: boolean
          keyword_tsv?: unknown
          keyword_weight?: number
          page_end?: number | null
          page_start?: number | null
          section_title?: string | null
          semantic_weight?: number
          text_hash?: string | null
          token_count_estimate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_processing_events: {
        Row: {
          created_at: string
          details_json: Json | null
          document_id: string | null
          event_level: string
          event_type: string
          id: string
          ingestion_job_id: string | null
          message: string
        }
        Insert: {
          created_at?: string
          details_json?: Json | null
          document_id?: string | null
          event_level?: string
          event_type: string
          id?: string
          ingestion_job_id?: string | null
          message?: string
        }
        Update: {
          created_at?: string
          details_json?: Json | null
          document_id?: string | null
          event_level?: string
          event_type?: string
          id?: string
          ingestion_job_id?: string | null
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_processing_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_processing_events_ingestion_job_id_fkey"
            columns: ["ingestion_job_id"]
            isOneToOne: false
            referencedRelation: "ingestion_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_hash: string | null
          failed_at: string | null
          failure_reason: string | null
          file_name: string | null
          file_path: string
          id: string
          is_active: boolean
          jurisdiction_scope: string | null
          language_code: string | null
          last_reviewed_at: string | null
          metadata_json: Json
          mime_type: string | null
          name: string
          page_count: number | null
          processed_at: string | null
          published_at: string | null
          source_name: string | null
          source_type: string | null
          source_url: string | null
          status: string
          storage_path: string | null
          summary: string | null
          text_char_count: number | null
          topic_scope: string | null
          updated_at: string
          version_label: string | null
        }
        Insert: {
          created_at?: string
          document_hash?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          is_active?: boolean
          jurisdiction_scope?: string | null
          language_code?: string | null
          last_reviewed_at?: string | null
          metadata_json?: Json
          mime_type?: string | null
          name: string
          page_count?: number | null
          processed_at?: string | null
          published_at?: string | null
          source_name?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string
          storage_path?: string | null
          summary?: string | null
          text_char_count?: number | null
          topic_scope?: string | null
          updated_at?: string
          version_label?: string | null
        }
        Update: {
          created_at?: string
          document_hash?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          is_active?: boolean
          jurisdiction_scope?: string | null
          language_code?: string | null
          last_reviewed_at?: string | null
          metadata_json?: Json
          mime_type?: string | null
          name?: string
          page_count?: number | null
          processed_at?: string | null
          published_at?: string | null
          source_name?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string
          storage_path?: string | null
          summary?: string | null
          text_char_count?: number | null
          topic_scope?: string | null
          updated_at?: string
          version_label?: string | null
        }
        Relationships: []
      }
      ingestion_jobs: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          document_id: string | null
          error_code: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          job_type: string
          payload_json: Json | null
          result_json: Json | null
          started_at: string | null
          status: string
          trigger_source: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          document_id?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          job_type?: string
          payload_json?: Json | null
          result_json?: Json | null
          started_at?: string | null
          status?: string
          trigger_source?: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          document_id?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          job_type?: string
          payload_json?: Json | null
          result_json?: Json | null
          started_at?: string | null
          status?: string
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      query_analytics: {
        Row: {
          chat_metric_id: string | null
          created_at: string
          gap_reason: string | null
          id: string
          intent_label: string | null
          is_answered_satisfactorily: boolean | null
          needs_content_gap_review: boolean | null
          normalized_query: string | null
          query_text: string | null
          request_id: string | null
          subtopic_label: string | null
          topic_label: string | null
          used_external_web: boolean | null
          used_rag: boolean | null
        }
        Insert: {
          chat_metric_id?: string | null
          created_at?: string
          gap_reason?: string | null
          id?: string
          intent_label?: string | null
          is_answered_satisfactorily?: boolean | null
          needs_content_gap_review?: boolean | null
          normalized_query?: string | null
          query_text?: string | null
          request_id?: string | null
          subtopic_label?: string | null
          topic_label?: string | null
          used_external_web?: boolean | null
          used_rag?: boolean | null
        }
        Update: {
          chat_metric_id?: string | null
          created_at?: string
          gap_reason?: string | null
          id?: string
          intent_label?: string | null
          is_answered_satisfactorily?: boolean | null
          needs_content_gap_review?: boolean | null
          normalized_query?: string | null
          query_text?: string | null
          request_id?: string | null
          subtopic_label?: string | null
          topic_label?: string | null
          used_external_web?: boolean | null
          used_rag?: boolean | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      search_metrics: {
        Row: {
          avg_score: number | null
          created_at: string
          id: string
          keyword_query_text: string | null
          merged_hits_count: number | null
          normalized_query: string | null
          query_embedding_model: string | null
          query_text: string | null
          request_id: string | null
          search_latency_ms: number | null
          search_mode: string | null
          selected_chunk_ids: string[] | null
          selected_document_ids: string[] | null
          selected_sources: string[] | null
          top_score: number | null
        }
        Insert: {
          avg_score?: number | null
          created_at?: string
          id?: string
          keyword_query_text?: string | null
          merged_hits_count?: number | null
          normalized_query?: string | null
          query_embedding_model?: string | null
          query_text?: string | null
          request_id?: string | null
          search_latency_ms?: number | null
          search_mode?: string | null
          selected_chunk_ids?: string[] | null
          selected_document_ids?: string[] | null
          selected_sources?: string[] | null
          top_score?: number | null
        }
        Update: {
          avg_score?: number | null
          created_at?: string
          id?: string
          keyword_query_text?: string | null
          merged_hits_count?: number | null
          normalized_query?: string | null
          query_embedding_model?: string | null
          query_text?: string | null
          request_id?: string | null
          search_latency_ms?: number | null
          search_mode?: string | null
          selected_chunk_ids?: string[] | null
          selected_document_ids?: string[] | null
          selected_sources?: string[] | null
          top_score?: number | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      hybrid_search_chunks: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
        }
        Returns: {
          content: string
          document_authority_level: string
          document_id: string
          document_kind: string
          document_name: string
          document_search_weight: number
          document_source_name: string
          document_source_type: string
          document_topic_scope: string
          id: string
          page_end: number
          page_start: number
          section_title: string
          similarity: number
        }[]
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
    Enums: {},
  },
} as const
