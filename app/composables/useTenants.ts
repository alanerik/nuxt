// app/composables/useTenants.ts
import type {
    TenantWithDetails,
    TenantStats,
    TenantFilters
} from '~/types/tenant.types'

export function useTenants() {
    const supabase = useSupabaseClient()

    /**
     * Obtener lista de inquilinos con filtros opcionales
     */
    const fetchTenants = async (filters: TenantFilters = {}) => {
        try {
            // Base query: profiles con rol 'inquilino'
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'inquilino')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            // Filtro de búsqueda
            if (filters.search) {
                query = query.or(
                    `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,dni.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
                )
            }

            // Límite y offset
            if (filters.limit) {
                query = query.limit(filters.limit)
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
            }

            const { data, error } = await query

            if (error) {
                console.error('Supabase error:', error)
                return { data: [], count: 0 }
            }

            // Obtener contratos activos por separado
            const tenantIds = (data || []).map((t) => t.id)

            let contractsData: Contracts[] = []
            if (tenantIds.length > 0) {
                const { data: contracts } = await supabase
                    .from('contracts')
                    .select(`
                        id,
                        tenant_id,
                        property_id,
                        status,
                        start_date,
                        end_date,
                        monthly_rent,
                        currency,
                        property:properties (
                            id,
                            title,
                            address,
                            city,
                            images
                        )
                    `)
                    .in('tenant_id', tenantIds)
                    .eq('status', 'activo')

                contractsData = contracts || []
            }

            // Procesar datos para agregar información resumida
            const tenantsWithDetails: TenantWithDetails[] = (data || []).map((tenant) => {
                const currentContract = contractsData.find((c) => c.tenant_id === tenant.id) || null

                return {
                    ...tenant,
                    contracts: currentContract ? [currentContract] : [],
                    current_contract: currentContract,
                    payments_summary: null
                }
            })

            // Filtrar por estado de contrato si se especifica
            let filteredTenants = tenantsWithDetails
            if (filters.status === 'with_contract') {
                filteredTenants = tenantsWithDetails.filter(t => t.current_contract !== null)
            } else if (filters.status === 'without_contract') {
                filteredTenants = tenantsWithDetails.filter(t => t.current_contract === null)
            }

            return {
                data: filteredTenants,
                count: filteredTenants.length
            }
        } catch (error) {
            console.error('Error fetching tenants:', error)
            return { data: [], count: 0 }
        }
    }

    /**
     * Obtener un inquilino por ID con todos sus detalles
     */
    const getTenantById = async (id: string): Promise<TenantWithDetails | null> => {
        try {
            // Obtener perfil con contratos
            const { data: tenant, error: tenantError } = await supabase
                .from('profiles')
                .select(`
          *,
          contracts!contracts_tenant_id_fkey (
            id,
            contract_number,
            property_id,
            status,
            start_date,
            end_date,
            monthly_rent,
            deposit,
            currency,
            payment_day,
            property:properties (
              id,
              title,
              address,
              city,
              images
            )
          )
        `)
                .eq('id', id)
                .eq('role', 'inquilino')
                .single()

            if (tenantError) throw tenantError
            if (!tenant) return null

            // Obtener resumen de pagos
            const { data: payments } = await supabase
                .from('payments')
                .select('id, status')
                .eq('tenant_id', id)

            const paymentsSummary = {
                total: payments?.length || 0,
                paid: payments?.filter((p) => p.status === 'pagado').length || 0,
                pending: payments?.filter((p) => p.status === 'pendiente').length || 0,
                overdue: payments?.filter((p) => p.status === 'vencido').length || 0
            }

            const contracts = (tenant as Record<string, unknown>).contracts || []
            const currentContract = contracts.find((c) => c.status === 'activo') || null

            return {
                ...tenant,
                contracts,
                current_contract: currentContract,
                payments_summary: paymentsSummary
            } as TenantWithDetails
        } catch (error) {
            console.error('Error fetching tenant:', error)
            throw error
        }
    }

    /**
     * Obtener estadísticas de inquilinos
     */
    const getTenantStats = async (): Promise<TenantStats> => {
        try {
            // Total de inquilinos activos
            const { count: total } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'inquilino')
                .eq('is_active', true)

            // Inquilinos con contrato activo
            const { data: activeContracts } = await supabase
                .from('contracts')
                .select('tenant_id')
                .eq('status', 'activo')

            const uniqueTenantIds = new Set((activeContracts || []).map((c) => c.tenant_id))
            const withActiveContract = uniqueTenantIds.size

            // Inquilinos con pagos pendientes/vencidos
            const { data: pendingPayments } = await supabase
                .from('payments')
                .select('tenant_id')
                .in('status', ['pendiente', 'vencido'])

            const tenantsWithPending = new Set((pendingPayments || []).map((p) => p.tenant_id))
            const withPendingPayments = tenantsWithPending.size

            // Nuevos este mes
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { count: newThisMonth } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'inquilino')
                .eq('is_active', true)
                .gte('created_at', startOfMonth.toISOString())

            return {
                total: total || 0,
                withActiveContract,
                withPendingPayments,
                newThisMonth: newThisMonth || 0
            }
        } catch (error) {
            console.error('Error fetching tenant stats:', error)
            return {
                total: 0,
                withActiveContract: 0,
                withPendingPayments: 0,
                newThisMonth: 0
            }
        }
    }

    /**
     * Crear nuevo inquilino
     */
    const createTenant = async (data: {
        email: string
        full_name: string
        phone?: string
        dni?: string
        address?: string
    }) => {
        try {
            // Crear usuario en auth (con contraseña temporal)
            const tempPassword = Math.random().toString(36).slice(-12)

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: tempPassword,
                options: {
                    data: {
                        full_name: data.full_name,
                        role: 'inquilino'
                    }
                }
            })

            if (authError) throw authError

            // El trigger de Supabase debería crear el perfil automáticamente
            // Pero actualizamos con los datos adicionales
            if (authData.user) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: data.full_name,
                        phone: data.phone || null,
                        dni: data.dni || null,
                        address: data.address || null,
                        role: 'inquilino'
                    })
                    .eq('id', authData.user.id)

                if (updateError) throw updateError
            }

            return { success: true, userId: authData.user?.id }
        } catch (error) {
            console.error('Error creating tenant:', error)
            throw error
        }
    }

    /**
     * Actualizar datos de un inquilino
     */
    const updateTenant = async (id: string, data: {
        full_name?: string
        phone?: string
        dni?: string
        address?: string
        avatar_url?: string
    }) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('role', 'inquilino')

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Error updating tenant:', error)
            throw error
        }
    }

    /**
     * Desactivar un inquilino (soft delete)
     */
    const deactivateTenant = async (id: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('role', 'inquilino')

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Error deactivating tenant:', error)
            throw error
        }
    }

    /**
     * Obtener historial de pagos de un inquilino
     */
    const getTenantPayments = async (tenantId: string) => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
          *,
          contract:contracts (
            id,
            property:properties (
              id,
              title,
              address
            )
          )
        `)
                .eq('tenant_id', tenantId)
                .order('due_date', { ascending: false })

            if (error) throw error

            return data || []
        } catch (error) {
            console.error('Error fetching tenant payments:', error)
            throw error
        }
    }

    /**
     * Obtener solicitudes de mantenimiento de un inquilino
     */
    const getTenantMaintenanceRequests = async (tenantId: string) => {
        try {
            const { data, error } = await supabase
                .from('maintenance_requests')
                .select(`
          *,
          property:properties (
            id,
            title,
            address
          )
        `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })

            if (error) throw error

            return data || []
        } catch (error) {
            console.error('Error fetching maintenance requests:', error)
            throw error
        }
    }

    return {
        fetchTenants,
        getTenantById,
        getTenantStats,
        createTenant,
        updateTenant,
        deactivateTenant,
        getTenantPayments,
        getTenantMaintenanceRequests
    }
}
