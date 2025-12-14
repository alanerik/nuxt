<!-- app/pages/login.vue - Página única de login con selector de rol -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold">Iniciar Sesión</h2>
          <p class="text-gray-500">Selecciona tu tipo de acceso</p>
        </div>
      </template>

      <!-- Selector de Rol -->
      <div v-if="!selectedRole" class="space-y-3">
        <UButton
          block
          size="lg"
          color="red"
          @click="selectedRole = 'admin'"
        >
          <template #leading>
            <Icon name="i-heroicons-shield-check" class="w-5 h-5" />
          </template>
          Administrador
        </UButton>

        <UButton
          block
          size="lg"
          color="blue"
          @click="selectedRole = 'inquilino'"
        >
          <template #leading>
            <Icon name="i-heroicons-home" class="w-5 h-5" />
          </template>
          Inquilino
        </UButton>

        <UButton
          block
          size="lg"
          color="green"
          @click="selectedRole = 'agente'"
        >
          <template #leading>
            <Icon name="i-heroicons-briefcase" class="w-5 h-5" />
          </template>
          Agente
        </UButton>
      </div>

      <!-- Formulario de Auth -->
      <div v-else>
        <div class="flex items-center justify-between mb-6">
          <UButton
            variant="ghost"
            icon="i-heroicons-arrow-left"
            @click="selectedRole = null"
          >
            Volver
          </UButton>
          <UBadge :color="roleColor" variant="subtle">
            {{ roleTitle }}
          </UBadge>
        </div>

        <AuthForm :role="selectedRole" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const selectedRole = ref<'admin' | 'inquilino' | 'agente' | null>(null)

const roleTitle = computed(() => {
  const titles = {
    admin: 'Administrador',
    inquilino: 'Inquilino',
    agente: 'Agente'
  }
  return selectedRole.value ? titles[selectedRole.value] : ''
})

const roleColor = computed(() => {
  const colors = {
    admin: 'red',
    inquilino: 'blue',
    agente: 'green'
  }
  return selectedRole.value ? colors[selectedRole.value] : 'gray'
})
</script>

<!-- app/pages/confirm.vue - Página de confirmación OAuth -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <UCard class="max-w-md w-full">
      <div class="text-center space-y-4">
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <Icon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary-500 animate-spin" />
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

<!-- app/pages/index.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <UCard class="max-w-md w-full">
      <template #header>
        <h1 class="text-3xl font-bold text-center">Bienvenido</h1>
      </template>

      <div class="space-y-4">
        <p class="text-center text-gray-600 dark:text-gray-400">
          Sistema de Gestión de Propiedades
        </p>

        <UButton
          to="/login"
          size="lg"
          block
          color="primary"
        >
          Iniciar Sesión
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>

<!-- app/pages/admin/dashboard.vue -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">Dashboard Administrador</h1>
          <p class="text-gray-600 dark:text-gray-400">
            Bienvenido, {{ user?.email }}
          </p>
        </div>
        
        <UButton
          color="red"
          variant="outline"
          @click="handleLogout"
          :loading="loading"
        >
          Cerrar Sesión
        </UButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Icon name="i-heroicons-users" class="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total Inquilinos</p>
              <p class="text-2xl font-bold">24</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Icon name="i-heroicons-home" class="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Propiedades</p>
              <p class="text-2xl font-bold">18</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Icon name="i-heroicons-briefcase" class="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Agentes</p>
              <p class="text-2xl font-bold">7</p>
            </div>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Actividad Reciente</h2>
        </template>
        
        <p class="text-gray-600 dark:text-gray-400">
          Contenido del dashboard aquí...
        </p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()
const loading = ref(false)

const handleLogout = async () => {
  loading.value = true
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<!-- app/pages/inquilino/dashboard.vue -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">Mi Portal</h1>
          <p class="text-gray-600 dark:text-gray-400">
            Bienvenido, {{ user?.email }}
          </p>
        </div>
        
        <UButton
          color="red"
          variant="outline"
          @click="handleLogout"
        >
          Cerrar Sesión
        </UButton>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Mi Propiedad</h2>
        </template>
        
        <p class="text-gray-600 dark:text-gray-400">
          Información de tu propiedad...
        </p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<!-- app/pages/agente/dashboard.vue -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">Portal de Agente</h1>
          <p class="text-gray-600 dark:text-gray-400">
            Bienvenido, {{ user?.email }}
          </p>
        </div>
        
        <UButton
          color="red"
          variant="outline"
          @click="handleLogout"
        >
          Cerrar Sesión
        </UButton>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Mis Propiedades</h2>
        </template>
        
        <p class="text-gray-600 dark:text-gray-400">
          Lista de propiedades asignadas...
        </p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>