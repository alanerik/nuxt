<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const open = ref(false)

const links = [[
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/agente/dashboard',
    onSelect: () => open.value = false
  },
  {
    label: 'Mis Propiedades',
    icon: 'i-lucide-building-2',
    to: '/agente/propiedades',
    onSelect: () => open.value = false
  },
  {
    label: 'Clientes',
    icon: 'i-lucide-users',
    to: '/agente/clientes',
    onSelect: () => open.value = false
  },
  {
    label: 'Comisiones',
    icon: 'i-lucide-wallet',
    to: '/agente/comisiones',
    onSelect: () => open.value = false
  },
  {
    label: 'Calendario',
    icon: 'i-lucide-calendar',
    to: '/agente/calendario',
    onSelect: () => open.value = false
  }
], [
  {
    label: 'Mi Perfil',
    icon: 'i-lucide-user',
    to: '/agente/perfil',
    onSelect: () => open.value = false
  }
]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Ir a',
  items: links.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="agente"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 p-2" :class="collapsed ? 'justify-center' : ''">
          <UIcon name="i-lucide-briefcase" class="size-6 text-primary" />
          <span v-if="!collapsed" class="font-bold text-lg">Portal Agente</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <DashboardUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <DashboardNotificationsSlideover />
  </UDashboardGroup>
</template>
