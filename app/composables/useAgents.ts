// app/composables/useAgents.ts
import type {
    Agent,
    AgentWithDetails,
    AgentStats,
    AgentFilters
} from '~/types/agent.types'

export function useAgents() {
    const supabase = useSupabaseClient()

    /**
     * Obtener lista de agentes con filtros opcionales
     */
    const fetchAgents = async (filters: AgentFilters = {}) => {
        try {
            // Obtener agentes
            let query = supabase
                .from('agents')
                .select('*')
                .order('created_at', { ascending: false })

            // Filtro por verificación
            if (filters.verified !== undefined) {
                query = query.eq('is_verified', filters.verified)
            }

            // Filtro por especialización
            if (filters.specialization) {
                query = query.contains('specialization', [filters.specialization])
            }

            // Límite y offset
            if (filters.limit) {
                query = query.limit(filters.limit)
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
            }

            const { data: agentsData, error } = await query

            if (error) {
                console.error('Supabase error:', error)
                return { data: [], count: 0 }
            }

            // Obtener user_ids de los agentes
            const userIds = (agentsData || []).map((a: any) => a.user_id)

            // Obtener perfiles por separado
            let profilesMap: Record<string, any> = {}
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, phone, avatar_url, is_active')
                    .in('id', userIds)

                profilesMap = (profiles || []).reduce((acc: any, p: any) => {
                    acc[p.id] = p
                    return acc
                }, {})
            }

            // Combinar agentes con perfiles
            let agents: Agent[] = (agentsData || []).map((agent: any) => ({
                ...agent,
                profile: profilesMap[agent.user_id] || null
            }))

            // Filtrar por búsqueda en cliente
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                agents = agents.filter(agent =>
                    agent.profile?.full_name?.toLowerCase().includes(searchLower) ||
                    agent.profile?.email?.toLowerCase().includes(searchLower) ||
                    agent.license_number?.toLowerCase().includes(searchLower)
                )
            }

            // Solo mostrar agentes con perfil activo
            agents = agents.filter(agent => agent.profile?.is_active !== false)

            return {
                data: agents,
                count: agents.length
            }
        } catch (error) {
            console.error('Error fetching agents:', error)
            return { data: [], count: 0 }
        }
    }

    /**
     * Obtener un agente por ID con todos sus detalles
     */
    const getAgentById = async (id: string): Promise<AgentWithDetails | null> => {
        try {
            // Validar que el ID sea un UUID válido
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(id)) {
                return null
            }

            const { data: agent, error: agentError } = await supabase
                .from('agents')
                .select('*')
                .eq('id', id)
                .single()

            if (agentError) {
                console.error('Agent fetch error:', agentError)
                return null
            }
            if (!agent) return null

            // Obtener perfil por separado
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, email, full_name, phone, avatar_url, address, dni, is_active')
                .eq('id', (agent as any).user_id)
                .single()

            // Contar propiedades asignadas
            const { count: propertiesCount } = await supabase
                .from('properties')
                .select('id', { count: 'exact', head: true })
                .eq('agent_id', id)

            // Contar contratos activos
            const { count: contractsCount } = await supabase
                .from('contracts')
                .select('id', { count: 'exact', head: true })
                .eq('agent_id', id)
                .eq('status', 'activo')

            // Sumar comisiones pendientes
            const { data: pendingCommissions } = await supabase
                .from('commissions')
                .select('amount')
                .eq('agent_id', id)
                .eq('status', 'pendiente')

            const totalPending = (pendingCommissions || []).reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

            return {
                ...(agent as any),
                profile: profile || null,
                properties_count: propertiesCount || 0,
                active_contracts_count: contractsCount || 0,
                pending_commissions: totalPending
            } as AgentWithDetails
        } catch (error) {
            console.error('Error fetching agent:', error)
            return null
        }
    }

    /**
     * Obtener estadísticas de agentes
     */
    const getAgentStats = async (): Promise<AgentStats> => {
        try {
            // Total de agentes
            const { count: total } = await supabase
                .from('agents')
                .select('id', { count: 'exact', head: true })

            // Agentes verificados
            const { count: verified } = await supabase
                .from('agents')
                .select('id', { count: 'exact', head: true })
                .eq('is_verified', true)

            // Totales de ventas y alquileres
            const { data: totals } = await supabase
                .from('agents')
                .select('total_sales, total_rentals')

            const totalSales = (totals || []).reduce((sum: number, a: any) => sum + (a.total_sales || 0), 0)
            const totalRentals = (totals || []).reduce((sum: number, a: any) => sum + (a.total_rentals || 0), 0)

            return {
                total: total || 0,
                verified: verified || 0,
                totalSales,
                totalRentals
            }
        } catch (error) {
            console.error('Error fetching agent stats:', error)
            return {
                total: 0,
                verified: 0,
                totalSales: 0,
                totalRentals: 0
            }
        }
    }

    /**
     * Crear nuevo agente
     */
    const createAgent = async (data: {
        email: string
        full_name: string
        phone?: string
        license_number?: string
        commission_rate?: number
        specialization?: string[]
        bio?: string
    }) => {
        try {
            // Crear usuario en auth
            const tempPassword = Math.random().toString(36).slice(-12)

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: tempPassword,
                options: {
                    data: {
                        full_name: data.full_name,
                        role: 'agente'
                    }
                }
            })

            if (authError) throw authError

            if (authData.user) {
                // Actualizar perfil
                await supabase
                    .from('profiles')
                    .update({
                        full_name: data.full_name,
                        phone: data.phone || null,
                        role: 'agente'
                    } as any)
                    .eq('id', authData.user.id)

                // Crear registro de agente
                const { error: agentError } = await supabase
                    .from('agents')
                    .insert({
                        user_id: authData.user.id,
                        license_number: data.license_number || null,
                        commission_rate: data.commission_rate || 5,
                        specialization: data.specialization || [],
                        bio: data.bio || null
                    } as any)

                if (agentError) throw agentError
            }

            return { success: true, userId: authData.user?.id }
        } catch (error) {
            console.error('Error creating agent:', error)
            throw error
        }
    }

    /**
     * Actualizar datos de un agente
     */
    const updateAgent = async (id: string, data: {
        license_number?: string
        commission_rate?: number
        specialization?: string[]
        bio?: string
        is_verified?: boolean
    }) => {
        try {
            const { error } = await supabase
                .from('agents')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                } as any)
                .eq('id', id)

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Error updating agent:', error)
            throw error
        }
    }

    /**
     * Verificar/desverificar un agente
     */
    const toggleAgentVerification = async (id: string, verified: boolean) => {
        try {
            const { error } = await supabase
                .from('agents')
                .update({
                    is_verified: verified,
                    updated_at: new Date().toISOString()
                } as any)
                .eq('id', id)

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Error toggling verification:', error)
            throw error
        }
    }

    /**
     * Obtener propiedades asignadas a un agente
     */
    const getAgentProperties = async (agentId: string) => {
        try {
            // Validar UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(agentId)) {
                return []
            }

            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('agent_id', agentId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Properties fetch error:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('Error fetching agent properties:', error)
            return []
        }
    }

    /**
     * Obtener comisiones de un agente
     */
    const getAgentCommissions = async (agentId: string) => {
        try {
            // Validar UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(agentId)) {
                return []
            }

            const { data, error } = await supabase
                .from('commissions')
                .select('*')
                .eq('agent_id', agentId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Commissions fetch error:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('Error fetching agent commissions:', error)
            return []
        }
    }

    return {
        fetchAgents,
        getAgentById,
        getAgentStats,
        createAgent,
        updateAgent,
        toggleAgentVerification,
        getAgentProperties,
        getAgentCommissions
    }
}
