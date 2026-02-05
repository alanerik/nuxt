<script setup lang="ts">
import type { Agent, AgentStats } from '~/types/agent.types'
import type { Property } from '~/types/property.types'

definePageMeta({
  layout: 'agente'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const user = useSupabaseUser()
const { getAgentById, getAgentStats, getAgentProperties } = useAgents()

// State
const loading = ref(true)
const agent = ref<Agent | null>(null)
const agentStats = ref<AgentStats | null>(null)
const properties = ref<Property[]>([])

// Computed stats
const stats = computed(() => [
  {
    title: 'Propiedades Asignadas',
    value: properties.value.length.toString(),
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

// Mock visits for now (would need actual visits table)
const visits = ref([
  { id: 1, client: 'María García', property: 'Av. Córdoba 1234', date: 'Hoy, 15:00' },
  { id: 2, client: 'Carlos López', property: 'Calle Florida 567', date: 'Hoy, 17:30' },
  { id: 3, client: 'Ana Martínez', property: 'Santa Fe 890', date: 'Mañana, 10:00' },
  { id: 4, client: 'Juan Pérez', property: 'Callao 432', date: 'Mañana, 14:00' }
])

const formatPrice = (price: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(price)
}

// Load data
const loadData = async () => {
  loading.value = true
  try {
    if (!user.value?.id) return

    // Get agent info
    const agentData = await getAgentById(user.value.id)
    if (agentData) {
      agent.value = agentData
    }

    // Get agent stats
    const statsData = await getAgentStats()
    agentStats.value = statsData

    // Get agent properties
    const propertiesData = await getAgentProperties(user.value.id)
    properties.value = propertiesData.slice(0, 3) // Show only first 3
  } catch (error) {
    console.error('Error loading agent dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
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

          <UButton icon="i-lucide-plus" label="Nuevo Cliente" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <USkeleton v-for="i in 4" :key="i" class="h-24 w-full rounded-lg" />
          </div>
        </div>

        <!-- Content -->
        <div v-else class="space-y-6">
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

          <!-- Visits & Properties -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Quick Actions -->
            <div class="lg:col-span-1">
              <UCard>
                <template #header>
                  <h3 class="font-semibold">Acciones Rápidas</h3>
                </template>
                <div class="space-y-2">
                  <UButton variant="soft" class="w-full justify-start" to="/agente/calendario">
                    <UIcon name="i-lucide-calendar" />
                    Ver Calendario
                  </UButton>
                  <UButton variant="soft" class="w-full justify-start" to="/agente/propiedades">
                    <UIcon name="i-lucide-building-2" />
                    Mis Propiedades
                  </UButton>
                  <UButton variant="soft" class="w-full justify-start" to="/agente/clientes">
                    <UIcon name="i-lucide-users" />
                    Mis Clientes
                  </UButton>
                </div>
              </UCard>
            </div>

            <!-- Upcoming Visits -->
            <div class="lg:col-span-1">
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold">Próximas Visitas</h3>
                  </div>
                </template>
                <div class="divide-y divide-default">
                  <div 
                    v-for="visit in visits" 
                    :key="visit.id"
                    class="py-3"
                  >
                    <p class="font-medium text-sm">{{ visit.client }}</p>
                    <p class="text-sm text-muted">{{ visit.property }}</p>
                    <p class="text-xs text-primary mt-1">{{ visit.date }}</p>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Featured Properties -->
            <div class="lg:col-span-1">
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold">Propiedades Destacadas</h3>
                  </div>
                </template>
                <div class="divide-y divide-default">
                  <div 
                    v-for="property in properties" 
                    :key="property.id"
                    class="py-3"
                  >
                    <p class="font-medium text-sm">{{ property.title }}</p>
                    <p class="text-sm text-muted">{{ formatPrice(property.price, property.currency) }}</p>
                    <div class="flex items-center justify-between mt-2">
                      <p class="text-xs text-muted">{{ property.operation_type }}</p>
                      <UBadge 
                        :color="property.status === 'disponible' ? 'success' : 'warning'"
                        variant="soft"
                        size="xs"
                      >
                        {{ property.status }}
                      </UBadge>
                    </div>
                  </div>

                  <div v-if="properties.length === 0" class="py-6 text-center text-muted text-sm">
                    No hay propiedades asignadas
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
