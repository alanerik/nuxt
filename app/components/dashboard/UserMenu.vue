<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { role } = useUserRole()
const router = useRouter()
const colorMode = useColorMode()
const toast = useToast()

const loading = ref(false)

const userDisplayName = computed(() => {
  if (!user.value) return 'Usuario'
  return user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'Usuario'
})

const userEmail = computed(() => user.value?.email || '')

const userInitials = computed(() => {
  const name = userDisplayName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    agente: 'Agente',
    inquilino: 'Inquilino'
  }
  return labels[role.value || ''] || 'Usuario'
})

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => colorMode.preference = value ? 'dark' : 'light'
})

const handleLogout = async () => {
  loading.value = true
  
  try {
    await supabase.auth.signOut()
    
    toast.add({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente',
      color: 'success'
    })
    
    await router.push('/login')
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cerrar la sesión',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const items = computed<DropdownMenuItem[][]>(() => [[
  {
    label: userDisplayName.value,
    avatar: {
      text: userInitials.value
    },
    type: 'label'
  }
], [
  {
    label: 'Mi Perfil',
    icon: 'i-lucide-user',
    onSelect: () => {
      router.push(`/${role.value}/perfil`)
    }
  },
  {
    label: 'Configuración',
    icon: 'i-lucide-settings',
    onSelect: () => {
      router.push(`/${role.value}/configuracion`)
    }
  }
], [
  {
    label: isDark.value ? 'Modo Claro' : 'Modo Oscuro',
    icon: isDark.value ? 'i-lucide-sun' : 'i-lucide-moon',
    onSelect: () => {
      isDark.value = !isDark.value
    }
  }
], [
  {
    label: 'Cerrar Sesión',
    icon: 'i-lucide-log-out',
    onSelect: handleLogout
  }
]])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      color="neutral"
      variant="ghost"
      :square="collapsed"
      :class="collapsed ? '' : 'w-full'"
    >
      <UAvatar :text="userInitials" size="sm" />
      <template v-if="!collapsed">
        <div class="flex-1 text-left overflow-hidden">
          <span class="block truncate font-medium text-sm">{{ userDisplayName }}</span>
          <span class="block truncate text-xs text-gray-500 dark:text-gray-400 capitalize">
            {{ roleLabel }}
          </span>
        </div>
        <UIcon name="i-lucide-chevrons-up-down" class="ml-auto size-4 shrink-0 text-muted" />
      </template>
    </UButton>
  </UDropdownMenu>
</template>
