import { supabase } from '../lib/supabase'
import type { Quote } from '../types'

export const quotesService = {
  async getAll(lead_id?: string) {
    let query = supabase
      .from('quotes')
      .select('*, lead:leads(id,nombre,empresa), ejecutivo:profiles!quotes_ejecutivo_id_fkey(id,nombre,apellido)')
      .order('created_at', { ascending: false })
    if (lead_id) query = query.eq('lead_id', lead_id)
    const { data, error } = await query
    if (error) throw error
    return data as Quote[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, lead:leads(*), ejecutivo:profiles!quotes_ejecutivo_id_fkey(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Quote
  },

  async create(quote: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'lead' | 'ejecutivo'>) {
    const { data, error } = await supabase.from('quotes').insert(quote).select().single()
    if (error) throw error
    return data as Quote
  },

  async update(id: string, quote: Partial<Quote>) {
    const { data, error } = await supabase.from('quotes').update({ ...quote, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Quote
  },

  async delete(id: string) {
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) throw error
  },

  async getNextNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true })
    return `COT-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`
  },
}
