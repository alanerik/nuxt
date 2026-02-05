// app/composables/useMaintenance.ts
import type { Database } from '~/types/database.types'

export type MaintenanceRequest = Database['public']['Tables']['maintenance_requests']['Row'] & {
    property?: {
        id: string
        title: string
        address: string
    } | null
    tenant?: {
        full_name: string
        email: string
        phone: string
    } | null
}

export type MaintenanceCategory = {
    id: string
    name: string
    description: string | null
    is_active: boolean
}

export const useMaintenance = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    const requests = ref<MaintenanceRequest[]>([])
    const categories = ref<MaintenanceCategory[]>([])
    const loading = ref(false)
    const error = ref<Error | null>(null)

    /**
     * Fetch Maintenance Categories (Rubros)
     */
    const fetchCategories = async () => {
        try {
            const { data, error: err } = await supabase
                .from('maintenance_categories' as any) // Cast as any until types are updated
                .select('*')
                .eq('is_active', true)
                .order('name')

            if (err) throw err
            categories.value = data as MaintenanceCategory[]
        } catch (e) {
            console.error('Error fetching categories:', e)
        }
    }

    /**
     * Fetch Maintenance Requests
     */
    const fetchRequests = async (filters?: { status?: string, property_id?: string, tenant_id?: string }) => {
        loading.value = true
        try {
            let query = supabase
                .from('maintenance_requests')
                .select(`
                    *,
                    property:properties(id, title, address),
                    tenant:profiles!maintenance_requests_tenant_id_fkey(full_name, email, phone)
                `)
                .order('created_at', { ascending: false })

            if (filters?.status) {
                query = query.eq('status', filters.status)
            }
            if (filters?.property_id) {
                query = query.eq('property_id', filters.property_id)
            }
            if (filters?.tenant_id) {
                query = query.eq('tenant_id', filters.tenant_id)
            }

            const { data, error: err } = await query
            
            if (err) {
                throw err
            }

            requests.value = data as MaintenanceRequest[]
        } catch (e) {
            error.value = e as Error
            console.error('Error fetching requests:', e)
            requests.value = []
        } finally {
            loading.value = false
        }
    }

    /**
     * Fetch Single Request
     */
    const fetchRequestById = async (id: string) => {
        loading.value = true
        try {
            const { data, error: err } = await supabase
                .from('maintenance_requests')
                .select(`
                    *,
                    property:properties(id, title, address),
                    tenant:profiles!maintenance_requests_tenant_id_fkey(full_name, email, phone)
                `)
                .eq('id', id)
                .single()

            if (err) throw err
            return data as MaintenanceRequest
        } catch (e) {
            console.error('Error fetching request:', e)
            return null
        } finally {
            loading.value = false
        }
    }

    /**
     * Create New Request
     */
    const createRequest = async (payload: {
        property_id: string
        title: string
        description: string
        category: string
        priority: string
        images?: string[]
    }) => {
        loading.value = true
        try {
            // Get current user session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
                throw new Error('Error obteniendo sesión: ' + sessionError.message)
            }
            
            if (!session?.user?.id) {
                throw new Error('Usuario no autenticado')
            }

            // Validar campos requeridos
            if (!payload.property_id) throw new Error('property_id es requerido')
            if (!payload.title) throw new Error('title es requerido')
            if (!payload.priority) throw new Error('priority es requerido')

            const userId = session.user.id

            const insertPayload: any = {
                property_id: payload.property_id,
                title: payload.title,
                description: payload.description || '',
                category: payload.category || null,
                priority: payload.priority,
                tenant_id: userId,
                status: 'pendiente',
                reported_date: new Date().toISOString()
            }

            if (payload.images?.length) {
                insertPayload.images = payload.images
            }

            console.log('Creating maintenance request with payload:', insertPayload)

            const { data, error: err } = await supabase
                .from('maintenance_requests')
                .insert(insertPayload)
                .select()
                .single()

            if (err) {
                throw new Error(err.message || 'Error al crear la solicitud')
            }
            
            return data
        } catch (e) {
            error.value = e as Error
            console.error('Create request error:', e)
            throw e
        } finally {
            loading.value = false
        }
    }

    /**
     * Update Request Status (Admin)
     */
    const updateRequestStatus = async (id: string, status: string, notes?: string) => {
        loading.value = true
        try {
            const updates: any = { status, updated_at: new Date().toISOString() }
            if (notes) updates.notes = notes

            const { error: err } = await supabase
                .from('maintenance_requests')
                .update(updates)
                .eq('id', id)

            if (err) throw err

            // Refresh list
            const index = requests.value.findIndex(r => r.id === id)
            if (index !== -1) {
                requests.value[index].status = status as any
                if (notes) requests.value[index].notes = notes
            }
        } catch (e) {
            error.value = e as Error
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        requests,
        categories,
        loading,
        error,
        fetchCategories,
        fetchRequests,
        fetchRequestById,
        createRequest,
        updateRequestStatus
    }
}
