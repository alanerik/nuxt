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
    contact_name: string | null
    contact_last_name: string | null
    contact_phone: string | null
    contact_notes: string | null
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
                .from('maintenance_categories')
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
    const fetchRequests = async (filters?: { status?: string; property_id?: string; tenant_id?: string }) => {
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

            console.log('🔍 Fetching maintenance requests:', { filters, resultCount: data?.length || 0 })

            if (err) {
                console.error('❌ Error fetching maintenance requests:', err)
                throw err
            }

            console.log('✅ Successfully fetched maintenance requests:', data)
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
        tenant_id?: string  // Optional: allows admin to specify tenant
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

            const insertPayload = {
                property_id: payload.property_id,
                title: payload.title,
                description: payload.description || '',
                category: payload.category || null,
                priority: payload.priority as 'baja' | 'media' | 'alta' | 'urgente',
                tenant_id: payload.tenant_id || userId,  // Use provided tenant_id or fallback to current user
                status: 'pendiente',
                reported_date: new Date().toISOString(),
                ...(payload.images?.length && { images: payload.images })
            }

            console.log('Creating maintenance request with payload:', insertPayload)

            const { data, error: err } = await supabase
                .from('maintenance_requests')
                .insert(insertPayload as never)
                .select()
                .single()

            if (err) {
                throw new Error(err.message || 'Error al crear la solicitud')
            }

            // Crear notificación para el administrador
            if (data) {
                try {
                    // Obtener todos los administradores
                    const { data: admins, error: adminError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('role', 'admin') as { data: Array<{ id: string }> | null; error: any }

                    if (!adminError && admins && admins.length > 0) {
                        // Crear notificación para cada admin
                        const notifications = admins.map(admin => ({
                            user_id: admin.id,
                            type: 'maintenance',
                            title: 'Nueva solicitud de mantenimiento',
                            message: `${payload.title} - Propiedad: ${payload.property_id}`,
                            entity_type: 'maintenance_request',
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
                    // No fallar la solicitud si las notificaciones fallan
                }
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
    const updateRequestStatus = async (id: string, status: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado', notes?: string) => {
        loading.value = true
        try {
            console.log('🔄 Updating request status:', { id, status, notes })

            const updates: { status: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'; updated_at: string; notes?: string } = { status, updated_at: new Date().toISOString() }
            if (notes) updates.notes = notes

            const { error: err } = await supabase
                .from('maintenance_requests')
                .update(updates as never)
                .eq('id', id)

            if (err) {
                console.error('❌ Error updating status:', err)
                throw err
            }

            console.log('✅ Status updated successfully')

            // Obtener los datos de la solicitud para enviar notificación al inquilino
            const { data: requestData, error: fetchErr } = await supabase
                .from('maintenance_requests')
                .select(`
                    *,
                    property:properties(title),
                    tenant:profiles!maintenance_requests_tenant_id_fkey(id, full_name)
                `)
                .eq('id', id)
                .single()

            if (!fetchErr && requestData) {
                // Crear notificación para el inquilino
                try {
                    const tenant = (requestData as any).tenant
                    const property = (requestData as any).property

                    if (tenant?.id) {
                        const statusLabels: Record<string, string> = {
                            'pendiente': 'Pendiente',
                            'en_proceso': 'En Proceso',
                            'completado': 'Completada',
                            'cancelado': 'Cancelada'
                        }

                        const reqTitle = (requestData as any)?.title || 'sin título'

                        await supabase
                            .from('notifications')
                            .insert({
                                user_id: tenant.id,
                                type: 'maintenance',
                                title: `Solicitud de mantenimiento ${statusLabels[status]}`,
                                message: `Tu solicitud "${reqTitle}" ha sido marcada como ${statusLabels[status].toLowerCase()}`,
                                link: '/inquilino/mantenimiento',
                                is_read: false
                            } as never)

                        console.log('✅ Notification sent to tenant:', tenant.id)
                    }
                } catch (notifError) {
                    console.error('⚠️ Error creating notification:', notifError)
                    // No fallar la actualización si la notificación falla
                }
            }

            // Refresh list
            const index = requests.value.findIndex(r => r.id === id)
            if (index !== -1) {
                const req = requests.value[index]
                if (req) {
                    req.status = status
                    if (notes) req.notes = notes
                }
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
