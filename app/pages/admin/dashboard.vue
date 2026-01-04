<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const { stats, activities, loading, fetchDashboardData } = useDashboardStats()

// Cargar datos al montar
onMounted(() => {
  fetchDashboardData()
})
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
          <!-- Loading skeleton -->
          <template v-if="loading && stats.length === 0">
            <UCard v-for="i in 4" :key="i" class="relative overflow-hidden">
              <div class="flex items-center justify-between">
                <div class="space-y-2">
                  <USkeleton class="h-4 w-24" />
                  <USkeleton class="h-8 w-16" />
                  <USkeleton class="h-3 w-20" />
                </div>
                <USkeleton class="h-12 w-12 rounded-full" />
              </div>
            </UCard>
          </template>

          <!-- Stats cards -->
          <template v-else>
            <UCard v-for="stat in stats" :key="stat.title" class="relative overflow-hidden">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-muted">{{ stat.title }}</p>
                  <p class="text-2xl font-bold mt-1">{{ stat.value }}</p>
                  <p 
                    class="text-xs mt-1"
                    :class="stat.changeType === 'positive' ? 'text-success' : stat.changeType === 'negative' ? 'text-error' : 'text-muted'"
                  >
                    {{ stat.change }} vs mes anterior
                  </p>
                </div>
                <div class="p-3 rounded-full bg-primary/10">
                  <UIcon :name="stat.icon" class="size-6 text-primary" />
                </div>
              </div>
            </UCard>
          </template>
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

            <!-- Loading skeleton -->
            <template v-if="loading && activities.length === 0">
              <div class="divide-y divide-default">
                <div v-for="i in 5" :key="i" class="py-3 flex items-center gap-3">
                  <USkeleton class="h-8 w-8 rounded-full shrink-0" />
                  <div class="flex-1 space-y-2">
                    <USkeleton class="h-4 w-32" />
                    <USkeleton class="h-3 w-24" />
                  </div>
                  <USkeleton class="h-3 w-16" />
                </div>
              </div>
            </template>

            <!-- Empty state -->
            <template v-else-if="activities.length === 0">
              <div class="py-8 text-center text-muted">
                <UIcon name="i-lucide-inbox" class="size-12 mx-auto mb-2 opacity-50" />
                <p>No hay actividad reciente</p>
              </div>
            </template>

            <!-- Activity list -->
            <template v-else>
              <div class="divide-y divide-default">
                <div 
                  v-for="activity in activities" 
                  :key="activity.id"
                  class="py-3 flex items-center gap-3"
                >
                  <div class="p-2 rounded-full bg-primary/10 shrink-0">
                    <UIcon :name="activity.icon" class="size-4 text-primary" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ activity.action }}</p>
                    <p class="text-sm text-muted truncate">{{ activity.property }}</p>
                  </div>
                  <span class="text-xs text-muted whitespace-nowrap">{{ activity.time }}</span>
                </div>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

