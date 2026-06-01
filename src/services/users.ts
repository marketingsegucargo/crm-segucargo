import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export const usersService = {
  async getAll() {
    const { data, error } = await supabase.from('profiles').select('*').order('nombre')
    if (error) throw error
    return data as Profile[]
  },

  async getExecutivos() {
    const { data, error } = await supabase.from('profiles').select('*').eq('rol', 'ejecutivo').eq('activo', true).order('nombre')
    if (error) throw error
    return data as Profile[]
  },

  async update(id: string, profile: Partial<Profile>) {
    const { data, error } = await supabase.from('profiles').update({ ...profile, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Profile
  },

  async createUser(email: string, password: string, profile: Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { nombre: profile.nombre, apellido: profile.apellido, rol: profile.rol },
    })
    if (error) throw error
    return data
  },
}
