<script setup lang="ts">
import type { Property } from '~/types/property.types'
import { 
  PROPERTY_TYPE_LABELS, 
  OPERATION_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_COLORS 
} from '~/types/property.types'

definePageMeta({
  layout: 'admin'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const { fetchProperties, deleteProperty } = useProperties()
const toast = useToast()

// Estado
const properties = ref<Property[]>([])
const loading = ref(false)
const selectedProperty = ref<Property | null>(null)
const showDeleteModal = ref(false)

// Filtros locales
const searchQuery = ref('')
const statusFilter = ref<string>('all')
const typeFilter = ref<string>('all')

// Columnas para Nuxt UI 4
const columns = [
  { id: 'images', header: '' },
  { id: 'title', header: 'Propiedad' },
  { id: 'property_type', header: 'Tipo' },
  { id: 'operation_type', header: 'Operación' },
  { id: 'price', header: 'Precio' },
  { id: 'location', header: 'Ubicación' },
  { id: 'status', header: 'Estado' },
  { id: 'agent', header: 'Agente' },
  { id: 'actions', header: '' }
]

// Cargar propiedades
const loadProperties = async () => {
  loading.value = true
  try {
    const filters: any = {}
    
    if (searchQuery.value) {
      filters.search = searchQuery.value
    }
    
    if (statusFilter.value !== 'all') {
      filters.status = statusFilter.value
    }
    
    if (typeFilter.value !== 'all') {
      filters.property_type = typeFilter.value
    }

    const result = await fetchProperties(filters)
    properties.value = result.data
  } finally {
    loading.value = false
  }
}

// Watch filters
watch([searchQuery, statusFilter, typeFilter], () => {
  loadProperties()
})

// Cargar inicial
onMounted(() => {
  loadProperties()
})

// Formato de precio
const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(price)
}

// Confirmar eliminación
const confirmDelete = (property: Property) => {
  selectedProperty.value = property
  showDeleteModal.value = true
}

// Eliminar propiedad
const handleDelete = async () => {
  if (!selectedProperty.value) return

  try {
    await deleteProperty(selectedProperty.value.id)
    
    toast.add({
      title: 'Propiedad eliminada',
      description: 'La propiedad fue eliminada correctamente',
      color: 'success'
    })
    
    showDeleteModal.value = false
    selectedProperty.value = null
    loadProperties()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo eliminar la propiedad',
      color: 'error'
    })
  }
}

// Acciones de fila
const rowActions = (property: Property) => [[
  {
    label: 'Ver detalle',
    icon: 'i-lucide-eye',
    click: () => {
      console.log('Click en Ver detalle', property.id)
      return navigateTo(`/admin/propiedades/${property.id}`)
    }
  },
  {
    label: 'Editar',
    icon: 'i-lucide-pencil',
    click: () => {
      console.log('Click en Editar', property.id)
      return navigateTo(`/admin/propiedades/${property.id}/editar`)
    }
  }
], [
  {
    label: 'Eliminar',
    icon: 'i-lucide-trash-2',
    click: () => {
      console.log('Click en Eliminar (abrir modal)', property.id)
      confirmDelete(property)
    }
  }
]]

// Stats
const stats = computed(() => ({
  total: properties.value.length,
  disponibles: properties.value.filter(p => p.status === 'disponible').length,
  alquiladas: properties.value.filter(p => p.status === 'alquilada').length,
  vendidas: properties.value.filter(p => p.status === 'vendida').length
}))
</script>

