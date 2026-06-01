import { supabase } from '../lib/supabase'
import type { Activity } from '../types'

export const activitiesService = {
  async getByLead(lead_id: string) {
    const { data, error } = await supabase
      .from('activities')
      .select('*, usuario:profiles!activities_usuario_id_fkey(id,nombre,apellido)')
      .eq('lead_id', lead_id)
      .order('fecha', { ascending: false })
    if (error) throw error
    return data as Activity[]
  },

  async create(activity: Omit<Activity, 'id' | 'created_at' | 'usuario'>) {
    const { data, error } = await supabase.from('activities').insert(activity).select().single()
    if (error) throw error
    return data as Activity
  },

  async markComplete(id: string) {
    const { data, error } = await supabase.from('activities').update({ completado: true }).eq('id', id).select().single()
    if (error) throw error
    return data as Activity
  },

  async delete(id: string) {
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) throw error
  },

  async getPendingTasks(usuario_id: string) {
    const { data, error } = await supabase
      .from('activities')
      .select('*, lead:leads(id,nombre,empresa)')
      .eq('usuario_id', usuario_id)
      .eq('tipo', 'tarea')
      .eq('completado', false)
      .order('fecha_vencimiento', { ascending: true })
    if (error) throw error
    return data
  },
}
