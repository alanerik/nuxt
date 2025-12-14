// middleware/role.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
    const user = useSupabaseUser()
    const supabase = useSupabaseClient()

    // Páginas públicas - no verificar rol
    const publicRoutes = ['/', '/login', '/confirm']
    if (publicRoutes.includes(to.path)) {
        return
    }

    // Si no hay usuario, el middleware de supabase ya redirige a /login
    if (!user.value) {
        return
    }

    // Obtener el rol del usuario
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.value.id)
        .single()

    // Si no hay perfil, cerrar sesión
    if (!profile) {
        await supabase.auth.signOut()
        return navigateTo('/login')
    }

    const userRole = profile.role

    // Verificar que el usuario tenga el rol correcto para la ruta
    if (to.path.startsWith('/admin') && userRole !== 'admin') {
        return navigateTo(`/${userRole}/dashboard`)
    }

    if (to.path.startsWith('/inquilino') && userRole !== 'inquilino') {
        return navigateTo(`/${userRole}/dashboard`)
    }

    if (to.path.startsWith('/agente') && userRole !== 'agente') {
        return navigateTo(`/${userRole}/dashboard`)
    }
})

// composables/useUserRole.ts
export const useUserRole = () => {
    const user = useSupabaseUser()
    const supabase = useSupabaseClient()

    const role = ref<'admin' | 'inquilino' | 'agente' | null>(null)
    const profile = ref<any>(null)
    const loading = ref(true)

    const fetchRole = async () => {
        if (!user.value) {
            role.value = null
            profile.value = null
            loading.value = false
            return
        }

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.value.id)
            .single()

        role.value = data?.role || null
        profile.value = data
        loading.value = false
    }

    // Observar cambios en el usuario
    watch(user, fetchRole, { immediate: true })

    const isAdmin = computed(() => role.value === 'admin')
    const isInquilino = computed(() => role.value === 'inquilino')
    const isAgente = computed(() => role.value === 'agente')

    return {
        role,
        profile,
        loading,
        isAdmin,
        isInquilino,
        isAgente,
        refresh: fetchRole
    }
}