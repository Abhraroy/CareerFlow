export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      ai_usages: {
        Row: {
          api_key_id: string
          created_at: string
          feature: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          api_key_id: string
          created_at?: string
          feature: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          total_tokens?: number
          user_id: string
        }
        Update: {
          api_key_id?: string
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_usages_api_key_id_fkey'
            columns: ['api_key_id']
            isOneToOne: false
            referencedRelation: 'api_key_table'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ai_usages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      api_key_table: {
        Row: {
          created_at: string
          hashed_api_key: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashed_api_key?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashed_api_key?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'apikeytable_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      jobs: {
        Row: {
          company_description: string | null
          company_name: string | null
          created_at: string
          id: string
          job_description: string | null
          job_link: string | null
          job_title: string
          logo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string | null
          job_link?: string | null
          job_title: string
          logo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string | null
          job_link?: string | null
          job_title?: string
          logo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          name: string | null
          raw_resume_data: string | null
          structured_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          name?: string | null
          raw_resume_data?: string | null
          structured_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          name?: string | null
          raw_resume_data?: string | null
          structured_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'resumes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      scores: {
        Row: {
          created_at: string
          fit_score: number
          id: string
          job_id: string
          potential_score: number
          resume_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fit_score?: number
          id?: string
          job_id: string
          potential_score?: number
          resume_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fit_score?: number
          id?: string
          job_id?: string
          potential_score?: number
          resume_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scores_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scores_resume_id_fkey'
            columns: ['resume_id']
            isOneToOne: false
            referencedRelation: 'resumes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scores_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      tailored_resumes: {
        Row: {
          created_at: string
          fit_score: number
          id: string
          job_id: string
          name: string
          raw_tailored_resume_data: string | null
          resume_id: string
          structured_output: Json
          tailored_based_on: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fit_score?: number
          id?: string
          job_id: string
          name: string
          raw_tailored_resume_data?: string | null
          resume_id: string
          structured_output?: Json
          tailored_based_on?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fit_score?: number
          id?: string
          job_id?: string
          name?: string
          raw_tailored_resume_data?: string | null
          resume_id?: string
          structured_output?: Json
          tailored_based_on?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tailored_resumes_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tailored_resumes_resume_id_fkey'
            columns: ['resume_id']
            isOneToOne: false
            referencedRelation: 'resumes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tailored_resumes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      llm_analysis: {
        Row: {
          id: string
          user_id: string
          job_id: string
          resume_id: string | null
          tailor_resume_id: string | null
          requirements: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          resume_id?: string | null
          tailor_resume_id?: string | null
          requirements?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          resume_id?: string | null
          tailor_resume_id?: string | null
          requirements?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'llm_analysis_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'llm_analysis_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'llm_analysis_resume_id_fkey'
            columns: ['resume_id']
            isOneToOne: false
            referencedRelation: 'resumes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'llm_analysis_tailor_resume_id_fkey'
            columns: ['tailor_resume_id']
            isOneToOne: false
            referencedRelation: 'tailored_resumes'
            referencedColumns: ['id']
          }
        ]
      }
      requirement_interactions: {
        Row: {
          id: string
          llm_analysis_id: string
          user_id: string
          requirement_id: string
          requirement: string
          has_experience: boolean
          user_evidence: string | null
          question: string | null
          hint: string | null
          answer: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          llm_analysis_id: string
          user_id: string
          requirement_id: string
          requirement: string
          has_experience?: boolean
          user_evidence?: string | null
          question?: string | null
          hint?: string | null
          answer?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          llm_analysis_id?: string
          user_id?: string
          requirement_id?: string
          requirement?: string
          has_experience?: boolean
          user_evidence?: string | null
          question?: string | null
          hint?: string | null
          answer?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'requirement_interactions_llm_analysis_id_fkey'
            columns: ['llm_analysis_id']
            isOneToOne: false
            referencedRelation: 'llm_analysis'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'requirement_interactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      apitype: 'OPENAI' | 'GEMINI' | 'NVIDIA'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type UserRow = Tables<'users'>
export type UserInsert = TablesInsert<'users'>
export type UserUpdate = TablesUpdate<'users'>
