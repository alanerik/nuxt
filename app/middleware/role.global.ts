export default defineNuxtRouteMiddleware(async (to) => {
    const user = useSupabaseUser()
    const supabase = useSupabaseClient()
    const { fetchRole, clearRole } = useUserRole()

    // ===== 1. RUTAS PÚBLICAS =====
    const publicPaths = ['/', '/login', '/register', '/confirm', '/reset-password']
    if (publicPaths.some(path => to.path === path || to.path.startsWith(`${path}/`))) {
        return
    }

    // ===== 2. VERIFICAR AUTENTICACIÓN =====
    if (!user.value) {
        return navigateTo('/login', { replace: true })
    }

    // ===== 3. OBTENER ROL (con caché automática) =====
    const userRole = await fetchRole() // ✅ Retorna el rol directamente

    if (!userRole) {
        await supabase.auth.signOut()
        clearRole()
        return navigateTo('/login', { replace: true })
    }

    // ===== 4. VERIFICAR ACCESO POR ROL =====
    const expectedRole = extractRoleFromPath(to.path)

    if (expectedRole && expectedRole !== userRole) {
        return navigateTo(`/${userRole}/dashboard`, { replace: true })
    }
})

function extractRoleFromPath(path: string): string | null {
    const match = path.match(/^\/(admin|inquilino|agente)/)
    return match ? match[1] : null
}