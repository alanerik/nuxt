<script setup lang="ts">
const { fetchRequests, requests, loading, updateRequestStatus } = useMaintenance()

definePageMeta({
  layout: 'admin'
})

// Filters
const statusFilter = ref('all')
const searchQuery = ref('')
const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completado', label: 'Completados' },
  { value: 'cancelado', label: 'Cancelados' }
]

// Computed filtered requests
const filteredRequests = computed(() => {
  let result = requests.value

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r => 
      r.title?.toLowerCase().includes(query) ||
      r.property?.title?.toLowerCase().includes(query) ||
      r.tenant?.full_name?.toLowerCase().includes(query)
    )
  }


  return result
})

onMounted(() => {

  loadData()
  
  // Recargar datos cada 30 segundos
  const interval = setInterval(loadData, 30000)
  onBeforeUnmount(() => clearInterval(interval))
})

const loadData = () => {

    const filters: { status?: string } = {}
    if (statusFilter.value !== 'all') {
        filters.status = statusFilter.value
    }
    fetchRequests(filters)
}

watch([statusFilter], () => {
    loadData()
})

// Debug: watch requests and filteredRequests
watch([requests, filteredRequests, loading], () => {
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
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
}

// Columns for table view
const columns = [
  { key: 'title', label: 'Solicitud', id: 'title', header: 'Solicitud' },
  { key: 'property', label: 'Propiedad', id: 'property', header: 'Propiedad' },
  { key: 'tenant', label: 'Inquilino', id: 'tenant', header: 'Inquilino' },
  { key: 'priority', label: 'Prioridad', id: 'priority', header: 'Prioridad' },
  { key: 'status', label: 'Estado', id: 'status', header: 'Estado' },
  { key: 'actions', label: '', id: 'actions', header: '' }
]

const handleStatusChange = async (request: MaintenanceRequest, newStatus: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado') => {
    try {
        await updateRequestStatus(request.id, newStatus)
        useToast().add({ title: 'Estado actualizado', color: 'success' })
        loadData()
    } catch (e) {
        useToast().add({ title: 'Error al actualizar', color: 'error' })
    }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Mantenimiento">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
             to="/admin/mantenimiento/rubros" 
             icon="i-lucide-list" 
             color="neutral"
             label="Rubros" 
           />
           <UButton 
             to="/admin/mantenimiento/nuevo" 
             icon="i-lucide-plus" 
             label="Nueva Solicitud" 
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
                placeholder="Buscar por título, propiedad o inquilino..."
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

        <!-- Table -->
        <UCard :ui="{ body: { padding: 'p-0 sm:p-0' } }">
            <UTable :columns="columns" :data="filteredRequests as MaintenanceRequest[]" :loading="loading">
                <template #title-cell="{ row }">
                   <div class="flex items-center gap-2">
                       <UIcon name="i-lucide-wrench" class="size-4 text-muted shrink-0" />
                       <div>
                           <p class="font-medium">{{ row.original.title }}</p>
                           <p class="text-xs text-muted">{{ row.original.category || 'Sin categoría' }}</p>
                       </div>
                   </div>
                </template>

                 <template #property-cell="{ row }">
                   <div>
                       <p class="text-sm font-medium">{{ row.original.property?.title || 'Sin propiedad' }}</p>
                       <p class="text-xs text-muted">{{ row.original.property?.address }}</p>
                   </div>
                </template>

                 <template #tenant-cell="{ row }">
                   <div>
                       <p class="text-sm font-medium">{{ row.original.tenant?.full_name || 'Desconocido' }}</p>
                       <p class="text-xs text-muted">{{ row.original.tenant?.email }}</p>
                   </div>
                </template>

                <template #priority-cell="{ row }">
                    <UBadge :color="getPriorityColor(row.original.priority)" variant="subtle" size="xs">
                        {{ row.original.priority?.toUpperCase() }}
                    </UBadge>
                </template>

                <template #status-cell="{ row }">
                     <UBadge :color="getStatusColor(row.original.status)" variant="soft" size="xs">
                        {{ row.original.status?.replace('_', ' ').toUpperCase() }}
                    </UBadge>
                </template>
                
                <template #actions-cell="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <UDropdownMenu :items="[
                            [
                                { label: 'Marcar En Proceso', onSelect: () => handleStatusChange(row.original, 'en_proceso') },
                                { label: 'Marcar Completado', onSelect: () => handleStatusChange(row.original, 'completado') },
                                { label: 'Cancelar Solicitud', onSelect: () => handleStatusChange(row.original, 'cancelado') }
                            ]
                         ]">
                            <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" />
                        </UDropdownMenu>
                    </div>
                </template>
            </UTable>

            <div v-if="!loading && filteredRequests.length === 0" class="text-center py-12">
                <UIcon name="i-lucide-wrench" class="size-16 mx-auto mb-4 text-muted" />
                <h3 class="text-lg font-semibold mb-2">No hay solicitudes de mantenimiento</h3>
                <UButton label="Nueva Solicitud" to="/admin/mantenimiento/nuevo" />
            </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
