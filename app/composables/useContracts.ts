// app/composables/useContracts.ts
import type { Database } from '~/types/database.types'
import type {
    Contract,
    ContractFilters,
    ContractSort,
    ContractPagination,
    ContractInsert,
    ContractUpdate,
    ContractStatus
} from '~/types/contract.types'

// Type helpers
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
type ContractRow = Tables<'contracts'>['Row']
type ContractInsertDB = Tables<'contracts'>['Insert']
type ContractUpdateDB = Tables<'contracts'>['Update']

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
     * Construye query base para poder inferir el tipo
     */
    const buildBaseQuery = () => {
        return supabase
            .from('contracts')
            .select(getSelectQuery(), { count: 'exact' })
    }

    // Tipo inferido de la query base
    type ContractQueryBuilder = ReturnType<typeof buildBaseQuery>

    /**
     * Aplica filtros a la query
     */
    const applyFilters = (query: ContractQueryBuilder, filters: ContractFilters): ContractQueryBuilder => {
        let filteredQuery = query

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                filteredQuery = filteredQuery.in('status', filters.status)
            } else {
                filteredQuery = filteredQuery.eq('status', filters.status)
            }
        }

        if (filters.property_id) {
            filteredQuery = filteredQuery.eq('property_id', filters.property_id)
        }

        if (filters.tenant_id) {
            filteredQuery = filteredQuery.eq('tenant_id', filters.tenant_id)
        }

        if (filters.agent_id) {
            filteredQuery = filteredQuery.eq('agent_id', filters.agent_id)
        }

        if (filters.from_date) {
            filteredQuery = filteredQuery.gte('start_date', filters.from_date)
        }

        if (filters.to_date) {
            filteredQuery = filteredQuery.lte('end_date', filters.to_date)
        }

        return filteredQuery
    }

    /**
     * Aplica ordenamiento
     */
    const applySort = (query: ContractQueryBuilder, sort?: ContractSort): ContractQueryBuilder => {
        if (sort) {
            return query.order(sort.field, { ascending: sort.direction === 'asc' })
        }
        return query.order('created_at', { ascending: false })
    }

    /**
     * Aplica paginación
     */
    const applyPagination = (query: ContractQueryBuilder, pagination?: ContractPagination): ContractQueryBuilder => {
        if (pagination) {
            const from = (pagination.page - 1) * pagination.pageSize
            const to = from + pagination.pageSize - 1
            return query.range(from, to)
        }
        return query
    }

    /**
     * Helper para formatear errores
     */
    const formatError = (e: unknown): Error => {
        if (e instanceof Error) return e
        if (typeof e === 'object' && e !== null && 'message' in e) {
            return new Error((e as any).message)
        }
        return new Error(String(e))
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
            let query = buildBaseQuery()
            query = applyFilters(query, filters)
            query = applySort(query, sort)
            query = applyPagination(query, pagination)

            const { data, error: fetchError, count } = await query

            if (fetchError) throw fetchError

            let result = (data || []) as Contract[]

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
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error fetching contracts:', err)
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
                .single()

            if (fetchError) throw fetchError

            return data as Contract
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error fetching contract:', err)
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
                .select('id, title, address, city, images, operation_type, price, currency, status')
                .order('title', { ascending: true })

            if (fetchError) throw fetchError

            // Filtrar en cliente: solo alquiler/temporal y disponible/reservada
            const filtered = (data || []).filter(p =>
                (p.operation_type === 'alquiler' || p.operation_type === 'alquiler_temporal') &&
                (p.status === 'disponible' || p.status === 'reservada')
            )

            return filtered
        } catch (e) {
            const err = formatError(e)
            console.error('Error fetching available properties:', err)
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
                .order('full_name', { ascending: true })

            if (fetchError) throw fetchError

            return data || []
        } catch (e) {
            const err = formatError(e)
            console.error('Error fetching tenants:', err)
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
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            return data || []
        } catch (e) {
            const err = formatError(e)
            console.error('Error fetching agents:', err)
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
            const insertData: ContractInsertDB = { ...contractData }
            if (!insertData.contract_number) {
                const year = new Date().getFullYear()
                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
                insertData.contract_number = `CTR-${year}-${random}`
            }

            const { data, error: insertError } = await supabase
                .from('contracts')
                .insert(insertData)
                .select(getSelectQuery())
                .single()

            if (insertError) throw insertError

            // El trigger SQL actualiza automáticamente el estado de la propiedad

            return data as Contract
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error creating contract:', err)
            throw err
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
            const updateData: ContractUpdateDB = {
                ...updates,
                updated_at: new Date().toISOString()
            }

            const { data, error: updateError } = await supabase
                .from('contracts')
                .update(updateData)
                .eq('id', id)
                .select(getSelectQuery())
                .single()

            if (updateError) throw updateError

            return data as Contract
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error updating contract:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza el estado de un contrato
     */
    const updateContractStatus = async (id: string, status: ContractStatus) => {
        loading.value = true
        error.value = null

        try {
            const updateData: ContractUpdateDB = {
                status,
                updated_at: new Date().toISOString()
            }

            const { data, error: updateError } = await supabase
                .from('contracts')
                .update(updateData)
                .eq('id', id)
                .select(getSelectQuery())
                .single()

            if (updateError) throw updateError

            // El trigger SQL actualiza automáticamente el estado de la propiedad

            return data as Contract
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error updating contract status:', err)
            throw err
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
                .select('status, monthly_rent')

            if (fetchError) throw fetchError

            const contractsData = (data || []) as Array<Pick<ContractRow, 'status' | 'monthly_rent'>>

            const stats = {
                total: 0,
                activos: 0,
                pendientes: 0,
                vencidos: 0,
                ingresosMensuales: 0
            }

            for (const contract of contractsData) {
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
        } catch (e) {
            const err = formatError(e)
            console.error('Error fetching contract stats:', err)
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
                .order('end_date', { ascending: true })

            if (fetchError) throw fetchError

            return (data || []) as Contract[]
        } catch (e) {
            const err = formatError(e)
            console.error('Error fetching expiring contracts:', err)
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
