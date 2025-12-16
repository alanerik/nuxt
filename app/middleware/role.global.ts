// middleware/role.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
    const user = useSupabaseUser()
    const supabase = useSupabaseClient()
    const { role, fetchRole, clearRole } = useUserRole()

    // ===== 1. RUTAS PÚBLICAS =====
    const publicRoutes = ['/', '/login', '/register', '/confirm', '/reset-password']
    const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

    if (isPublicRoute) {
        return
    }

    // ===== 2. VERIFICAR AUTENTICACIÓN =====
    if (!user.value) {
        console.warn('No user found, redirecting to /login')
        return navigateTo('/login')
    }

    // ===== 3. OBTENER ROL (usando el composable con caché) =====
    const userRole = await fetchRole()

    if (!userRole) {
        console.error('No role found for user, signing out')
        await supabase.auth.signOut()
        clearRole()
        return navigateTo('/login')
    }

    // ===== 4. VERIFICAR ACCESO POR ROL =====
    const roleFromPath = extractRoleFromPath(to.path)

    if (roleFromPath && roleFromPath !== userRole) {
        console.warn(`Access denied: User role=${userRole}, Attempted path role=${roleFromPath}`)

        // Redirigir al dashboard del rol correcto
        return navigateTo(`/${userRole}/dashboard`)
    }

    // ===== 5. PREVENIR ACCESO A RUTAS DE OTROS ROLES =====
    if (!roleFromPath) {
        const protectedPrefixes = ['admin', 'inquilino', 'agente']
        const hasRolePrefix = protectedPrefixes.some(prefix => to.path.includes(`/${prefix}/`))

        if (hasRolePrefix) {
            console.warn(`Attempted access to role-specific path without proper prefix: ${to.path}`)
            return navigateTo(`/${userRole}/dashboard`)
        }
    }
})

// ===== HELPER FUNCTIONS =====

/**
 * Extrae el rol de la ruta (ej: /admin/dashboard -> 'admin')
 */
function extractRoleFromPath(path: string): string | null {
    const validRoles = ['admin', 'inquilino', 'agente']

    for (const role of validRoles) {
        if (path.startsWith(`/${role}`)) {
            return role
        }
    }

    return null
}