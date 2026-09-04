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
      process_logs: {
        Row: {
          created_at: string
          details: Json
          id: string
          message: string
          product_id: string
          stage: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          message: string
          product_id: string
          stage: string
          status: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          message?: string
          product_id?: string
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          kind: string
          position: number
          product_id: string
          source_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          kind?: string
          position: number
          product_id: string
          source_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          kind?: string
          position?: number
          product_id?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          image_source_url: string | null
          option_values: Json
          position: number
          product_id: string
          selling_price: number | null
          sku: string | null
          source_price: number | null
          source_variant_identifier: string | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_source_url?: string | null
          option_values?: Json
          position: number
          product_id: string
          selling_price?: number | null
          sku?: string | null
          source_price?: number | null
          source_variant_identifier?: string | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_source_url?: string | null
          option_values?: Json
          position?: number
          product_id?: string
          selling_price?: number | null
          sku?: string | null
          source_price?: number | null
          source_variant_identifier?: string | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json
          brand: string | null
          canonical_source_url: string
          created_at: string
          currency_code: string
          description: string | null
          error_code: string | null
          error_message: string | null
          gtin: string | null
          height_cm: number | null
          id: string
          length_cm: number | null
          owner_id: string
          raw_source_data: Json
          selling_price: number | null
          sku: string | null
          source_category: string | null
          source_platform: string
          source_price: number | null
          source_product_identifier: string | null
          status: string
          stock: number | null
          title: string | null
          updated_at: string
          variant_axes: Json
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          attributes?: Json
          brand?: string | null
          canonical_source_url: string
          created_at?: string
          currency_code?: string
          description?: string | null
          error_code?: string | null
          error_message?: string | null
          gtin?: string | null
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          owner_id?: string
          raw_source_data?: Json
          selling_price?: number | null
          sku?: string | null
          source_category?: string | null
          source_platform?: string
          source_price?: number | null
          source_product_identifier?: string | null
          status?: string
          stock?: number | null
          title?: string | null
          updated_at?: string
          variant_axes?: Json
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          attributes?: Json
          brand?: string | null
          canonical_source_url?: string
          created_at?: string
          currency_code?: string
          description?: string | null
          error_code?: string | null
          error_message?: string | null
          gtin?: string | null
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          owner_id?: string
          raw_source_data?: Json
          selling_price?: number | null
          sku?: string | null
          source_category?: string | null
          source_platform?: string
          source_price?: number | null
          source_product_identifier?: string | null
          status?: string
          stock?: number | null
          title?: string | null
          updated_at?: string
          variant_axes?: Json
          weight_grams?: number | null
          width_cm?: number | null
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
