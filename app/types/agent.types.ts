// app/types/agent.types.ts
import type { Database } from './database.types'

// Tipo base de agente desde la tabla agents
export type AgentRow = Database['public']['Tables']['agents']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']

// Agente con datos del perfil
export interface Agent extends AgentRow {
    profile?: {
        id: string
        email: string
        full_name: string | null
        phone: string | null
        avatar_url: string | null
        is_active: boolean
    }
}

// Agente con estadísticas extendidas
export interface AgentWithDetails extends Agent {
    properties_count?: number
    active_contracts_count?: number
    pending_commissions?: number
}

// Estadísticas de agentes
export interface AgentStats {
    total: number
    verified: number
    totalSales: number
    totalRentals: number
}

// Filtros para listar agentes
export interface AgentFilters {
    search?: string
    verified?: boolean
    specialization?: string
    limit?: number
    offset?: number
}

// Especialidades disponibles
export const AGENT_SPECIALIZATIONS = {
    ventas: 'Ventas',
    alquileres: 'Alquileres',
    comercial: 'Comercial',
    residencial: 'Residencial',
    lujo: 'Propiedades de Lujo',
    inversiones: 'Inversiones'
} as const

// Estados de verificación
export const AGENT_VERIFICATION_STATUS = {
    verified: 'Verificado',
    pending: 'Pendiente'
} as const

export const AGENT_VERIFICATION_COLORS = {
    verified: 'success',
    pending: 'warning'
} as const

// Helper para obtener el estado de verificación
export function getAgentVerificationStatus(agent: Agent): keyof typeof AGENT_VERIFICATION_STATUS {
    return agent.is_verified ? 'verified' : 'pending'
}

// Helper para formatear rating
export function formatRating(rating: number): string {
    return rating.toFixed(1)
}

// Helper para formatear tasa de comisión
export function formatCommissionRate(rate: number): string {
    return `${rate}%`
}
