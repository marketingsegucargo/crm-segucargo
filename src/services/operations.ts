import { supabase } from '../lib/supabase'
import type { Operation } from '../types'

export const operationsService = {
  async getAll(): Promise<Operation[]> {
    const { data, error } = await supabase
      .from('operations')
      .select('*, lead:leads(nombre, empresa), ejecutivo:profiles(nombre, apellido)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Operation[]
  },

  async getById(id: string): Promise<Operation | null> {
    const { data, error } = await supabase
      .from('operations')
      .select('*, lead:leads(nombre, empresa), ejecutivo:profiles(nombre, apellido)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Operation
  },

  async create(op: Omit<Operation, 'id' | 'created_at' | 'updated_at'>): Promise<Operation> {
    const { data, error } = await supabase.from('operations').insert(op).select().single()
    if (error) throw error
    return data as Operation
  },

  async update(id: string, updates: Partial<Operation>): Promise<Operation> {
    const { data, error } = await supabase
      .from('operations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Operation
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('operations').delete().eq('id', id)
    if (error) throw error
  },
}
