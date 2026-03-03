import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      dossiers: {
        Row: {
          id: string
          nom: string
          endroit: string | null
          telephone: string | null
          date_finale: string | null
          montant: number
          acte: boolean
          regul: boolean
          agricole: boolean
          depot_cad: string | null
          depot_domain: string | null
          etat: string
          observations: string | null
          archived: boolean
          in_trash: boolean
          date_archive: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['dossiers']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['dossiers']['Insert']>
      }
    }
  }
}
