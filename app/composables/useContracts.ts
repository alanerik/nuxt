// app/composables/useContracts.ts
import type { Database } from '~/types/database.types'
import type {
    Contract,
    ContractFilters,
    ContractSort,
    ContractPagination,
    ContractInsert,
    ContractUpdate
} from '~/types/contract.types'

export const useContracts = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    // Estado reactivo
    const contracts = ref<Contract[]>([])
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const total = ref(0)

    /**
     * Query base con relaciones
     */
    const getSelectQuery = () => `
    *,
    property:properties (
      id,
      title,
      address,
      city,
      images,
      operation_type
    ),
    tenant:profiles!contracts_tenant_id_fkey (
      id,
      full_name,
      email,
      phone,
      dni
    ),
    agent:agents (
      id,
      user_id,
      profiles (
        full_name,
        email,
        phone
      )
    )
  `

    /**
     * Aplica filtros a la query
     */
    const applyFilters = (query: any, filters: ContractFilters) => {
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query = query.in('status', filters.status)
            } else {
                query = query.eq('status', filters.status)
            }
        }

        if (filters.property_id) {
            query = query.eq('property_id', filters.property_id)
        }

        if (filters.tenant_id) {
            query = query.eq('tenant_id', filters.tenant_id)
        }

        if (filters.agent_id) {
            query = query.eq('agent_id', filters.agent_id)
        }

        if (filters.from_date) {
            query = query.gte('start_date', filters.from_date)
        }

        if (filters.to_date) {
            query = query.lte('end_date', filters.to_date)
        }

        return query
    }

    /**
     * Aplica ordenamiento
     */
    const applySort = (query: any, sort?: ContractSort) => {
        if (sort) {
            query = query.order(sort.field, { ascending: sort.direction === 'asc' })
        } else {
            query = query.order('created_at', { ascending: false })
        }
        return query
    }

    /**
     * Aplica paginación
     */
    const applyPagination = (query: any, pagination?: ContractPagination) => {
        if (pagination) {
            const from = (pagination.page - 1) * pagination.pageSize
            const to = from + pagination.pageSize - 1
            query = query.range(from, to)
        }
        return query
    }

    /**
     * Obtiene el listado de contratos con filtros
     */
    const fetchContracts = async (
        filters: ContractFilters = {},
        sort?: ContractSort,
        pagination?: ContractPagination
    ) => {
        loading.value = true
        error.value = null

        try {
            let query = supabase
                .from('contracts')
                .select(getSelectQuery(), { count: 'exact' })

            query = applyFilters(query, filters)
            query = applySort(query, sort)
            query = applyPagination(query, pagination)

            const { data, error: fetchError, count } = await query as any

            if (fetchError) throw fetchError

            let result = data as Contract[]

            // Filtro de búsqueda en cliente
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                result = result.filter(c =>
                    c.tenant?.full_name?.toLowerCase().includes(searchLower) ||
                    c.property?.title?.toLowerCase().includes(searchLower) ||
                    c.property?.address?.toLowerCase().includes(searchLower) ||
                    c.contract_number?.toLowerCase().includes(searchLower)
                )
            }

            contracts.value = result
            total.value = count || 0

            return { data: result, total: total.value }
        } catch (e: any) {
            error.value = e
            console.error('Error fetching contracts:', e)
            return { data: [], total: 0 }
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene un contrato por ID
     */
    const fetchContract = async (id: string) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('contracts')
                .select(getSelectQuery())
                .eq('id', id)
                .single() as any

            if (fetchError) throw fetchError

            return data as Contract
        } catch (e: any) {
            error.value = e
            console.error('Error fetching contract:', e)
            return null
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene propiedades disponibles para alquiler
     */
    const fetchAvailableProperties = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('properties')
                .select('id, title, address, city, images, operation_type, price, currency')
                .in('operation_type', ['alquiler', 'alquiler_temporal'])
                .eq('status', 'disponible')
                .eq('is_published', true)
                .order('title', { ascending: true }) as any

            if (fetchError) throw fetchError

            return data || []
        } catch (e: any) {
            console.error('Error fetching available properties:', e)
            return []
        }
    }

    /**
     * Obtiene inquilinos (usuarios con rol inquilino)
     */
    const fetchTenants = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, dni')
                .eq('role', 'inquilino')
                .eq('is_active', true)
                .order('full_name', { ascending: true }) as any

            if (fetchError) throw fetchError

            return data || []
        } catch (e: any) {
            console.error('Error fetching tenants:', e)
            return []
        }
    }

    /**
     * Obtiene agentes
     */
    const fetchAgents = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('agents')
                .select(`
          id,
          user_id,
          profiles (
            full_name,
            email
          )
        `)
                .eq('is_verified', true)
                .order('created_at', { ascending: false }) as any

            if (fetchError) throw fetchError

            return data || []
        } catch (e: any) {
            console.error('Error fetching agents:', e)
            return []
        }
    }

    /**
     * Crea un nuevo contrato
     */
    const createContract = async (contractData: ContractInsert) => {
        loading.value = true
        error.value = null

        try {
            // Generar número de contrato si no existe
            if (!contractData.contract_number) {
                const year = new Date().getFullYear()
                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
                contractData.contract_number = `CTR-${year}-${random}`
            }

            const { data, error: insertError } = await supabase
                .from('contracts')
                .insert(contractData as any)
                .select(getSelectQuery())
                .single() as any

            if (insertError) throw insertError

            // Actualizar estado de la propiedad a 'alquilada' si el contrato está activo
            if (contractData.status === 'activo' && contractData.property_id) {
                await supabase
                    .from('properties')
                    .update({ status: 'alquilada' } as any)
                    .eq('id', contractData.property_id)
            }

            return data as Contract
        } catch (e: any) {
            error.value = e
            console.error('Error creating contract:', e)
            throw e
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza un contrato
     */
    const updateContract = async (id: string, updates: ContractUpdate) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: updateError } = await supabase
                .from('contracts')
                .update({ ...updates, updated_at: new Date().toISOString() } as any)
                .eq('id', id)
                .select(getSelectQuery())
                .single() as any

            if (updateError) throw updateError

            return data as Contract
        } catch (e: any) {
            error.value = e
            console.error('Error updating contract:', e)
            throw e
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza el estado de un contrato
     */
    const updateContractStatus = async (id: string, status: Contract['status'], propertyId?: string) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: updateError } = await supabase
                .from('contracts')
                .update({ status, updated_at: new Date().toISOString() } as any)
                .eq('id', id)
                .select(getSelectQuery())
                .single() as any

            if (updateError) throw updateError

            // Actualizar estado de la propiedad según el estado del contrato
            if (propertyId) {
                let propertyStatus = 'disponible'
                if (status === 'activo') {
                    propertyStatus = 'alquilada'
                }

                await supabase
                    .from('properties')
                    .update({ status: propertyStatus } as any)
                    .eq('id', propertyId)
            }

            return data as Contract
        } catch (e: any) {
            error.value = e
            console.error('Error updating contract status:', e)
            throw e
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene estadísticas de contratos
     */
    const getContractStats = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('contracts')
                .select('status, monthly_rent') as any

            if (fetchError) throw fetchError

            const stats = {
                total: 0,
                activos: 0,
                pendientes: 0,
                vencidos: 0,
                ingresosMensuales: 0
            }

            for (const contract of data || []) {
                stats.total++
                switch (contract.status) {
                    case 'activo':
                        stats.activos++
                        stats.ingresosMensuales += contract.monthly_rent || 0
                        break
                    case 'pendiente':
                        stats.pendientes++
                        break
                    case 'vencido':
                        stats.vencidos++
                        break
                }
            }

            return stats
        } catch (e: any) {
            console.error('Error fetching contract stats:', e)
            return {
                total: 0,
                activos: 0,
                pendientes: 0,
                vencidos: 0,
                ingresosMensuales: 0
            }
        }
    }

    /**
     * Obtiene contratos próximos a vencer
     */
    const getExpiringContracts = async (daysAhead: number = 30) => {
        try {
            const today = new Date()
            const futureDate = new Date()
            futureDate.setDate(today.getDate() + daysAhead)

            const { data, error: fetchError } = await supabase
                .from('contracts')
                .select(getSelectQuery())
                .eq('status', 'activo')
                .gte('end_date', today.toISOString().split('T')[0])
                .lte('end_date', futureDate.toISOString().split('T')[0])
                .order('end_date', { ascending: true }) as any

            if (fetchError) throw fetchError

            return data as Contract[]
        } catch (e: any) {
            console.error('Error fetching expiring contracts:', e)
            return []
        }
    }

    return {
        // Estado
        contracts: readonly(contracts),
        loading: readonly(loading),
        error: readonly(error),
        total: readonly(total),

        // Métodos
        fetchContracts,
        fetchContract,
        fetchAvailableProperties,
        fetchTenants,
        fetchAgents,
        createContract,
        updateContract,
        updateContractStatus,
        getContractStats,
        getExpiringContracts
    }
}
