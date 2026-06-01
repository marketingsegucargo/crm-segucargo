import { supabase } from '../lib/supabase'
import type { Contact } from '../types'

export const contactsService = {
  async getAll(search?: string) {
    let query = supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(20000)
    if (search) query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,empresa.ilike.%${search}%,email.ilike.%${search}%`)
    const { data, error } = await query
    if (error) throw error
    return data as Contact[]
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single()
    if (error) throw error
    return data as Contact
  },

  async create(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('contacts').insert(contact).select().single()
    if (error) throw error
    return data as Contact
  },

  async update(id: string, contact: Partial<Contact>) {
    const { data, error } = await supabase.from('contacts').update({ ...contact, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Contact
  },

  async delete(id: string) {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) throw error
  },
}