<template>
  <UDashboardPanel id="admin-properties" class="min-w-0">
    <template #header>
      <UDashboardNavbar title="Propiedades">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notificaciones">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5" />
              </UChip>
            </UButton>
          </UTooltip>

          <UButton 
            icon="i-lucide-plus" 
            to="/admin/propiedades/nueva"
          >
            Nueva Propiedad
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Total</p>
                <p class="text-2xl font-bold">{{ stats.total }}</p>
              </div>
              <UIcon name="i-lucide-building-2" class="size-6 text-primary" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Disponibles</p>
                <p class="text-2xl font-bold text-success">{{ stats.disponibles }}</p>
              </div>
              <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Alquiladas</p>
                <p class="text-2xl font-bold text-primary">{{ stats.alquiladas }}</p>
              </div>
              <UIcon name="i-lucide-key" class="size-6 text-primary" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Vendidas</p>
                <p class="text-2xl font-bold">{{ stats.vendidas }}</p>
              </div>
              <UIcon name="i-lucide-circle-check" class="size-6" />
            </div>
          </UCard>
        </div>

        <!-- Filters -->
        <UCard>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <UInput
                v-model="searchQuery"
                placeholder="Buscar..."
                icon="i-lucide-search"
                size="lg"
              />
            </div>

            <USelectMenu
              v-model="statusFilter"
              :items="[
                { value: 'all', label: 'Todos' },
                { value: 'disponible', label: 'Disponible' },
                { value: 'alquilada', label: 'Alquilada' },
                { value: 'vendida', label: 'Vendida' }
              ]"
              value-key="value"
              size="lg"
            />
          </div>
        </UCard>

        <!-- Table -->
        <UCard :ui="{ body: { padding: 'p-0 sm:p-0' }, base: 'min-w-0' }">
          <div class="overflow-x-auto w-full max-w-[calc(100vw-3rem)] md:max-w-full">
            <UTable
              :columns="columns"
              :data="properties"
              :loading="loading"
              class="min-w-[1000px] w-full" 
            >
              <template #images-cell="{ row }">
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-muted m-2">
                  <img 
                    v-if="row.original.images?.[0]"
                    :src="row.original.images[0]"
                    :alt="row.original.title"
                    class="w-full h-full object-cover"
                  />
                </div>
              </template>

              <template #title-cell="{ row }">
                <div class="min-w-[200px] max-w-[300px]">
                  <p class="font-medium whitespace-normal break-words">{{ row.original.title }}</p>
                </div>
              </template>

              <template #property_type-cell="{ row }">
                <UBadge variant="soft" size="sm">
                  {{ PROPERTY_TYPE_LABELS[row.original.property_type] || row.original.property_type }}
                </UBadge>
              </template>

              <template #operation_type-cell="{ row }">
                {{ OPERATION_TYPE_LABELS[row.original.operation_type] || row.original.operation_type }}
              </template>

              <template #price-cell="{ row }">
                <span class="whitespace-nowrap font-medium">
                  {{ formatPrice(row.original.price, row.original.currency) }}
                </span>
              </template>

              <template #location-cell="{ row }">
                <div class="min-w-[150px] max-w-[250px]">
                  <p class="font-medium">{{ row.original.city }}</p>
                  <p class="text-sm text-muted whitespace-normal break-words">{{ row.original.address }}</p>
                </div>
              </template>

              <template #status-cell="{ row }">
                <UBadge 
                  :color="(PROPERTY_STATUS_COLORS[row.original.status] || 'neutral') as any"
                  variant="soft"
                >
                  {{ PROPERTY_STATUS_LABELS[row.original.status] || row.original.status }}
                </UBadge>
              </template>

              <template #agent-cell="{ row }">
                <span v-if="row.original.agent" class="whitespace-nowrap">
                  {{ row.original.agent.profiles?.full_name || 'Sin nombre' }}
                </span>
                <span v-else class="text-muted whitespace-nowrap">Sin agente</span>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex items-center justify-end gap-2">
                  <UTooltip text="Ver detalle">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-eye"
                      size="sm"
                      square
                      @click="navigateTo(`/admin/propiedades/${row.original.id}`)"
                    />
                  </UTooltip>

                  <UTooltip text="Editar">
                    <UButton
                      color="primary"
                      variant="ghost"
                      icon="i-lucide-pencil"
                      size="sm"
                      square
                      @click="navigateTo(`/admin/propiedades/${row.original.id}/editar`)"
                    />
                  </UTooltip>

                  <UTooltip text="Eliminar">
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      size="sm"
                      square
                      @click="confirmDelete(row.original)"
                    />
                  </UTooltip>
                </div>
              </template>
            </UTable>
          </div>
          <!-- Empty State -->
          <div v-if="!loading && properties.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-building-2" class="size-16 mx-auto mb-4 text-muted" />
            <h3 class="text-lg font-semibold mb-2">No hay propiedades</h3>
            <UButton to="/admin/propiedades/nueva">Nueva Propiedad</UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Delete Confirmation Modal -->
  <UModal v-model:open="showDeleteModal">
    <template #content>
      <div class="p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="p-3 rounded-full bg-error/10">
            <UIcon name="i-lucide-trash-2" class="size-6 text-error" />
          </div>
          <div>
            <h3 class="font-semibold text-lg">Eliminar propiedad</h3>
            <p class="text-sm text-muted">Esta acción no se puede deshacer</p>
          </div>
        </div>
        
        <p class="mb-6">
          ¿Estás seguro que querés eliminar <strong>{{ selectedProperty?.title }}</strong>?
        </p>

        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="showDeleteModal = false">
            Cancelar
          </UButton>
          <UButton color="error" @click="handleDelete">
            Eliminar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
