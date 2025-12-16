// middleware/role.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
    const user = useSupabaseUser()
    const supabase = useSupabaseClient()

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

    // ===== 3. OBTENER ROL (CON CACHÉ) =====
    const userRole = await getUserRole(user.value.id, supabase)

    if (!userRole) {
        console.error('No role found for user, signing out')
        await supabase.auth.signOut()
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
    // Si la ruta no tiene prefijo de rol, verificar que no sea una ruta protegida
    if (!roleFromPath) {
        const protectedPrefixes = ['admin', 'inquilino', 'agente']
        const hasRolePrefix = protectedPrefixes.some(prefix => to.path.includes(`/${prefix}/`))

        if (hasRolePrefix) {
            console.warn(`Attempted access to role-specific path without proper prefix: ${to.path}`)
            return navigateTo(`/${userRole}/dashboard`)
        }
    }
})

// ===== HELPERS =====

// Caché simple del rol (se limpia cuando cambia el usuario)
const roleCache = new Map<string, { role: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Obtiene el rol del usuario con caché
 */
async function getUserRole(userId: string, supabase: any): Promise<string | null> {
    // Verificar caché
    const cached = roleCache.get(userId)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.role
    }

    // Consultar a Supabase
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        if (error) throw error

        if (!profile?.role) {
            throw new Error('No role found in profile')
        }

        // Guardar en caché
        roleCache.set(userId, {
            role: profile.role,
            timestamp: now
        })

        return profile.role
    } catch (error) {
        console.error('Error fetching user role:', error)

        // Limpiar caché del usuario
        roleCache.delete(userId)

        return null
    }
}

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

/**
 * Limpia el caché cuando cambia el usuario
 */
if (import.meta.client) {
    const user = useSupabaseUser()

    watch(user, (newUser, oldUser) => {
        // Si cambió el usuario, limpiar caché del usuario anterior
        if (oldUser?.id && oldUser.id !== newUser?.id) {
            roleCache.delete(oldUser.id)
        }

        // Si se cerró sesión, limpiar todo el caché
        if (!newUser) {
            roleCache.clear()
        }
    })
}