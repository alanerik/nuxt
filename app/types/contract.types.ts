// app/types/contract.types.ts
import type { Database } from './database.types'

// Tipos base de la BD
export type ContractRow = Database['public']['Tables']['contracts']['Row']
export type ContractInsert = Database['public']['Tables']['contracts']['Insert']
export type ContractUpdate = Database['public']['Tables']['contracts']['Update']

// Enums
export type ContractStatus = 'pendiente' | 'activo' | 'vencido' | 'cancelado'

// Contract con relaciones
export interface Contract extends ContractRow {
    property?: {
        id: string
        title: string
        address: string
        city: string
        images: string[] | null
        operation_type: string
    } | null
    tenant?: {
        id: string
        full_name: string | null
        email: string
        phone: string | null
        dni: string | null
    } | null
    agent?: {
        id: string
        user_id: string
        profiles?: {
            full_name: string | null
            email: string
            phone: string | null
        } | null
    } | null
}

// Filtros
export interface ContractFilters {
    search?: string
    status?: ContractStatus | ContractStatus[]
    property_id?: string
    tenant_id?: string
    agent_id?: string
    from_date?: string
    to_date?: string
}

// Sort
export type ContractSortField = 'start_date' | 'end_date' | 'monthly_rent' | 'created_at'

export type SortDirection = 'asc' | 'desc'

export interface ContractSort {
    field: ContractSortField
    direction: SortDirection
}

// Paginación
export interface ContractPagination {
    page: number
    pageSize: number
    total?: number
}

// Labels
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
    pendiente: 'Pendiente',
    activo: 'Activo',
    vencido: 'Vencido',
    cancelado: 'Cancelado'
}

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
    pendiente: 'warning',
    activo: 'success',
    vencido: 'error',
    cancelado: 'neutral'
}

// Opciones para selects
export const CONTRACT_STATUS_OPTIONS = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'activo', label: 'Activo' },
    { value: 'vencido', label: 'Vencido' },
    { value: 'cancelado', label: 'Cancelado' }
] as const

export const ADJUSTMENT_INDEX_OPTIONS = [
    { value: 'ICL', label: 'ICL (Índice de Contratos de Locación)' },
    { value: 'IPC', label: 'IPC (Índice de Precios al Consumidor)' },
    { value: 'ninguno', label: 'Sin ajuste' }
] as const

export const CURRENCY_OPTIONS = [
    { value: 'ARS', label: 'ARS (Pesos Argentinos)' },
    { value: 'USD', label: 'USD (Dólares)' }
] as const

// Helpers
export const calculateContractDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) // meses aproximados
}

export const getDaysRemaining = (endDate: string): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isContractExpiringSoon = (endDate: string, daysThreshold: number = 30): boolean => {
    const remaining = getDaysRemaining(endDate)
    return remaining > 0 && remaining <= daysThreshold
}
