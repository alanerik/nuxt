// app/types/property.types.ts
import type { Database } from './database.types'

// Tipos base de la BD
export type PropertyRow = Database['public']['Tables']['properties']['Row']
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']

// Enums
export type PropertyType =
    | 'departamento'
    | 'casa'
    | 'ph'
    | 'local'
    | 'oficina'
    | 'terreno'
    | 'cochera'

export type OperationType = 'venta' | 'alquiler' | 'alquiler_temporal'

export type PropertyStatus =
    | 'disponible'
    | 'reservada'
    | 'alquilada'
    | 'vendida'
    | 'en_mantenimiento'

// Property con relaciones
export interface Property extends PropertyRow {
    agent?: {
        id: string
        user_id: string
        license_number: string | null
        profiles: {
            full_name: string | null
            phone: string | null
            avatar_url: string | null
        } | null
    } | null
    owner?: {
        id: string
        full_name: string | null
        phone: string | null
        email: string | null
    } | null
}

// Filtros
export interface PropertyFilters {
    search?: string
    property_type?: PropertyType | PropertyType[]
    operation_type?: OperationType
    status?: PropertyStatus | PropertyStatus[]
    min_price?: number
    max_price?: number
    bedrooms?: number
    bathrooms?: number
    city?: string
    agent_id?: string
    is_featured?: boolean
    is_published?: boolean
}

// Sort
export type PropertySortField =
    | 'created_at'
    | 'price'
    | 'area_m2'
    | 'views_count'
    | 'title'

export type SortDirection = 'asc' | 'desc'

export interface PropertySort {
    field: PropertySortField
    direction: SortDirection
}

// Paginación
export interface PropertyPagination {
    page: number
    pageSize: number
    total?: number
}

// Labels
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
    departamento: 'Departamento',
    casa: 'Casa',
    ph: 'PH',
    local: 'Local Comercial',
    oficina: 'Oficina',
    terreno: 'Terreno',
    cochera: 'Cochera'
}

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
    venta: 'Venta',
    alquiler: 'Alquiler',
    alquiler_temporal: 'Alquiler Temporal'
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
    disponible: 'Disponible',
    reservada: 'Reservada',
    alquilada: 'Alquilada',
    vendida: 'Vendida',
    en_mantenimiento: 'En Mantenimiento'
}

export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
    disponible: 'success',
    reservada: 'warning',
    alquilada: 'primary',
    vendida: 'neutral',
    en_mantenimiento: 'error'
}

export const COMMON_AMENITIES = [
    'Aire Acondicionado',
    'Calefacción',
    'Balcón',
    'Terraza',
    'Parrilla',
    'Piscina',
    'Gimnasio',
    'Seguridad 24hs',
    'Portero',
    'Ascensor',
    'Cochera',
    'Baulera',
    'Jardín',
    'Laundry',
    'Pet Friendly'
] as const

export type Amenity = typeof COMMON_AMENITIES[number]
