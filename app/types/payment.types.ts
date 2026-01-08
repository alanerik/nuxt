// app/types/payment.types.ts
import type { Database } from './database.types'

// Tipos base de la BD
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

// Enums
export type PaymentStatus = 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
export type PaymentMethod = 'efectivo' | 'transferencia'

// Payment con relaciones
export interface Payment extends PaymentRow {
    contract?: {
        id: string
        contract_number: string | null
        monthly_rent: number
        start_date: string
        end_date: string
        property?: {
            id: string
            title: string
            address: string
            city: string
            images: string[] | null
        } | null
    } | null
    tenant?: {
        id: string
        full_name: string | null
        email: string
        phone: string | null
    } | null
}

// Filtros
export interface PaymentFilters {
    search?: string
    status?: PaymentStatus | PaymentStatus[]
    contract_id?: string
    tenant_id?: string
    period_month?: number
    period_year?: number
    from_date?: string
    to_date?: string
}

// Sort
export type PaymentSortField = 'due_date' | 'payment_date' | 'amount' | 'created_at' | 'period_year' | 'period_month'

export type SortDirection = 'asc' | 'desc'

export interface PaymentSort {
    field: PaymentSortField
    direction: SortDirection
}

// Paginación
export interface PaymentPagination {
    page: number
    pageSize: number
    total?: number
}

// Stats
export interface PaymentStats {
    totalPendiente: number
    totalPagado: number
    totalVencido: number
    countPendiente: number
    countPagado: number
    countVencido: number
}

// Labels
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    vencido: 'Vencido',
    cancelado: 'Cancelado'
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
    pendiente: 'warning',
    pagado: 'success',
    vencido: 'error',
    cancelado: 'neutral'
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia'
}

export const PAYMENT_METHOD_OPTIONS = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' }
] as const

// Helpers
export const MONTHS_LABELS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const

export const formatPeriod = (month: number, year: number): string => {
    return `${MONTHS_LABELS[month - 1]} ${year}`
}
