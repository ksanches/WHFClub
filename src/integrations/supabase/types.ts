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
      coupons: {
        Row: {
          active: boolean
          auto_confirm: boolean
          card_url_dupla: string | null
          card_url_individual: string | null
          code: string
          created_at: string
          description: string | null
          dupla_price_cents: number | null
          id: string
          individual_price_cents: number | null
          pix_qr_dupla_url: string | null
          pix_qr_individual_url: string | null
          updated_at: string
          valid_for: string
        }
        Insert: {
          active?: boolean
          auto_confirm?: boolean
          card_url_dupla?: string | null
          card_url_individual?: string | null
          code: string
          created_at?: string
          description?: string | null
          dupla_price_cents?: number | null
          id?: string
          individual_price_cents?: number | null
          pix_qr_dupla_url?: string | null
          pix_qr_individual_url?: string | null
          updated_at?: string
          valid_for?: string
        }
        Update: {
          active?: boolean
          auto_confirm?: boolean
          card_url_dupla?: string | null
          card_url_individual?: string | null
          code?: string
          created_at?: string
          description?: string | null
          dupla_price_cents?: number | null
          id?: string
          individual_price_cents?: number | null
          pix_qr_dupla_url?: string | null
          pix_qr_individual_url?: string | null
          updated_at?: string
          valid_for?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          active: boolean
          created_at: string
          date_label: string
          description: string | null
          hero_location_line: string | null
          hero_quote: string | null
          hero_subtitle: string | null
          hero_title: string
          id: string
          lots_intro: string | null
          lots_note: string | null
          manifesto: string | null
          maps_url: string | null
          name: string
          pix_beneficiary: string | null
          pix_copy_paste: string | null
          pix_key: string | null
          time_label: string | null
          updated_at: string
          venue_name: string | null
          venue_sub: string | null
          whatsapp_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          date_label: string
          description?: string | null
          hero_location_line?: string | null
          hero_quote?: string | null
          hero_subtitle?: string | null
          hero_title: string
          id?: string
          lots_intro?: string | null
          lots_note?: string | null
          manifesto?: string | null
          maps_url?: string | null
          name: string
          pix_beneficiary?: string | null
          pix_copy_paste?: string | null
          pix_key?: string | null
          time_label?: string | null
          updated_at?: string
          venue_name?: string | null
          venue_sub?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          date_label?: string
          description?: string | null
          hero_location_line?: string | null
          hero_quote?: string | null
          hero_subtitle?: string | null
          hero_title?: string
          id?: string
          lots_intro?: string | null
          lots_note?: string | null
          manifesto?: string | null
          maps_url?: string | null
          name?: string
          pix_beneficiary?: string | null
          pix_copy_paste?: string | null
          pix_key?: string | null
          time_label?: string | null
          updated_at?: string
          venue_name?: string | null
          venue_sub?: string | null
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      lots: {
        Row: {
          active: boolean
          capacity: number
          card_url_dupla: string | null
          card_url_individual: string | null
          created_at: string
          dupla_price_cents: number
          id: string
          individual_price_cents: number
          label: string
          pix_qr_dupla_url: string | null
          pix_qr_individual_url: string | null
          sort_order: number
          total: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          card_url_dupla?: string | null
          card_url_individual?: string | null
          created_at?: string
          dupla_price_cents: number
          id: string
          individual_price_cents: number
          label: string
          pix_qr_dupla_url?: string | null
          pix_qr_individual_url?: string | null
          sort_order?: number
          total: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number
          card_url_dupla?: string | null
          card_url_individual?: string | null
          created_at?: string
          dupla_price_cents?: number
          id?: string
          individual_price_cents?: number
          label?: string
          pix_qr_dupla_url?: string | null
          pix_qr_individual_url?: string | null
          sort_order?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          accept_messages: boolean
          address: string | null
          class_time: string | null
          cpf: string
          created_at: string
          email: string
          event_suggestions: string | null
          full_name: string
          id: string
          parq_notes: string | null
          parq_q1: boolean | null
          parq_q2: boolean | null
          parq_q3: boolean | null
          parq_q4: boolean | null
          parq_q5: boolean | null
          parq_q6: boolean | null
          parq_q7: boolean | null
          partner_cpf: string | null
          partner_email: string | null
          partner_full_name: string | null
          partner_parq_notes: string | null
          partner_parq_q1: boolean | null
          partner_parq_q2: boolean | null
          partner_parq_q3: boolean | null
          partner_parq_q4: boolean | null
          partner_parq_q5: boolean | null
          partner_parq_q6: boolean | null
          partner_parq_q7: boolean | null
          partner_phone: string | null
          payment_method: string | null
          payment_url: string | null
          phone: string
          status: Database["public"]["Enums"]["registration_status"]
          ticket_batch: string
          ticket_price_cents: number
          ticket_type: string
        }
        Insert: {
          accept_messages?: boolean
          address?: string | null
          class_time?: string | null
          cpf: string
          created_at?: string
          email: string
          event_suggestions?: string | null
          full_name: string
          id?: string
          parq_notes?: string | null
          parq_q1?: boolean | null
          parq_q2?: boolean | null
          parq_q3?: boolean | null
          parq_q4?: boolean | null
          parq_q5?: boolean | null
          parq_q6?: boolean | null
          parq_q7?: boolean | null
          partner_cpf?: string | null
          partner_email?: string | null
          partner_full_name?: string | null
          partner_parq_notes?: string | null
          partner_parq_q1?: boolean | null
          partner_parq_q2?: boolean | null
          partner_parq_q3?: boolean | null
          partner_parq_q4?: boolean | null
          partner_parq_q5?: boolean | null
          partner_parq_q6?: boolean | null
          partner_parq_q7?: boolean | null
          partner_phone?: string | null
          payment_method?: string | null
          payment_url?: string | null
          phone: string
          status?: Database["public"]["Enums"]["registration_status"]
          ticket_batch: string
          ticket_price_cents: number
          ticket_type: string
        }
        Update: {
          accept_messages?: boolean
          address?: string | null
          class_time?: string | null
          cpf?: string
          created_at?: string
          email?: string
          event_suggestions?: string | null
          full_name?: string
          id?: string
          parq_notes?: string | null
          parq_q1?: boolean | null
          parq_q2?: boolean | null
          parq_q3?: boolean | null
          parq_q4?: boolean | null
          parq_q5?: boolean | null
          parq_q6?: boolean | null
          parq_q7?: boolean | null
          partner_cpf?: string | null
          partner_email?: string | null
          partner_full_name?: string | null
          partner_parq_notes?: string | null
          partner_parq_q1?: boolean | null
          partner_parq_q2?: boolean | null
          partner_parq_q3?: boolean | null
          partner_parq_q4?: boolean | null
          partner_parq_q5?: boolean | null
          partner_parq_q6?: boolean | null
          partner_parq_q7?: boolean | null
          partner_phone?: string | null
          payment_method?: string | null
          payment_url?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["registration_status"]
          ticket_batch?: string
          ticket_price_cents?: number
          ticket_type?: string
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
      waitlist: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      force_rotate_lot_on_schedule: { Args: never; Returns: undefined }
      get_class_occupancy: {
        Args: never
        Returns: {
          class_time: string
          participants: number
        }[]
      }
      get_event_capacity: { Args: never; Returns: number }
      get_registration_count: { Args: never; Returns: number }
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
      registration_status:
        | "pendente"
        | "confirmado"
        | "cancelado"
        | "reembolsado"
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
      registration_status: [
        "pendente",
        "confirmado",
        "cancelado",
        "reembolsado",
      ],
    },
  },
} as const
