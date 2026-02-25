import type { AppRole } from '~/types/roles'

const ROLE_HOME: Record<AppRole, string> = {
    admin: '/admin/dashboard',
    inquilino: '/inquilino/inicio',
    agente: '/agente/panel',
}

export default defineNuxtRouteMiddleware(async (to) => {
    // Rutas públicas via page meta (no hardcodear aquí)
    if (to.meta.public) return

    const supabase = useSupabaseClient()
    const { role, error: roleError, fetchRole, clearRole } = useUserRole()

    // Preferir sesión local para reducir latencia;
    // usar getUser() si necesitás validación server-side estricta
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    if (!user) {
        return navigateTo('/login', { replace: true })
    }

    // Obtener rol solo si no está en caché
    if (!role.value) {
        await fetchRole(false, user.id)
        if (roleError.value) {
            return navigateTo('/error?code=auth_error', { replace: true })
        }
    }

    if (!role.value) {
        await supabase.auth.signOut()
        clearRole()
        return navigateTo('/login', { replace: true })
    }

    // Rol requerido declarado en la página, no inferido de la URL
    const requiredRole = to.meta.requiredRole as AppRole | undefined
    if (requiredRole && requiredRole !== role.value) {
        return navigateTo(ROLE_HOME[role.value as AppRole] ?? '/login', { replace: true })
    }
})
