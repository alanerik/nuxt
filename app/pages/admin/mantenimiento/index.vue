<script setup lang="ts">
const { fetchRequests, requests, loading, updateRequestStatus } = useMaintenance()

definePageMeta({
  layout: 'admin'
})

// Filters
const statusFilter = ref('all')
const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completado', label: 'Completados' },
  { value: 'cancelado', label: 'Cancelados' }
]

onMounted(() => {
  loadData()
})

const loadData = () => {
    const filters: any = {}
    if (statusFilter.value !== 'all') {
        filters.status = statusFilter.value
    }
    // TODO: Add property/tenant filter if needed from UI
    fetchRequests(filters)
}

watch(statusFilter, () => {
    loadData()
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
  { key: 'title', label: 'Solicitud', id: 'title' },
  { key: 'property', label: 'Propiedad', id: 'property' },
  { key: 'tenant', label: 'Inquilino', id: 'tenant' },
  { key: 'priority', label: 'Prioridad', id: 'priority' },
  { key: 'status', label: 'Estado', id: 'status' },
  { key: 'actions', label: '', id: 'actions' }
]

const handleStatusChange = async (request: any, newStatus: string) => {
    try {
        await updateRequestStatus(request.id, newStatus)
        // Toast handled in composable or here, composable updates state local
        useToast().add({ title: 'Estado actualizado', color: 'success' })
    } catch (e) {
        useToast().add({ title: 'Error al actualizar', color: 'error' })
    }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Mantenimiento">
        <template #right>
           <UButton 
             to="/admin/mantenimiento/rubros" 
             color="primary" 
             variant="solid" 
             icon="i-lucide-list" 
             label="Gestionar Rubros" 
           />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="p-6 space-y-6">
        <!-- Stats / Cards could go here -->

        <!-- Filters -->
        <div class="flex gap-4">
             <USelectMenu
                v-model="statusFilter"
                :items="statusOptions"
                value-key="value"
                class="w-48"
             />
        </div>

        <!-- Request Board (List for now) -->
        <UCard :ui="{ body: { padding: 'p-0 sm:p-0' } }">
            <UTable :columns="columns" :rows="requests" :loading="loading">
                <template #title-data="{ row }">
                   <div>
                       <p class="font-medium">{{ row.title }}</p>
                       <p class="text-xs text-muted">{{ row.category || 'Sin categoría' }}</p>
                   </div>
                </template>

                 <template #property-data="{ row }">
                   <div>
                       <p class="text-sm font-medium">{{ row.property?.title || 'Sin propiedad' }}</p>
                       <p class="text-xs text-muted">{{ row.property?.address }}</p>
                   </div>
                </template>

                 <template #tenant-data="{ row }">
                   <div>
                       <p class="text-sm font-medium">{{ row.tenant?.full_name || 'Desconocido' }}</p>
                       <p class="text-xs text-muted">{{ row.tenant?.email }}</p>
                   </div>
                </template>

                <template #priority-data="{ row }">
                    <UBadge :color="getPriorityColor(row.priority)" variant="subtle" size="xs">
                        {{ row.priority?.toUpperCase() }}
                    </UBadge>
                </template>

                <template #status-data="{ row }">
                     <UBadge :color="getStatusColor(row.status)" variant="soft" size="xs">
                        {{ row.status?.replace('_', ' ').toUpperCase() }}
                    </UBadge>
                </template>
                
                <template #actions-data="{ row }">
                    <div class="flex items-center justify-end gap-2">
                         <UDropdownMenu :items="[
                            [
                                { label: 'Marcar En Proceso', click: () => handleStatusChange(row, 'en_proceso') },
                                { label: 'Marcar Completado', click: () => handleStatusChange(row, 'completado') },
                                { label: 'Cancelar Solicitud', click: () => handleStatusChange(row, 'cancelado') }
                            ]
                         ]">
                            <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" />
                        </UDropdownMenu>
                    </div>
                </template>
            </UTable>

            <div v-if="!loading && requests.length === 0" class="p-8 text-center text-muted">
                No hay solicitudes de mantenimiento.
            </div>
        </UCard>
    </div>
  </UDashboardPanel>
</template>
