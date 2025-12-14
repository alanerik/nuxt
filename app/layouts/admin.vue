<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const open = ref(false)

const links = [[
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/admin/dashboard',
    onSelect: () => open.value = false
  },
  {
    label: 'Propiedades',
    icon: 'i-lucide-building-2',
    to: '/admin/propiedades',
    onSelect: () => open.value = false
  },
  {
    label: 'Agentes',
    icon: 'i-lucide-users',
    to: '/admin/agentes',
    onSelect: () => open.value = false
  },
  {
    label: 'Inquilinos',
    icon: 'i-lucide-user-check',
    to: '/admin/inquilinos',
    onSelect: () => open.value = false
  },
  {
    label: 'Contratos',
    icon: 'i-lucide-file-text',
    to: '/admin/contratos',
    onSelect: () => open.value = false
  },
  {
    label: 'Pagos',
    icon: 'i-lucide-credit-card',
    to: '/admin/pagos',
    onSelect: () => open.value = false
  },
  {
    label: 'Reportes',
    icon: 'i-lucide-bar-chart-3',
    to: '/admin/reportes',
    onSelect: () => open.value = false
  }
], [
  {
    label: 'Configuración',
    icon: 'i-lucide-settings',
    to: '/admin/configuracion',
    onSelect: () => open.value = false
  }
]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Ir a',
  items: links.flat()
}, {
  id: 'code',
  label: 'Código',
  items: [{
    id: 'source',
    label: 'Ver código fuente',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="admin"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 p-2" :class="collapsed ? 'justify-center' : ''">
          <UIcon name="i-lucide-building" class="size-6 text-primary" />
          <span v-if="!collapsed" class="font-bold text-lg">Admin Panel</span>
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
