<!-- app/pages/confirm.vue - Página de confirmación OAuth -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <UCard class="max-w-md w-full">
      <div class="text-center space-y-4">
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        </div>
        <div>
          <h2 class="text-xl font-semibold">Verificando sesión...</h2>
          <p class="text-gray-500 mt-2">Un momento por favor</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const redirectInfo = useSupabaseCookieRedirect()

// Esperar a que el usuario esté autenticado
watch(user, async () => {
  if (user.value) {
    // Obtener el rol del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .single()

    if (profile?.role) {
      // Obtener la ruta guardada o ir al dashboard del rol
      const savedPath = redirectInfo.pluck()
      const defaultPath = `/${profile.role}/dashboard`
      
      // Si hay una ruta guardada y corresponde al rol, usarla
      if (savedPath && savedPath.startsWith(`/${profile.role}`)) {
        return navigateTo(savedPath)
      }
      
      return navigateTo(defaultPath)
    }
    
    // Si no tiene perfil, redirigir a login
    await supabase.auth.signOut()
    return navigateTo('/login')
  }
}, { immediate: true })
</script>
