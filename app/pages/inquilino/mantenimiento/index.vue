<script setup lang="ts">
const { fetchRequests, requests, loading } = useMaintenance()

definePageMeta({
  layout: 'inquilino'
})

onMounted(() => {
    // Current user's requests are filtered automatically by RLS usually, 
    // but our composable logic has explicit filtering if needed. 
    // Ideally useMaintenance uses useSupabaseUser() to contextually filter or the DB RLS handles it.
    // In our implementation of fetchRequests we added explicit filters for tenant_id if provided, 
    // but let's see how I implemented it. 
    // Ah, fetchRequests has filters parameter. Let's pass the user ID if I can access it or rely on composable default? 
    // Looking at composable: fetchRequests takes filters. 
    // Let's pass tenant_id from user just in case or trust RLS.
    const user = useSupabaseUser()
    if(user.value) {
        fetchRequests({ tenant_id: user.value.id })
    }
})

const getPriorityColor = (priority: string) => {
    switch(priority) {
        case 'urgente': return 'error'
        case 'alta': return 'warning'
        case 'media': return 'primary'
        case 'baja': return 'neutral'
        default: return 'neutral'
    }
}

const getStatusColor = (status: string) => {
    switch(status) {
        case 'pendiente': return 'warning'
        case 'en_proceso': return 'primary'
        case 'completado': return 'success'
        case 'cancelado': return 'neutral'
        default: return 'neutral'
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
        day: 'numeric', month: 'short', year:'numeric'
    })
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Mis Solicitudes de Mantenimiento">
        <template #right>
          <UButton 
            label="Nueva Solicitud" 
            icon="i-lucide-plus" 
            to="/inquilino/mantenimiento/nuevo" 
            color="primary"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="p-6">
      <div v-if="loading" class="space-y-4">
           <USkeleton class="h-24 w-full" v-for="i in 3" :key="i" />
      </div>

      <div v-else-if="requests.length === 0" class="text-center py-12">
           <UIcon name="i-lucide-wrench" class="size-12 mx-auto mb-4 text-muted" />
           <h3 class="text-lg font-semibold">Sin solicitudes</h3>
           <p class="text-muted mb-4">No tienes solicitudes de mantenimiento activas.</p>
           <UButton to="/inquilino/mantenimiento/nuevo" label="Crear Solicitud" />
      </div>

      <div v-else class="grid gap-4">
          <UCard v-for="req in requests" :key="req.id">
              <div class="flex justify-between items-start">
                  <div>
                      <div class="flex items-center gap-2 mb-1">
                          <h3 class="font-semibold">{{ req.title }}</h3>
                          <UBadge :color="getStatusColor(req.status)" size="xs" variant="soft">
                              {{ req.status?.replace('_', ' ').toUpperCase() }}
                          </UBadge>
                      </div>
                      <p class="text-sm text-muted">{{ req.category }} - {{ formatDate(req.reported_date) }}</p>
                      <p class="text-sm mt-2 text-gray-600 dark:text-gray-300">{{ req.description }}</p>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                       <UBadge :color="getPriorityColor(req.priority)" size="xs" variant="subtle">
                           {{ req.priority?.toUpperCase() }}
                       </UBadge>
                       <!-- View details button could go here -->
                  </div>
              </div>
          </UCard>
      </div>
    </div>
  </UDashboardPanel>
</template>
