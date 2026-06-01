import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, User, DollarSign } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { leadsService } from '../services/leads'
import { PIPELINE_STAGES } from '../lib/constants'
import { formatCurrency, isOverdue } from '../lib/utils'
import type { Lead, LeadStatus } from '../types'

export default function Pipeline() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leadsService.getAll().then(data => { setLeads(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  function getLeadsByStage(stage: LeadStatus) {
    return leads.filter(l => l.estado === stage)
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const leadId = result.draggableId
    const newStatus = result.destination.droppableId as LeadStatus
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.estado === newStatus) return

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, estado: newStatus } : l))
    try {
      await leadsService.updateStatus(leadId, newStatus)
    } catch {
      // Revert
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, estado: lead.estado } : l))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipeline Comercial</h1>
        <p className="text-gray-500 text-sm mt-0.5">Arrastra los leads entre etapas para actualizar su estado</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = getLeadsByStage(stage.key)
            const stageValue = stageLeads.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)

            return (
              <div key={stage.key} className={`flex-shrink-0 w-72 rounded-xl border-2 ${stage.color} flex flex-col`}>
                {/* Stage header */}
                <div className="px-3 py-3 border-b border-current border-opacity-20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">{stage.label}</h3>
                    <span className="badge bg-white/70 text-gray-700 font-bold">{stageLeads.length}</span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(stageValue)}</p>
                  )}
                </div>

                {/* Cards */}
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 min-h-24 transition-colors ${snapshot.isDraggingOver ? 'bg-brand-50/50' : ''}`}
                    >
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/leads/${lead.id}`)}
                              className={`bg-white rounded-lg p-3 border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''} ${isOverdue(lead.fecha_proxima_accion) ? 'border-l-4 border-l-red-400' : 'border-gray-200'}`}
                            >
                              <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{lead.nombre}</p>
                              {lead.empresa && <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.empresa}</p>}

                              <div className="mt-2 space-y-1">
                                {lead.ejecutivo && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <User className="w-3 h-3" />
                                    <span>{lead.ejecutivo.nombre}</span>
                                  </div>
                                )}
                                {lead.valor_estimado && (
                                  <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                                    <DollarSign className="w-3 h-3" />
                                    <span>{formatCurrency(lead.valor_estimado)}</span>
                                  </div>
                                )}
                                {isOverdue(lead.fecha_proxima_accion) && (
                                  <div className="flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Acción vencida</span>
                                  </div>
                                )}
                              </div>

                              {lead.probabilidad !== undefined && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Prob.</span>
                                    <span>{lead.probabilidad}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                      className="bg-brand-600 h-1.5 rounded-full"
                                      style={{ width: `${lead.probabilidad}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
