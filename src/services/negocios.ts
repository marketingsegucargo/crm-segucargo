import { supabase } from '../lib/supabase'

export interface Negocio {
  id: string
  nombre: string
  empresa: string | null
  valor: number | null
  moneda: 'USD' | 'CLP' | 'EUR' | null
  etapa: string | null
  probabilidad: number | null
  fecha_cierre_estimada: string | null
  ejecutivo_id: string | null
  servicio: string | null
  tipo_servicio: string | null
  origen: string | null
  contacto_nombre: string | null
  pipeline: string | null
  notas: string | null
  created_at: string
  updated_at?: string
  // join
  profiles?: { nombre: string; apellido: string | null } | null
}

export type NegocioInsert = Omit<Negocio, 'id' | 'created_at' | 'updated_at' | 'profiles'>
export type NegocioUpdate = Partial<NegocioInsert>

export const negociosService = {
  async getAll(): Promise<Negocio[]> {
    const { data, error } = await supabase
      .from('negocios')
      .select('*, profiles!ejecutivo_id(nombre, apellido)')
      .order('created_at', { ascending: false })
      .limit(10000)
    if (error) throw error
    return (data || []) as Negocio[]
  },

  async create(payload: NegocioInsert): Promise<Negocio> {
    const { data, error } = await supabase
      .from('negocios')
      .insert(payload)
      .select('*, profiles!ejecutivo_id(nombre, apellido)')
      .single()
    if (error) throw error
    return data as Negocio
  },

  async update(id: string, payload: NegocioUpdate): Promise<Negocio> {
    const { data, error } = await supabase
      .from('negocios')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, profiles!ejecutivo_id(nombre, apellido)')
      .single()
    if (error) throw error
    return data as Negocio
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('negocios').delete().eq('id', id)
    if (error) throw error
  },
}
