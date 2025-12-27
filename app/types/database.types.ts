// app/types/database.types.ts
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'admin' | 'agente' | 'inquilino' | 'propietario'
                    phone: string | null
                    avatar_url: string | null
                    address: string | null
                    dni: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'admin' | 'agente' | 'inquilino' | 'propietario'
                    phone?: string | null
                    avatar_url?: string | null
                    address?: string | null
                    dni?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'admin' | 'agente' | 'inquilino' | 'propietario'
                    phone?: string | null
                    avatar_url?: string | null
                    address?: string | null
                    dni?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            agents: {
                Row: {
                    id: string
                    user_id: string
                    license_number: string | null
                    commission_rate: number
                    specialization: string[] | null
                    bio: string | null
                    total_sales: number
                    total_rentals: number
                    rating: number
                    is_verified: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    license_number?: string | null
                    commission_rate?: number
                    specialization?: string[] | null
                    bio?: string | null
                    total_sales?: number
                    total_rentals?: number
                    rating?: number
                    is_verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    license_number?: string | null
                    commission_rate?: number
                    specialization?: string[] | null
                    bio?: string | null
                    total_sales?: number
                    total_rentals?: number
                    rating?: number
                    is_verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            properties: {
                Row: {
                    id: string
                    title: string

                    slug: string | null
                    description: string | null
                    property_type: 'departamento' | 'casa' | 'ph' | 'local' | 'oficina' | 'terreno' | 'cochera'
                    operation_type: 'venta' | 'alquiler' | 'alquiler_temporal'
                    rental_period: string | null
                    status: 'disponible' | 'reservada' | 'alquilada' | 'vendida' | 'en_mantenimiento'
                    address: string
                    city: string
                    state: string | null
                    country: string
                    zip_code: string | null
                    latitude: number | null
                    longitude: number | null
                    bedrooms: number
                    bathrooms: number
                    area_m2: number | null

                    built_area_m2: number | null
                    semi_covered_area_m2: number | null
                    land_area_m2: number | null
                    floor_number: number | null
                    total_floors: number | null
                    parking_spaces: number
                    year_built: number | null
                    price: number
                    currency: string
                    expenses: number
                    amenities: string[] | null
                    images: string[] | null
                    video_url: string | null
                    virtual_tour_url: string | null
                    agent_id: string | null
                    owner_id: string | null
                    views_count: number
                    is_featured: boolean
                    is_published: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string

                    slug?: string | null
                    description?: string | null
                    property_type: 'departamento' | 'casa' | 'ph' | 'local' | 'oficina' | 'terreno' | 'cochera'
                    operation_type: 'venta' | 'alquiler' | 'alquiler_temporal'
                    rental_period?: string | null
                    status?: 'disponible' | 'reservada' | 'alquilada' | 'vendida' | 'en_mantenimiento'
                    address: string
                    city: string
                    state?: string | null
                    country?: string
                    zip_code?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    bedrooms?: number
                    bathrooms?: number
                    area_m2?: number | null
                    built_area_m2?: number | null
                    semi_covered_area_m2?: number | null
                    land_area_m2?: number | null
                    floor_number?: number | null

                    total_floors?: number | null
                    parking_spaces?: number
                    year_built?: number | null
                    price: number
                    currency?: string
                    expenses?: number
                    amenities?: string[] | null
                    images?: string[] | null
                    video_url?: string | null
                    virtual_tour_url?: string | null
                    agent_id?: string | null
                    owner_id?: string | null
                    views_count?: number
                    is_featured?: boolean
                    is_published?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string

                    slug?: string | null
                    description?: string | null
                    property_type?: 'departamento' | 'casa' | 'ph' | 'local' | 'oficina' | 'terreno' | 'cochera'
                    operation_type?: 'venta' | 'alquiler' | 'alquiler_temporal'
                    rental_period?: string | null
                    status?: 'disponible' | 'reservada' | 'alquilada' | 'vendida' | 'en_mantenimiento'
                    address?: string
                    city?: string
                    state?: string | null
                    country?: string
                    zip_code?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    bedrooms?: number
                    bathrooms?: number
                    area_m2?: number | null
                    built_area_m2?: number | null
                    semi_covered_area_m2?: number | null
                    land_area_m2?: number | null
                    floor_number?: number | null

                    total_floors?: number | null
                    parking_spaces?: number
                    year_built?: number | null
                    price?: number
                    currency?: string
                    expenses?: number
                    amenities?: string[] | null
                    images?: string[] | null
                    video_url?: string | null
                    virtual_tour_url?: string | null
                    agent_id?: string | null
                    owner_id?: string | null
                    views_count?: number
                    is_featured?: boolean
                    is_published?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            contracts: {
                Row: {
                    id: string
                    contract_number: string | null
                    property_id: string
                    tenant_id: string
                    agent_id: string | null
                    start_date: string
                    end_date: string
                    signing_date: string | null
                    monthly_rent: number
                    deposit: number
                    currency: string
                    payment_day: number
                    adjustment_frequency: number
                    adjustment_index: string
                    status: 'pendiente' | 'activo' | 'vencido' | 'cancelado'
                    document_url: string | null
                    notes: string | null
                    guarantor_name: string | null
                    guarantor_phone: string | null
                    guarantor_dni: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    contract_number?: string | null
                    property_id: string
                    tenant_id: string
                    agent_id?: string | null
                    start_date: string
                    end_date: string
                    signing_date?: string | null
                    monthly_rent: number
                    deposit?: number
                    currency?: string
                    payment_day?: number
                    adjustment_frequency?: number
                    adjustment_index?: string
                    status?: 'pendiente' | 'activo' | 'vencido' | 'cancelado'
                    document_url?: string | null
                    notes?: string | null
                    guarantor_name?: string | null
                    guarantor_phone?: string | null
                    guarantor_dni?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    contract_number?: string | null
                    property_id?: string
                    tenant_id?: string
                    agent_id?: string | null
                    start_date?: string
                    end_date?: string
                    signing_date?: string | null
                    monthly_rent?: number
                    deposit?: number
                    currency?: string
                    payment_day?: number
                    adjustment_frequency?: number
                    adjustment_index?: string
                    status?: 'pendiente' | 'activo' | 'vencido' | 'cancelado'
                    document_url?: string | null
                    notes?: string | null
                    guarantor_name?: string | null
                    guarantor_phone?: string | null
                    guarantor_dni?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            payments: {
                Row: {
                    id: string
                    contract_id: string
                    tenant_id: string
                    amount: number
                    currency: string
                    due_date: string
                    payment_date: string | null
                    period_month: number
                    period_year: number
                    status: 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
                    payment_method: string | null
                    receipt_url: string | null
                    receipt_number: string | null
                    notes: string | null
                    late_fee: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    contract_id: string
                    tenant_id: string
                    amount: number
                    currency?: string
                    due_date: string
                    payment_date?: string | null
                    period_month: number
                    period_year: number
                    status?: 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
                    payment_method?: string | null
                    receipt_url?: string | null
                    receipt_number?: string | null
                    notes?: string | null
                    late_fee?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    contract_id?: string
                    tenant_id?: string
                    amount?: number
                    currency?: string
                    due_date?: string
                    payment_date?: string | null
                    period_month?: number
                    period_year?: number
                    status?: 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
                    payment_method?: string | null
                    receipt_url?: string | null
                    receipt_number?: string | null
                    notes?: string | null
                    late_fee?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            maintenance_requests: {
                Row: {
                    id: string
                    property_id: string
                    tenant_id: string | null
                    title: string
                    description: string
                    category: string | null
                    priority: 'baja' | 'media' | 'alta' | 'urgente'
                    status: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'
                    assigned_to: string | null
                    assigned_phone: string | null
                    reported_date: string
                    scheduled_date: string | null
                    completed_date: string | null
                    estimated_cost: number | null
                    actual_cost: number | null
                    paid_by: string | null
                    images: string[] | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    tenant_id?: string | null
                    title: string
                    description: string
                    category?: string | null
                    priority?: 'baja' | 'media' | 'alta' | 'urgente'
                    status?: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'
                    assigned_to?: string | null
                    assigned_phone?: string | null
                    reported_date?: string
                    scheduled_date?: string | null
                    completed_date?: string | null
                    estimated_cost?: number | null
                    actual_cost?: number | null
                    paid_by?: string | null
                    images?: string[] | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    tenant_id?: string | null
                    title?: string
                    description?: string
                    category?: string | null
                    priority?: 'baja' | 'media' | 'alta' | 'urgente'
                    status?: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'
                    assigned_to?: string | null
                    assigned_phone?: string | null
                    reported_date?: string
                    scheduled_date?: string | null
                    completed_date?: string | null
                    estimated_cost?: number | null
                    actual_cost?: number | null
                    paid_by?: string | null
                    images?: string[] | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            commissions: {
                Row: {
                    id: string
                    agent_id: string
                    contract_id: string | null
                    property_id: string | null
                    amount: number
                    currency: string
                    percentage: number | null
                    commission_type: string | null
                    description: string | null
                    status: 'pendiente' | 'pagada' | 'cancelada'
                    payment_date: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    agent_id: string
                    contract_id?: string | null
                    property_id?: string | null
                    amount: number
                    currency?: string
                    percentage?: number | null
                    commission_type?: string | null
                    description?: string | null
                    status?: 'pendiente' | 'pagada' | 'cancelada'
                    payment_date?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    agent_id?: string
                    contract_id?: string | null
                    property_id?: string | null
                    amount?: number
                    currency?: string
                    percentage?: number | null
                    commission_type?: string | null
                    description?: string | null
                    status?: 'pendiente' | 'pagada' | 'cancelada'
                    payment_date?: string | null
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    link: string | null
                    is_read: boolean
                    read_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type?: string
                    link?: string | null
                    is_read?: boolean
                    read_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: string
                    link?: string | null
                    is_read?: boolean
                    read_at?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_user_role: {
                Args: Record<string, never>
                Returns: string
            }
        }
        Enums: {
            user_role: 'admin' | 'agente' | 'inquilino' | 'propietario'
            property_type: 'departamento' | 'casa' | 'ph' | 'local' | 'oficina' | 'terreno' | 'cochera'
            operation_type: 'venta' | 'alquiler' | 'alquiler_temporal'
            property_status: 'disponible' | 'reservada' | 'alquilada' | 'vendida' | 'en_mantenimiento'
            contract_status: 'pendiente' | 'activo' | 'vencido' | 'cancelado'
            payment_status: 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
            maintenance_priority: 'baja' | 'media' | 'alta' | 'urgente'
            maintenance_status: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'
        }
    }
}
