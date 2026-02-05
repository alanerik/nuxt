// app/composables/usePropertyFilters.ts
import type {
    PropertyFilters,
    PropertySort,
    PropertyPagination,
    PropertyType,
    OperationType,
    PropertyStatus
} from '~/types/property.types'

export const usePropertyFilters = () => {
    const route = useRoute()
    const router = useRouter()

    // Estado reactivo de filtros
    const filters = ref<PropertyFilters>({
        search: '',
        property_type: undefined,
        operation_type: undefined,
        status: undefined,
        min_price: undefined,
        max_price: undefined,
        bedrooms: undefined,
        bathrooms: undefined,
        city: '',
        agent_id: undefined,
        is_featured: undefined,
        is_published: undefined
    })

    // Estado de ordenamiento
    const sort = ref<PropertySort>({
        field: 'created_at',
        direction: 'desc'
    })

    // Estado de paginación
    const pagination = ref<PropertyPagination>({
        page: 1,
        pageSize: 12,
        total: 0
    })

    /**
     * Inicializa filtros desde query params de la URL
     */
    const initFromQuery = () => {
        const query = route.query

        if (query.search) filters.value.search = String(query.search)
        if (query.type) filters.value.property_type = query.type as PropertyType
        if (query.operation) filters.value.operation_type = query.operation as OperationType
        if (query.status) filters.value.status = query.status as PropertyStatus
        if (query.min_price) filters.value.min_price = Number(query.min_price)
        if (query.max_price) filters.value.max_price = Number(query.max_price)
        if (query.bedrooms) filters.value.bedrooms = Number(query.bedrooms)
        if (query.bathrooms) filters.value.bathrooms = Number(query.bathrooms)
        if (query.city) filters.value.city = String(query.city)
        if (query.sort) sort.value.field = query.sort as string
        if (query.direction) sort.value.direction = query.direction as 'asc' | 'desc'
        if (query.page) pagination.value.page = Number(query.page)
    }

    /**
     * Sincroniza filtros con query params de la URL
     */
    const syncToQuery = () => {
        const query: Record<string, string> = {}

        if (filters.value.search) query.search = filters.value.search
        if (filters.value.property_type) query.type = filters.value.property_type
        if (filters.value.operation_type) query.operation = filters.value.operation_type
        if (filters.value.status) query.status = filters.value.status
        if (filters.value.min_price) query.min_price = String(filters.value.min_price)
        if (filters.value.max_price) query.max_price = String(filters.value.max_price)
        if (filters.value.bedrooms) query.bedrooms = String(filters.value.bedrooms)
        if (filters.value.bathrooms) query.bathrooms = String(filters.value.bathrooms)
        if (filters.value.city) query.city = filters.value.city
        if (sort.value.field !== 'created_at') query.sort = sort.value.field
        if (sort.value.direction !== 'desc') query.direction = sort.value.direction
        if (pagination.value.page > 1) query.page = String(pagination.value.page)

        router.replace({ query })
    }

    /**
     * Actualiza un filtro específico
     */
    const updateFilter = <K extends keyof PropertyFilters>(
        key: K,
        value: PropertyFilters[K]
    ) => {
        filters.value[key] = value
        pagination.value.page = 1 // Reset page on filter change
        syncToQuery()
    }

    /**
     * Actualiza múltiples filtros
     */
    const updateFilters = (newFilters: Partial<PropertyFilters>) => {
        filters.value = { ...filters.value, ...newFilters }
        pagination.value.page = 1
        syncToQuery()
    }

    /**
     * Limpia todos los filtros
     */
    const clearFilters = () => {
        filters.value = {
            search: '',
            property_type: undefined,
            operation_type: undefined,
            status: undefined,
            min_price: undefined,
            max_price: undefined,
            bedrooms: undefined,
            bathrooms: undefined,
            city: '',
            agent_id: undefined,
            is_featured: undefined,
            is_published: undefined
        }
        pagination.value.page = 1
        syncToQuery()
    }

    /**
     * Actualiza el ordenamiento
     */
    const updateSort = (field: PropertySort['field'], direction?: 'asc' | 'desc') => {
        if (sort.value.field === field && !direction) {
            // Toggle direction si es el mismo campo
            sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc'
        } else {
            sort.value.field = field
            sort.value.direction = direction || 'desc'
        }
        syncToQuery()
    }

    /**
     * Actualiza la página
     */
    const updatePage = (page: number) => {
        pagination.value.page = page
        syncToQuery()
    }

    /**
     * Actualiza el total de resultados
     */
    const updateTotal = (total: number) => {
        pagination.value.total = total
    }

    /**
     * Calcula el total de páginas
     */
    const totalPages = computed(() =>
        Math.ceil((pagination.value.total || 0) / pagination.value.pageSize)
    )

    /**
     * Verifica si hay filtros activos
     */
    const hasActiveFilters = computed(() => {
        return Boolean(
            filters.value.search ||
            filters.value.property_type ||
            filters.value.operation_type ||
            filters.value.status ||
            filters.value.min_price ||
            filters.value.max_price ||
            filters.value.bedrooms ||
            filters.value.bathrooms ||
            filters.value.city ||
            filters.value.is_featured
        )
    })

    /**
     * Cuenta filtros activos
     */
    const activeFiltersCount = computed(() => {
        let count = 0
        if (filters.value.search) count++
        if (filters.value.property_type) count++
        if (filters.value.operation_type) count++
        if (filters.value.status) count++
        if (filters.value.min_price || filters.value.max_price) count++
        if (filters.value.bedrooms) count++
        if (filters.value.bathrooms) count++
        if (filters.value.city) count++
        return count
    })

    /**
     * Genera descripción de filtros activos
     */
    const filtersDescription = computed(() => {
        const parts: string[] = []

        if (filters.value.operation_type) {
            parts.push(filters.value.operation_type === 'venta' ? 'Venta' : 'Alquiler')
        }

        if (filters.value.property_type) {
            const labels: Record<string, string> = {
                departamento: 'Departamento',
                casa: 'Casa',
                ph: 'PH',
                local: 'Local',
                oficina: 'Oficina'
            }
            parts.push(labels[filters.value.property_type] || filters.value.property_type)
        }

        if (filters.value.bedrooms) {
            parts.push(`${filters.value.bedrooms}+ dorm`)
        }

        if (filters.value.city) {
            parts.push(filters.value.city)
        }

        if (filters.value.min_price || filters.value.max_price) {
            if (filters.value.min_price && filters.value.max_price) {
                parts.push(`$${filters.value.min_price.toLocaleString()} - $${filters.value.max_price.toLocaleString()}`)
            } else if (filters.value.min_price) {
                parts.push(`Desde $${filters.value.min_price.toLocaleString()}`)
            } else if (filters.value.max_price) {
                parts.push(`Hasta $${filters.value.max_price.toLocaleString()}`)
            }
        }

        return parts.join(' • ')
    })

    // Inicializar desde query params al montar
    onMounted(() => {
        initFromQuery()
    })

    // Watch route changes (navegación back/forward)
    watch(() => route.query, () => {
        initFromQuery()
    })

    return {
        // Estado
        filters: readonly(filters),
        sort: readonly(sort),
        pagination: readonly(pagination),

        // Computeds
        totalPages,
        hasActiveFilters,
        activeFiltersCount,
        filtersDescription,

        // Métodos
        updateFilter,
        updateFilters,
        clearFilters,
        updateSort,
        updatePage,
        updateTotal,
        syncToQuery
    }
}