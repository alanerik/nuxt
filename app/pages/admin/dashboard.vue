<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { isNotificationsSlideoverOpen } = useDashboard()

// Demo stats
const stats = ref([
  {
    title: 'Total Propiedades',
    value: '156',
    change: '+12%',
    changeType: 'positive' as const,
    icon: 'i-lucide-building-2'
  },
  {
    title: 'Inquilinos Activos',
    value: '124',
    change: '+5%',
    changeType: 'positive' as const,
    icon: 'i-lucide-users'
  },
  {
    title: 'Ingresos Mensuales',
    value: '$45,231',
    change: '+8.4%',
    changeType: 'positive' as const,
    icon: 'i-lucide-dollar-sign'
  },
  {
    title: 'Tasa de Ocupación',
    value: '94%',
    change: '-2%',
    changeType: 'negative' as const,
    icon: 'i-lucide-percent'
  }
])

// Recent activity
const activities = ref([
  { id: 1, action: 'Nuevo contrato firmado', property: 'Av. Libertador 1234', time: 'Hace 2 horas' },
  { id: 2, action: 'Pago recibido', property: 'Calle Florida 567', time: 'Hace 3 horas' },
  { id: 3, action: 'Solicitud de mantenimiento', property: 'Corrientes 890', time: 'Hace 5 horas' },
  { id: 4, action: 'Nuevo inquilino registrado', property: 'Santa Fe 432', time: 'Hace 1 día' },
  { id: 5, action: 'Contrato renovado', property: 'Callao 789', time: 'Hace 2 días' }
])
</script>

<template>
  <UDashboardPanel id="admin-home">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notificaciones" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UButton icon="i-lucide-plus" size="md" class="rounded-full" to="/admin/propiedades/nueva">
            Nueva Propiedad
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard v-for="stat in stats" :key="stat.title" class="relative overflow-hidden">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">{{ stat.title }}</p>
                <p class="text-2xl font-bold mt-1">{{ stat.value }}</p>
                <p 
                  class="text-xs mt-1"
                  :class="stat.changeType === 'positive' ? 'text-success' : 'text-error'"
                >
                  {{ stat.change }} vs mes anterior
                </p>
              </div>
              <div class="p-3 rounded-full bg-primary/10">
                <UIcon :name="stat.icon" class="size-6 text-primary" />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Quick Actions & Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Quick Actions -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Acciones Rápidas</h3>
            </template>
            <div class="grid grid-cols-2 gap-3">
              <UButton variant="soft" class="justify-start" to="/admin/propiedades">
                <UIcon name="i-lucide-building-2" />
                Propiedades
              </UButton>
              <UButton variant="soft" class="justify-start" to="/admin/contratos">
                <UIcon name="i-lucide-file-text" />
                Contratos
              </UButton>
              <UButton variant="soft" class="justify-start" to="/admin/pagos">
                <UIcon name="i-lucide-credit-card" />
                Pagos
              </UButton>
              <UButton variant="soft" class="justify-start" to="/admin/reportes">
                <UIcon name="i-lucide-bar-chart-3" />
                Reportes
              </UButton>
            </div>
          </UCard>

          <!-- Recent Activity -->
          <UCard class="lg:col-span-2">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">Actividad Reciente</h3>
                <UButton variant="ghost" size="sm">Ver todo</UButton>
              </div>
            </template>
            <div class="divide-y divide-default">
              <div 
                v-for="activity in activities" 
                :key="activity.id"
                class="py-3 flex items-center justify-between"
              >
                <div>
                  <p class="font-medium text-sm">{{ activity.action }}</p>
                  <p class="text-sm text-muted">{{ activity.property }}</p>
                </div>
                <span class="text-xs text-muted">{{ activity.time }}</span>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
