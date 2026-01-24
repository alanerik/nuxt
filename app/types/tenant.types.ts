// app/types/tenant.types.ts
import type { Database } from './database.types'

// Tipo base de perfil
export type Profile = Database['public']['Tables']['profiles']['Row']

// Inquilino (profile con rol 'inquilino')
export interface Tenant extends Profile {
    role: 'inquilino'
}

// Inquilino con detalles extendidos
export interface TenantWithDetails extends Tenant {
    contracts?: {
        id: string
        property_id: string
        status: string
        start_date: string
        end_date: string
        monthly_rent: number
        currency: string
        property?: {
            id: string
            title: string
            address: string
            city: string
            images?: string[] | null
        }
    }[]
    current_contract?: {
        id: string
        property_id: string
        status: string
        start_date: string
        end_date: string
        monthly_rent: number
        currency: string
        property?: {
            id: string
            title: string
            address: string
            city: string
            images?: string[] | null
        }
    } | null
    payments_summary?: {
        total: number
        paid: number
        pending: number
        overdue: number
    }
}

// Estadísticas de inquilinos
export interface TenantStats {
    total: number
    withActiveContract: number
    withPendingPayments: number
    newThisMonth: number
}

// Filtros para listar inquilinos
export interface TenantFilters {
    search?: string
    status?: 'all' | 'with_contract' | 'without_contract'
    paymentStatus?: 'all' | 'up_to_date' | 'overdue'
    limit?: number
    offset?: number
}

// Estados del inquilino para la UI
export const TENANT_CONTRACT_STATUS = {
    with_contract: 'Con contrato',
    without_contract: 'Sin contrato'
} as const

export const TENANT_CONTRACT_COLORS = {
    with_contract: 'success',
    without_contract: 'neutral'
} as const

export const TENANT_PAYMENT_STATUS = {
    up_to_date: 'Al día',
    overdue: 'En mora',
    no_payments: 'Sin pagos'
} as const

export const TENANT_PAYMENT_COLORS = {
    up_to_date: 'success',
    overdue: 'error',
    no_payments: 'neutral'
} as const

// Helper para obtener el estado de contrato
export function getTenantContractStatus(tenant: TenantWithDetails): keyof typeof TENANT_CONTRACT_STATUS {
    return tenant.current_contract ? 'with_contract' : 'without_contract'
}

// Helper para obtener el estado de pagos
export function getTenantPaymentStatus(tenant: TenantWithDetails): keyof typeof TENANT_PAYMENT_STATUS {
    if (!tenant.payments_summary || tenant.payments_summary.total === 0) {
        return 'no_payments'
    }
    return tenant.payments_summary.overdue > 0 ? 'overdue' : 'up_to_date'
}
