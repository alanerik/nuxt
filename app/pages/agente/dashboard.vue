<script setup lang="ts">
definePageMeta({
  layout: 'agente'
})

const { isNotificationsSlideoverOpen } = useDashboard()

// Demo stats for agent
const stats = ref([
  {
    title: 'Propiedades Asignadas',
    value: '24',
    change: '+2',
    changeType: 'positive' as const,
    icon: 'i-lucide-building-2'
  },
  {
    title: 'Leads Activos',
    value: '18',
    change: '+5',
    changeType: 'positive' as const,
    icon: 'i-lucide-user-plus'
  },
  {
    title: 'Comisiones del Mes',
    value: '$3,450',
    change: '+12%',
    changeType: 'positive' as const,
    icon: 'i-lucide-wallet'
  },
  {
    title: 'Visitas Programadas',
    value: '8',
    change: 'Esta semana',
    changeType: 'neutral' as const,
    icon: 'i-lucide-calendar'
  }
])

// Upcoming visits
const visits = ref([
  { id: 1, client: 'María García', property: 'Av. Córdoba 1234', date: 'Hoy, 15:00' },
  { id: 2, client: 'Carlos López', property: 'Calle Florida 567', date: 'Hoy, 17:30' },
  { id: 3, client: 'Ana Martínez', property: 'Santa Fe 890', date: 'Mañana, 10:00' },
  { id: 4, client: 'Juan Pérez', property: 'Callao 432', date: 'Mañana, 14:00' }
])

// Featured properties
const properties = ref([
  { id: 1, name: 'Dpto 3 amb en Palermo', price: '$120,000', type: 'Venta', status: 'Disponible' },
  { id: 2, name: 'Local en Microcentro', price: '$2,500/mes', type: 'Alquiler', status: 'Disponible' },
  { id: 3, name: 'Casa en Belgrano', price: '$280,000', type: 'Venta', status: 'Reservado' }
])
</script>

<template>
  <UDashboardPanel id="agente-home">
    <template #header>
      <UDashboardNavbar title="Mi Dashboard" :ui="{ right: 'gap-3' }">
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

          <UButton icon="i-lucide-plus" size="md" class="rounded-full">
            Nuevo Cliente
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
                  :class="{
                    'text-success': stat.changeType === 'positive',
                    'text-error': stat.changeType === 'negative',
                    'text-muted': stat.changeType === 'neutral'
                  }"
                >
                  {{ stat.change }}
                </p>
              </div>
              <div class="p-3 rounded-full bg-primary/10">
                <UIcon :name="stat.icon" class="size-6 text-primary" />
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Upcoming Visits -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">Próximas Visitas</h3>
                <UButton variant="ghost" size="sm" to="/agente/calendario">Ver calendario</UButton>
              </div>
            </template>
            <div class="divide-y divide-default">
              <div 
                v-for="visit in visits" 
                :key="visit.id"
                class="py-3 flex items-center justify-between"
              >
                <div>
                  <p class="font-medium text-sm">{{ visit.client }}</p>
                  <p class="text-sm text-muted">{{ visit.property }}</p>
                </div>
                <UBadge variant="soft">{{ visit.date }}</UBadge>
              </div>
            </div>
          </UCard>

          <!-- Featured Properties -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">Propiedades Destacadas</h3>
                <UButton variant="ghost" size="sm" to="/agente/propiedades">Ver todas</UButton>
              </div>
            </template>
            <div class="divide-y divide-default">
              <div 
                v-for="property in properties" 
                :key="property.id"
                class="py-3 flex items-center justify-between"
              >
                <div>
                  <p class="font-medium text-sm">{{ property.name }}</p>
                  <p class="text-sm text-muted">{{ property.price }} • {{ property.type }}</p>
                </div>
                <UBadge 
                  :color="property.status === 'Disponible' ? 'success' : 'warning'"
                  variant="soft"
                >
                  {{ property.status }}
                </UBadge>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
