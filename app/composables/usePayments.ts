// app/composables/usePayments.ts
import type { Database } from '~/types/database.types'
import type {
    Payment,
    PaymentFilters,
    PaymentSort,
    PaymentPagination,
    PaymentUpdate,
    PaymentStats,
    PaymentMethod,
    PaymentStatus
} from '~/types/payment.types'

export const usePayments = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()
    const { role } = useUserRole()

    // Estado reactivo
    const payments = ref<Payment[]>([])
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const total = ref(0)

    /**
     * Query base con relaciones
     */
    const getSelectQuery = () => `
    *,
    contract:contracts (
      id,
      contract_number,
      monthly_rent,
      start_date,
      end_date,
      property:properties (
        id,
        title,
        address,
        city,
        images
      )
    ),
    tenant:profiles!payments_tenant_id_fkey (
      id,
      full_name,
      email,
      phone
    )
  `

    /**
     * Construye query base para poder inferir el tipo
     */
    const buildBaseQuery = () => {
        return supabase
            .from('payments')
            .select(getSelectQuery(), { count: 'exact' })
    }

    // Tipo inferido de la query base
    type PaymentQueryBuilder = ReturnType<typeof buildBaseQuery>

    /**
     * Aplica filtros a la query
     */
    const applyFilters = (query: PaymentQueryBuilder, filters: PaymentFilters): PaymentQueryBuilder => {
        let filteredQuery = query

        if (filters.search) {
            // Búsqueda por nombre de inquilino (se filtra en cliente)
        }

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                filteredQuery = filteredQuery.in('status', filters.status)
            } else {
                filteredQuery = filteredQuery.eq('status', filters.status)
            }
        }

        if (filters.contract_id) {
            filteredQuery = filteredQuery.eq('contract_id', filters.contract_id)
        }

        if (filters.tenant_id) {
            filteredQuery = filteredQuery.eq('tenant_id', filters.tenant_id)
        }

        if (filters.period_month !== undefined) {
            filteredQuery = filteredQuery.eq('period_month', filters.period_month)
        }

        if (filters.period_year !== undefined) {
            filteredQuery = filteredQuery.eq('period_year', filters.period_year)
        }

        if (filters.from_date) {
            filteredQuery = filteredQuery.gte('due_date', filters.from_date)
        }

        if (filters.to_date) {
            filteredQuery = filteredQuery.lte('due_date', filters.to_date)
        }

        return filteredQuery
    }

    /**
     * Aplica ordenamiento
     */
    const applySort = (query: PaymentQueryBuilder, sort?: PaymentSort): PaymentQueryBuilder => {
        if (sort) {
            return query.order(sort.field, { ascending: sort.direction === 'asc' })
        }
        // Por defecto: vencimientos más próximos primero
        return query.order('due_date', { ascending: true })
    }

    /**
     * Aplica paginación
     */
    const applyPagination = (query: PaymentQueryBuilder, pagination?: PaymentPagination): PaymentQueryBuilder => {
        if (pagination) {
            const from = (pagination.page - 1) * pagination.pageSize
            const to = from + pagination.pageSize - 1
            return query.range(from, to)
        }
        return query
    }

    /**
     * Obtiene el listado de pagos con filtros (Admin)
     */
    const fetchPayments = async (
        filters: PaymentFilters = {},
        sort?: PaymentSort,
        pagination?: PaymentPagination
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

            let result = (data || []) as Payment[]

            // Filtro de búsqueda en cliente (por nombre inquilino/propiedad)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                result = result.filter(p =>
                    p.tenant?.full_name?.toLowerCase().includes(searchLower) ||
                    p.contract?.property?.title?.toLowerCase().includes(searchLower) ||
                    p.contract?.property?.address?.toLowerCase().includes(searchLower)
                )
            }

            payments.value = result
            total.value = count || 0

            return { data: result, total: total.value }
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            error.value = err
            console.error('Error fetching payments:', err)
            return { data: [], total: 0 }
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene pagos del inquilino logueado
     */
    const fetchTenantPayments = async (
        filters: PaymentFilters = {},
        sort?: PaymentSort
    ) => {
        if (!user.value) {
            return { data: [], total: 0 }
        }

        return fetchPayments(
            { ...filters, tenant_id: user.value.id },
            sort || { field: 'due_date', direction: 'desc' }
        )
    }

    /**
     * Obtiene un pago por ID
     */
    const fetchPayment = async (id: string) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('payments')
                .select(getSelectQuery())
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            return data as Payment
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            error.value = err
            console.error('Error fetching payment:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene contratos activos para crear pagos
     */
    const fetchActiveContracts = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('contracts')
                .select(`
                    id,
                    contract_number,
                    monthly_rent,
                    currency,
                    payment_day,
                    tenant_id,
                    tenant:profiles!contracts_tenant_id_fkey (
                        id,
                        full_name,
                        email
                    ),
                    property:properties (
                        id,
                        title,
                        address,
                        city
                    )
                `)
                .eq('status', 'activo')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            return data || []
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            console.error('Error fetching contracts:', err)
            return []
        }
    }

    /**
     * Crea un nuevo pago
     */
    const createPayment = async (paymentData: {
        contract_id: string
        tenant_id: string
        amount: number
        currency: string
        due_date: string
        period_month: number
        period_year: number
        notes?: string
    }) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: insertError } = await supabase
                .from('payments')
                .insert({
                    contract_id: paymentData.contract_id,
                    tenant_id: paymentData.tenant_id,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    due_date: paymentData.due_date,
                    period_month: paymentData.period_month,
                    period_year: paymentData.period_year,
                    status: 'pendiente',
                    notes: paymentData.notes || null,
                    late_fee: 0
                })
                .select(getSelectQuery())
                .single()

            if (insertError) throw insertError

            // Crear notificación para el inquilino
            if (data) {
                try {
                    const amount = paymentData.amount || 0
                    const currency = paymentData.currency || 'ARS'
                    const dueDate = new Date(paymentData.due_date).toLocaleDateString('es-AR')

                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: paymentData.tenant_id,
                            type: 'payment',
                            title: 'Nuevo pago creado',
                            message: `Se ha creado un nuevo pago de ${amount} ${currency} con vencimiento el ${dueDate}`,
                            entity_type: 'payment',
                            entity_id: (data as any).id,
                            is_read: false,
                            created_at: new Date().toISOString()
                        } as never)
                } catch (notifError) {
                    console.error('Error creating notification:', notifError)
                    // No fallar el pago si las notificaciones fallan
                }
            }

            return data as Payment
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            error.value = err
            console.error('Error creating payment:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Registra un pago (marcar como pagado)
     */
    const registerPayment = async (
        id: string,
        paymentMethod: PaymentMethod,
        paymentDate?: string,
        receiptNumber?: string,
        notes?: string
    ) => {
        loading.value = true
        error.value = null

        try {
            const updates: PaymentUpdate = {
                status: 'pagado',
                payment_method: paymentMethod,
                payment_date: paymentDate || new Date().toISOString().split('T')[0],
                receipt_number: receiptNumber || null,
                notes: notes || null,
                updated_at: new Date().toISOString()
            }

            const { data, error: updateError } = await supabase
                .from('payments')
                .update(updates)
                .eq('id', id)
                .select(getSelectQuery())
                .single()

            if (updateError) throw updateError

            // Crear notificación para los administradores
            if (data) {
                try {
                    // Obtener todos los administradores
                    const { data: admins, error: adminError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('role', 'admin') as { data: Array<{id: string}> | null; error: any }

                    if (!adminError && admins && admins.length > 0) {
                        const tenantName = (data as any).tenant?.full_name || 'Un inquilino'
                        const amount = (data as any).amount || 0
                        const currency = (data as any).currency || 'ARS'
                        
                        // Crear notificación para cada admin
                        const notifications = admins.map(admin => ({
                            user_id: admin.id,
                            type: 'payment',
                            title: 'Nuevo pago registrado',
                            message: `${tenantName} ha pagado un pago - ${amount} ${currency}`,
                            entity_type: 'payment',
                            entity_id: (data as any).id,
                            is_read: false,
                            created_at: new Date().toISOString()
                        }))

                        await supabase
                            .from('notifications')
                            .insert(notifications as never)
                    }
                } catch (notifError) {
                    console.error('Error creating notification:', notifError)
                    // No fallar el pago si las notificaciones fallan
                }
            }

            return data as Payment
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            error.value = err
            console.error('Error registering payment:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza el estado de un pago
     */
    const updatePaymentStatus = async (id: string, status: PaymentStatus) => {
        loading.value = true
        error.value = null

        try {
            const updates: PaymentUpdate = {
                status,
                updated_at: new Date().toISOString()
            }

            // Si se cancela, limpiar datos de pago
            if (status === 'cancelado' || status === 'pendiente') {
                updates.payment_date = null
                updates.payment_method = null
                updates.receipt_number = null
            }

            const { data, error: updateError } = await supabase
                .from('payments')
                .update(updates)
                .eq('id', id)
                .select(getSelectQuery())
                .single()

            if (updateError) throw updateError

            return data as Payment
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            error.value = err
            console.error('Error updating payment status:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene estadísticas de pagos
     */
    const getPaymentStats = async (periodYear?: number, periodMonth?: number): Promise<PaymentStats> => {
        try {
            const currentDate = new Date()
            const year = periodYear || currentDate.getFullYear()
            const month = periodMonth || currentDate.getMonth() + 1

            let query = supabase
                .from('payments')
                .select('status, amount, currency')

            // Filtrar por período si se especifica
            if (periodYear || periodMonth) {
                query = query.eq('period_year', year).eq('period_month', month)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            const stats: PaymentStats = {
                totalPendiente: 0,
                totalPagado: 0,
                totalVencido: 0,
                countPendiente: 0,
                countPagado: 0,
                countVencido: 0
            }

            for (const payment of data || []) {
                const amount = payment.amount || 0
                switch (payment.status) {
                    case 'pendiente':
                        stats.totalPendiente += amount
                        stats.countPendiente++
                        break
                    case 'pagado':
                        stats.totalPagado += amount
                        stats.countPagado++
                        break
                    case 'vencido':
                        stats.totalVencido += amount
                        stats.countVencido++
                        break
                }
            }

            return stats
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            console.error('Error fetching payment stats:', err)
            return {
                totalPendiente: 0,
                totalPagado: 0,
                totalVencido: 0,
                countPendiente: 0,
                countPagado: 0,
                countVencido: 0
            }
        }
    }

    /**
     * Obtiene pagos próximos a vencer (para notificaciones)
     */
    const getUpcomingPayments = async (daysAhead: number = 7) => {
        try {
            const today = new Date()
            const futureDate = new Date()
            futureDate.setDate(today.getDate() + daysAhead)

            const { data, error: fetchError } = await supabase
                .from('payments')
                .select(getSelectQuery())
                .eq('status', 'pendiente')
                .gte('due_date', today.toISOString().split('T')[0])
                .lte('due_date', futureDate.toISOString().split('T')[0])
                .order('due_date', { ascending: true })

            if (fetchError) throw fetchError

            return (data || []) as Payment[]
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            console.error('Error fetching upcoming payments:', err)
            return []
        }
    }

    /**
     * Obtiene pagos vencidos
     */
    const getOverduePayments = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]

            const { data, error: fetchError } = await supabase
                .from('payments')
                .select(getSelectQuery())
                .eq('status', 'pendiente')
                .lt('due_date', today)
                .order('due_date', { ascending: true })

            if (fetchError) throw fetchError

            // Actualizar estado a vencido (opcional, se puede hacer con trigger en DB)
            for (const payment of data || []) {
                await supabase
                    .from('payments')
                    .update({ status: 'vencido' as PaymentStatus })
                    .eq('id', payment.id)
            }

            return (data || []) as Payment[]
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            console.error('Error fetching overdue payments:', err)
            return []
        }
    }

    /**
     * Obtiene el próximo pago del inquilino
     */
    const getNextTenantPayment = async () => {
        if (!user.value) return null

        try {
            const { data, error: fetchError } = await supabase
                .from('payments')
                .select(getSelectQuery())
                .eq('tenant_id', user.value.id)
                .in('status', ['pendiente', 'vencido'])
                .order('due_date', { ascending: true })
                .limit(1)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

            return data as Payment | null
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e))
            console.error('Error fetching next tenant payment:', err)
            return null
        }
    }

    return {
        // Estado
        payments: readonly(payments),
        loading: readonly(loading),
        error: readonly(error),
        total: readonly(total),

        // Métodos
        fetchPayments,
        fetchTenantPayments,
        fetchPayment,
        fetchActiveContracts,
        createPayment,
        registerPayment,
        updatePaymentStatus,
        getPaymentStats,
        getUpcomingPayments,
        getOverduePayments,
        getNextTenantPayment
    }
}
