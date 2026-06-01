import { supabase } from '../lib/supabase'
import type { Lead, LeadStatus } from '../types'

export const leadsService = {
  async getAll(filters?: { ejecutivo_id?: string; servicio?: string; origen?: string; search?: string }) {
    let query = supabase
      .from('leads')
      .select('*, ejecutivo:profiles!leads_ejecutivo_id_fkey(id,nombre,apellido,email), contact:contacts(*)')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (filters?.ejecutivo_id) query = query.eq('ejecutivo_id', filters.ejecutivo_id)
    if (filters?.servicio) query = query.eq('servicio', filters.servicio)
    if (filters?.origen) query = query.eq('origen', filters.origen)
    if (filters?.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,empresa.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Lead[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*, ejecutivo:profiles!leads_ejecutivo_id_fkey(*), contact:contacts(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Lead
  },

  async create(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'ejecutivo' | 'contact'>) {
    const { data, error } = await supabase.from('leads').insert(lead).select().single()
    if (error) throw error
    return data as Lead
  },

  async update(id: string, lead: Partial<Lead>) {
    const { data, error } = await supabase.from('leads').update({ ...lead, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Lead
  },

  async updateStatus(id: string, estado: LeadStatus, motivo_perdida?: string) {
    const updates: Record<string, unknown> = { estado, updated_at: new Date().toISOString() }
    if (motivo_perdida) updates.motivo_perdida = motivo_perdida
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data as Lead
  },

  async delete(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error
  },

  async getStats() {
    const { data, error } = await supabase.from('leads').select('estado, origen, servicio, valor_estimado, ejecutivo_id, created_at')
    if (error) throw error
    return data
  },
}
