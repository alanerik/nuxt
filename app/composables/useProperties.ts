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

    /**
     * Aplica filtros a la query
     */
    const applyFilters = (query: any, filters: PropertyFilters) => {
        if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`)
        }

        if (filters.property_type) {
            if (Array.isArray(filters.property_type)) {
                query = query.in('property_type', filters.property_type)
            } else {
                query = query.eq('property_type', filters.property_type)
            }
        }

        if (filters.operation_type) {
            query = query.eq('operation_type', filters.operation_type)
        }

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query = query.in('status', filters.status)
            } else {
                query = query.eq('status', filters.status)
            }
        }

        if (filters.min_price !== undefined) {
            query = query.gte('price', filters.min_price)
        }

        if (filters.max_price !== undefined) {
            query = query.lte('price', filters.max_price)
        }

        if (filters.bedrooms !== undefined) {
            query = query.gte('bedrooms', filters.bedrooms)
        }

        if (filters.bathrooms !== undefined) {
            query = query.gte('bathrooms', filters.bathrooms)
        }

        if (filters.city) {
            query = query.ilike('city', `%${filters.city}%`)
        }

        if (filters.agent_id) {
            query = query.eq('agent_id', filters.agent_id)
        }

        if (filters.is_featured !== undefined) {
            query = query.eq('is_featured', filters.is_featured)
        }

        if (filters.is_published !== undefined) {
            query = query.eq('is_published', filters.is_published)
        }

        return query
    }

    /**
     * Aplica ordenamiento
     */
    const applySort = (query: any, sort?: PropertySort) => {
        if (sort) {
            query = query.order(sort.field, { ascending: sort.direction === 'asc' })
        } else {
            // Ordenamiento por defecto: más recientes primero
            query = query.order('created_at', { ascending: false })
        }
        return query
    }

    /**
     * Aplica paginación
     */
    const applyPagination = (query: any, pagination?: PropertyPagination) => {
        if (pagination) {
            const from = (pagination.page - 1) * pagination.pageSize
            const to = from + pagination.pageSize - 1
            query = query.range(from, to)
        }
        return query
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

            const { data, error: fetchError, count } = await query as any

            if (fetchError) throw fetchError

            properties.value = data as Property[]
            total.value = count || 0

            return { data: properties.value, total: total.value }
        } catch (e: any) {
            error.value = e
            console.error('Error fetching properties:', e)
            console.error('Details:', JSON.stringify(e, null, 2))
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
                .single() as any

            if (fetchError) throw fetchError

            // Incrementar contador de vistas (solo si no es el propietario/agente)
            if (data && (!user.value || (user.value.id !== data.agent_id && user.value.id !== data.owner_id))) {
                await (supabase
                    .from('properties')
                    .update({ views_count: (data.views_count || 0) + 1 } as any)
                    .eq('id', id) as any)
            }

            return data as Property
        } catch (e: any) {
            error.value = e
            console.error('Error fetching property:', e)
            console.error('Details:', JSON.stringify(e, null, 2))
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
            if (role.value === 'agente' && user.value) {
                property.agent_id = user.value.id
            }

            const { data, error: insertError } = await supabase
                .from('properties')
                .insert(property as any)
                .select()
                .single() as any

            if (insertError) throw insertError

            return data as Property
        } catch (e: any) {
            error.value = e
            console.error('Error creating property:', e)
            console.error('Error details:', JSON.stringify(e, null, 2))
            throw e
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
            const { data, error: updateError } = await supabase
                .from('properties')
                .update(updates as any)
                .eq('id', id)
                .select()
                .single() as any

            if (updateError) throw updateError

            return data as Property
        } catch (e: any) {
            error.value = e
            console.error('Error updating property:', e)
            console.error('Details:', JSON.stringify(e, null, 2))
            throw e
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
        } catch (e: any) {
            error.value = e
            console.error('Error deleting property:', e)
            console.error('Details:', JSON.stringify(e, null, 2))
            throw e
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

                const { data, error: uploadError } = await supabase.storage
                    .from('properties')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                const { data: urlData } = supabase.storage
                    .from('properties')
                    .getPublicUrl(fileName)

                uploadedUrls.push(urlData.publicUrl)
            }

            return uploadedUrls
        } catch (e: any) {
            console.error('Error uploading images:', e)
            throw e
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