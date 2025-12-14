<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[
  {
    label: 'Inicio',
    icon: 'i-lucide-home',
    to: '/inquilino/dashboard',
    onSelect: () => open.value = false
  },
  {
    label: 'Mi Contrato',
    icon: 'i-lucide-file-text',
    to: '/inquilino/contrato',
    onSelect: () => open.value = false
  },
  {
    label: 'Pagos',
    icon: 'i-lucide-credit-card',
    to: '/inquilino/pagos',
    onSelect: () => open.value = false
  },
  {
    label: 'Mantenimiento',
    icon: 'i-lucide-wrench',
    to: '/inquilino/mantenimiento',
    onSelect: () => open.value = false
  },
  {
    label: 'Documentos',
    icon: 'i-lucide-folder',
    to: '/inquilino/documentos',
    onSelect: () => open.value = false
  }
], [
  {
    label: 'Ayuda',
    icon: 'i-lucide-help-circle',
    to: '/inquilino/ayuda',
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
      id="inquilino"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 p-2" :class="collapsed ? 'justify-center' : ''">
          <UIcon name="i-lucide-home" class="size-6 text-primary" />
          <span v-if="!collapsed" class="font-bold text-lg">Mi Portal</span>
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
