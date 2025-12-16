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

    // Verificar si es admin
    const isAdmin = computed(() => role.value === 'admin')
    const isAgente = computed(() => role.value === 'agente')
    const isInquilino = computed(() => role.value === 'inquilino')

    // Cargar el rol del usuario
    const fetchRole = async (force = false) => {
        if (!user.value) {
            role.value = null
            return
        }

        // Si ya tenemos el rol y no es forzado, no volver a cargar
        if (role.value && !force) {
            return
        }

        loading.value = true
        error.value = null

        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.value.id)
                .single()

            if (profileError) throw profileError

            if (!profile?.role) {
                throw new Error('No se encontró el rol del usuario')
            }

            role.value = profile.role
        } catch (err: any) {
            console.error('Error fetching user role:', err)
            error.value = err
            role.value = null
        } finally {
            loading.value = false
        }
    }

    // Limpiar el rol cuando el usuario cambia
    watch(user, (newUser, oldUser) => {
        if (oldUser?.id && oldUser.id !== newUser?.id) {
            role.value = null
        }

        if (!newUser) {
            role.value = null
        } else if (newUser && !role.value) {
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
        fetchRole
    }
}

