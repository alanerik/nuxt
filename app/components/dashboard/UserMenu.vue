<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const colorMode = useColorMode()

const loading = ref(false)

// User display info
const userDisplayName = computed(() => {
  if (!user.value) return 'Usuario'
  return user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'Usuario'
})

const userEmail = computed(() => user.value?.email || '')

const userInitials = computed(() => {
  const name = userDisplayName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

// Theme toggle
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => colorMode.preference = value ? 'dark' : 'light'
})

// Logout handler
const handleLogout = async () => {
  loading.value = true
  try {
    await supabase.auth.signOut()
    router.push('/login')
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
      // TODO: Navigate to profile
    }
  },
  {
    label: 'Configuración',
    icon: 'i-lucide-settings',
    onSelect: () => {
      // TODO: Navigate to settings
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
        <span class="truncate font-medium">{{ userDisplayName }}</span>
        <UIcon name="i-lucide-chevrons-up-down" class="ml-auto size-4 shrink-0 text-muted" />
      </template>
    </UButton>
  </UDropdownMenu>
</template>
