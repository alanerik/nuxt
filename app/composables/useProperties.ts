// app/composables/useProperties.ts
import type { Database } from '~/types/database.types'
import type {
    Property,
    PropertyFilters,
    PropertySort,
    PropertyPagination,
    PropertyInsert,
    PropertyUpdate
} from '~/types/property.types'

export const useProperties = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()
    const { role } = useUserRole()

    // Type helpers
    type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
    type PropertyUpdateDB = Tables<'properties'>['Update']
    type PropertyInsertDB = Tables<'properties'>['Insert']

    // Estado reactivo
    const properties = ref<Property[]>([])
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const total = ref(0)

    /**
     * Construye la query base según el rol del usuario
     */
    const buildBaseQuery = () => {
        // Query simplificada sin relaciones anidadas para evitar errores 500
        let query = supabase
            .from('properties')
            .select('*', { count: 'exact' })

        // Filtros según rol (RLS ya los maneja, pero podemos agregar lógica adicional)
        if (role.value === 'agente' && user.value) {
            // Los agentes solo ven sus propiedades (ya manejado por RLS)
            // NOTA: agent_id referencia a agents.id, no a auth.uid()
        } else if (!user.value) {
            // Usuarios no autenticados solo ven publicadas y disponibles
            query = query
                .eq('is_published', true)
                .eq('status', 'disponible')
        }

        return query
    }

    // Tipo inferido de la query base
    type PropertyQueryBuilder = ReturnType<typeof buildBaseQuery>

    /**
     * Aplica filtros a la query
     */
    const applyFilters = (query: PropertyQueryBuilder, filters: PropertyFilters): PropertyQueryBuilder => {
        let filteredQuery = query

        if (filters.search) {
            filteredQuery = filteredQuery.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`)
        }

        if (filters.property_type) {
            if (Array.isArray(filters.property_type)) {
                filteredQuery = filteredQuery.in('property_type', filters.property_type)
            } else {
                filteredQuery = filteredQuery.eq('property_type', filters.property_type)
            }
        }

        if (filters.operation_type) {
            filteredQuery = filteredQuery.eq('operation_type', filters.operation_type)
        }

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                filteredQuery = filteredQuery.in('status', filters.status)
            } else {
                filteredQuery = filteredQuery.eq('status', filters.status)
            }
        }

        if (filters.min_price !== undefined) {
            filteredQuery = filteredQuery.gte('price', filters.min_price)
        }

        if (filters.max_price !== undefined) {
            filteredQuery = filteredQuery.lte('price', filters.max_price)
        }

        if (filters.bedrooms !== undefined) {
            filteredQuery = filteredQuery.gte('bedrooms', filters.bedrooms)
        }

        if (filters.bathrooms !== undefined) {
            filteredQuery = filteredQuery.gte('bathrooms', filters.bathrooms)
        }

        if (filters.city) {
            filteredQuery = filteredQuery.ilike('city', `%${filters.city}%`)
        }

        if (filters.agent_id) {
            filteredQuery = filteredQuery.eq('agent_id', filters.agent_id)
        }

        if (filters.is_featured !== undefined) {
            filteredQuery = filteredQuery.eq('is_featured', filters.is_featured)
        }

        if (filters.is_published !== undefined) {
            filteredQuery = filteredQuery.eq('is_published', filters.is_published)
        }

        return filteredQuery
    }

    /**
     * Aplica ordenamiento
     */
    const applySort = (query: PropertyQueryBuilder, sort?: PropertySort): PropertyQueryBuilder => {
        if (sort) {
            return query.order(sort.field, { ascending: sort.direction === 'asc' })
        }
        // Ordenamiento por defecto: más recientes primero
        return query.order('created_at', { ascending: false })
    }

    /**
     * Aplica paginación
     */
    const applyPagination = (query: PropertyQueryBuilder, pagination?: PropertyPagination): PropertyQueryBuilder => {
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
     * Obtiene el listado de propiedades con filtros
     */
    const fetchProperties = async (
        filters: PropertyFilters = {},
        sort?: PropertySort,
        pagination?: PropertyPagination
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

            properties.value = (data || []) as Property[]
            total.value = count || 0

            return { data: properties.value, total: total.value }
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error fetching properties:', err)
            return { data: [], total: 0 }
        } finally {
            loading.value = false
        }
    }

    /**
     * Obtiene una propiedad por ID
     */
    const fetchProperty = async (id: string) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('properties')
                .select(`
      *,
      agent:agents (
        id,
        user_id,
        license_number,
        commission_rate,
        profiles (
          full_name,
          phone,
          email,
          avatar_url
        )
      ),
      owner:profiles (
        id,
        full_name,
        phone,
        email
      ),
      active_contract:contracts (
        id,
        contract_number,
        tenant_id,
        start_date,
        end_date,
        monthly_rent,
        status,
        tenant:profiles (
          full_name,
          phone,
          email
        )
      )
    `)
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            // Incrementar contador de vistas (solo si no es el propietario/agente)
            const propertyData = data as Property
            if (propertyData && (!user.value || (user.value.id !== propertyData.agent_id && user.value.id !== propertyData.owner_id))) {
                await supabase
                    .from('properties')
                    .update({ views_count: (propertyData.views_count || 0) + 1 })
                    .eq('id', id)
            }

            return propertyData
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error fetching property:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    /**
     * Crea una nueva propiedad
     */
    const createProperty = async (property: PropertyInsert) => {
        loading.value = true
        error.value = null

        try {
            // Si es agente, asignar automáticamente
            const propertyData: PropertyInsertDB = { ...property }
            if (role.value === 'agente' && user.value) {
                propertyData.agent_id = user.value.id
            }

            const { data, error: insertError } = await supabase
                .from('properties')
                .insert(propertyData)
                .select()
                .single()

            if (insertError) throw insertError

            return data as Property
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error creating property:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Actualiza una propiedad
     */
    const updateProperty = async (id: string, updates: PropertyUpdate) => {
        loading.value = true
        error.value = null

        try {
            const updateData: PropertyUpdateDB = { ...updates }

            const { data, error: updateError } = await supabase
                .from('properties')
                .update(updateData)
                .eq('id', id)
                .select()
                .single()

            if (updateError) throw updateError

            return data as Property
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error updating property:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Elimina una propiedad (hard delete)
     */
    const deleteProperty = async (id: string) => {
        loading.value = true
        error.value = null

        try {
            // Hard delete: borrar la fila de la base de datos
            const { error: deleteError } = await supabase
                .from('properties')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError

            return true
        } catch (e) {
            const err = formatError(e)
            error.value = err
            console.error('Error deleting property:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Sube imágenes a Supabase Storage
     */
    const uploadPropertyImages = async (propertyId: string, files: File[]) => {
        const uploadedUrls: string[] = []

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('properties')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                const { data: urlData } = supabase.storage
                    .from('properties')
                    .getPublicUrl(fileName)

                uploadedUrls.push(urlData.publicUrl)
            }

            return uploadedUrls
        } catch (e) {
            const err = formatError(e)
            console.error('Error uploading images:', err)
            throw err
        }
    }

    return {
        // Estado
        properties: readonly(properties),
        loading: readonly(loading),
        error: readonly(error),
        total: readonly(total),

        // Métodos
        fetchProperties,
        fetchProperty,
        createProperty,
        updateProperty,
        deleteProperty,
        uploadPropertyImages
    }
}