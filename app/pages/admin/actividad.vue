<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { activities, loading, fetchDashboardData } = useDashboardStats()

const statusFilter = ref('all')
const searchQuery = ref('')

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'contract', label: 'Contratos' },
  { value: 'payment', label: 'Pagos' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'tenant', label: 'Inquilinos' }
]

const filteredActivities = computed(() => {
  let result = activities.value

  // Filtrar por tipo
  if (statusFilter.value !== 'all') {
    result = result.filter(a => a.type === statusFilter.value)
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(a =>
      a.action.toLowerCase().includes(query) ||
      a.property.toLowerCase().includes(query)
    )
  }

  return result
})

onMounted(() => {
  fetchDashboardData()
})

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    'contract': 'i-lucide-file-signature',
    'payment': 'i-lucide-credit-card',
    'maintenance': 'i-lucide-wrench',
    'tenant': 'i-lucide-user-plus'
  }
  return icons[type] || 'i-lucide-activity'
}

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    'contract': 'primary',
    'payment': 'success',
    'maintenance': 'warning',
    'tenant': 'info'
  }
  return colors[type] || 'neutral'
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Historial de Actividad">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton 
            icon="i-lucide-arrow-left" 
            to="/admin/dashboard"
            variant="ghost"
            color="neutral"
            label="Volver"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Filters -->
        <UCard>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <UInput
                v-model="searchQuery"
                placeholder="Buscar por acción o propiedad..."
                icon="i-lucide-search"
                size="lg"
              />
            </div>

            <USelectMenu
              v-model="statusFilter"
              :items="statusOptions"
              value-key="value"
              size="lg"
              class="w-full md:w-48"
            />
          </div>
        </UCard>

        <!-- Activity List -->
        <UCard>
          <!-- Loading skeleton -->
          <template v-if="loading && filteredActivities.length === 0">
            <div class="divide-y divide-default">
              <div v-for="i in 8" :key="i" class="py-4 flex items-start gap-4">
                <USkeleton class="h-10 w-10 rounded-full shrink-0" />
                <div class="flex-1 space-y-2">
                  <USkeleton class="h-4 w-48" />
                  <USkeleton class="h-3 w-32" />
                </div>
                <USkeleton class="h-3 w-20" />
              </div>
            </div>
          </template>

          <!-- Empty state -->
          <template v-else-if="filteredActivities.length === 0">
            <div class="py-12 text-center">
              <UIcon name="i-lucide-inbox" class="size-16 mx-auto mb-4 text-muted" />
              <h3 class="text-lg font-semibold mb-2">No hay actividad</h3>
              <p class="text-muted">Intenta ajustar los filtros</p>
            </div>
          </template>

          <!-- Activity timeline -->
          <template v-else>
            <div class="divide-y divide-default">
              <div
                v-for="activity in filteredActivities"
                :key="activity.id"
                class="py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition rounded-lg px-4 -mx-4"
              >
                <!-- Icon -->
                <div class="p-2 rounded-lg shrink-0" :style="{ backgroundColor: `rgb(var(--color-${getActivityColor(activity.type)}-50))` }">
                  <UIcon
                    :name="getActivityIcon(activity.type)"
                    class="size-5"
                    :style="{ color: `var(--color-${getActivityColor(activity.type)})` }"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm">{{ activity.action }}</p>
                  <p class="text-sm text-muted mt-1">{{ activity.property }}</p>
                  <UBadge color="gray" variant="subtle" size="xs" class="mt-2">
                    {{ activity.type }}
                  </UBadge>
                </div>

                <!-- Time -->
                <div class="text-right shrink-0">
                  <p class="text-xs text-muted whitespace-nowrap">{{ activity.time }}</p>
                </div>
              </div>
            </div>
          </template>
        </UCard>

        <!-- Summary -->
        <UCard v-if="filteredActivities.length > 0">
          <div class="flex items-center justify-between">
            <p class="text-sm text-muted">
              Mostrando {{ filteredActivities.length }} de {{ activities.length }} actividades
            </p>
            <UButton size="sm" variant="ghost" label="Limpiar filtros" @click="searchQuery = ''; statusFilter = 'all'" />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
