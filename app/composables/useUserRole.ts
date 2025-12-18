// composables/useUserRole.ts
export const useUserRole = () => {
    const user = useSupabaseUser()
    const supabase = useSupabaseClient()

    const role = useState<string | null>('user-role', () => null)
    const loading = useState<boolean>('user-role-loading', () => false)
    const error = useState<Error | null>('user-role-error', () => null)

    // Verificar si el usuario tiene un rol específico
    const hasRole = (requiredRole: string | string[]) => {
        if (!role.value) return false

        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(role.value)
        }

        return role.value === requiredRole
    }

    // Computed helpers
    const isAdmin = computed(() => role.value === 'admin')
    const isAgente = computed(() => role.value === 'agente')
    const isInquilino = computed(() => role.value === 'inquilino')

    // Cargar el rol del usuario
    const fetchRole = async (force = false): Promise<string | null> => {
        if (!user.value?.id) {
            role.value = null
            return null
        }

        // Si ya tenemos el rol y no es forzado, retornar caché
        if (role.value && !force) {
            return role.value
        }

        loading.value = true
        error.value = null

        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.value.id)
                .single() as any

            if (profileError) throw profileError

            if (!profile?.role) {
                throw new Error('No se encontró el rol del usuario')
            }

            role.value = profile.role
            return profile.role
        } catch (err: any) {
            console.error('Error fetching user role:', err)
            error.value = err
            role.value = null
            return null
        } finally {
            loading.value = false
        }
    }

    // Limpiar el rol
    const clearRole = () => {
        role.value = null
        error.value = null
    }

    // Limpiar y recargar cuando el usuario cambia
    watch(user, (newUser, oldUser) => {
        // Si cambió de usuario o se deslogueó
        if (oldUser?.id !== newUser?.id) {
            clearRole()
        }

        // Si hay usuario nuevo sin rol, cargar
        if (newUser && !role.value) {
            fetchRole()
        }
    }, { immediate: true })

    return {
        role: readonly(role),
        loading: readonly(loading),
        error: readonly(error),
        hasRole,
        isAdmin,
        isAgente,
        isInquilino,
        fetchRole,
        clearRole
    }
}

