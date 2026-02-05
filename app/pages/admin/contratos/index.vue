<script setup lang="ts">
import type { Contract } from '~/types/contract.types'
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  getDaysRemaining,
  isContractExpiringSoon
} from '~/types/contract.types'

definePageMeta({
  layout: 'admin'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const { 
  fetchContracts, 
  getContractStats,
  updateContractStatus 
} = useContracts()
const toast = useToast()

// Estado
const contracts = ref<Contract[]>([])
const loading = ref(false)
const stats = ref({
  total: 0,
  activos: 0,
  pendientes: 0,
  vencidos: 0,
  ingresosMensuales: 0
})

// Filtros
const searchQuery = ref('')
const statusFilter = ref<string>('all')

// Columnas de la tabla
const columns = [
  { id: 'property', header: 'Propiedad' },
  { id: 'tenant', header: 'Inquilino' },
  { id: 'dates', header: 'Período' },
  { id: 'rent', header: 'Alquiler' },
  { id: 'status', header: 'Estado' },
  { id: 'actions', header: '' }
]

// Opciones de estado
const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'vencido', label: 'Vencidos' },
  { value: 'cancelado', label: 'Cancelados' }
]

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    const filters: { search?: string; status?: string } = {}

    if (searchQuery.value) {
      filters.search = searchQuery.value
    }

    if (statusFilter.value !== 'all') {
      filters.status = statusFilter.value
    }

    const [contractsResult, statsResult] = await Promise.all([
      fetchContracts(filters),
      getContractStats()
    ])

    contracts.value = contractsResult.data
    stats.value = statsResult
  } finally {
    loading.value = false
  }
}

// Watch filtros
watch([searchQuery, statusFilter], () => {
  loadData()
})

// Cargar inicial
onMounted(() => {
  loadData()
})

// Formato de precio
const formatPrice = (amount: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

// Formato de fecha
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Activar contrato
const handleActivate = async (contract: Contract) => {
  try {
    await updateContractStatus(contract.id, 'activo', contract.property_id || undefined)
    
    toast.add({
      title: 'Contrato activado',
      description: 'El contrato fue activado correctamente',
      color: 'success'
    })

    loadData()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo activar el contrato',
      color: 'error'
    })
  }
}

// Cancelar contrato
const handleCancel = async (contract: Contract) => {
  try {
    await updateContractStatus(contract.id, 'cancelado', contract.property_id || undefined)
    
    toast.add({
      title: 'Contrato cancelado',
      description: 'El contrato fue cancelado correctamente',
      color: 'success'
    })

    loadData()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cancelar el contrato',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="admin-contracts">
    <template #header>
      <UDashboardNavbar title="Contratos">
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
            to="/admin/contratos/nuevo"
          >
            Nuevo Contrato
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
                <p class="text-sm text-muted">Total Contratos</p>
                <p class="text-2xl font-bold">{{ stats.total }}</p>
              </div>
              <UIcon name="i-lucide-file-text" class="size-6 text-primary" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Activos</p>
                <p class="text-2xl font-bold text-success">{{ stats.activos }}</p>
              </div>
              <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Pendientes</p>
                <p class="text-2xl font-bold text-warning">{{ stats.pendientes }}</p>
              </div>
              <UIcon name="i-lucide-clock" class="size-6 text-warning" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Ingresos Mensuales</p>
                <p class="text-2xl font-bold text-primary">{{ formatPrice(stats.ingresosMensuales) }}</p>
              </div>
              <UIcon name="i-lucide-dollar-sign" class="size-6 text-primary" />
            </div>
          </UCard>
        </div>

        <!-- Filters -->
        <UCard>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <UInput
                v-model="searchQuery"
                placeholder="Buscar por inquilino, propiedad o número..."
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
          <div class="overflow-x-auto">
            <UTable
              :columns="columns"
              :data="contracts"
              :loading="loading"
              class="min-w-[800px]"
            >
              <template #property-cell="{ row }">
                <div class="flex items-center gap-3 min-w-[200px]">
                  <div class="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img 
                      v-if="row.original.property?.images?.[0]"
                      :src="row.original.property.images[0]"
                      :alt="row.original.property.title"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <UIcon name="i-lucide-building-2" class="size-5 text-muted" />
                    </div>
                  </div>
                  <div>
                    <p class="font-medium">{{ row.original.property?.title || 'Sin propiedad' }}</p>
                    <p class="text-sm text-muted">{{ row.original.property?.city }}</p>
                  </div>
                </div>
              </template>

              <template #tenant-cell="{ row }">
                <div class="min-w-[150px]">
                  <p class="font-medium">{{ row.original.tenant?.full_name || 'Sin inquilino' }}</p>
                  <p class="text-sm text-muted">{{ row.original.tenant?.email }}</p>
                </div>
              </template>

              <template #dates-cell="{ row }">
                <div class="min-w-[150px]">
                  <p class="text-sm">
                    {{ formatDate(row.original.start_date) }} - {{ formatDate(row.original.end_date) }}
                  </p>
                  <p 
                    v-if="row.original.status === 'activo'"
                    class="text-xs"
                    :class="isContractExpiringSoon(row.original.end_date) ? 'text-warning font-medium' : 'text-muted'"
                  >
                    {{ getDaysRemaining(row.original.end_date) > 0 
                      ? `${getDaysRemaining(row.original.end_date)} días restantes`
                      : 'Vencido' 
                    }}
                  </p>
                </div>
              </template>

              <template #rent-cell="{ row }">
                <div>
                  <p class="font-semibold">{{ formatPrice(row.original.monthly_rent, row.original.currency) }}</p>
                  <p class="text-xs text-muted">Día {{ row.original.payment_day }}</p>
                </div>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :color="(CONTRACT_STATUS_COLORS[row.original.status as keyof typeof CONTRACT_STATUS_COLORS] || 'neutral') as any"
                  variant="soft"
                >
                  {{ CONTRACT_STATUS_LABELS[row.original.status as keyof typeof CONTRACT_STATUS_LABELS] || row.original.status }}
                </UBadge>
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
                      @click="navigateTo(`/admin/contratos/${row.original.id}`)"
                    />
                  </UTooltip>

                  <UTooltip text="Editar">
                    <UButton
                      color="primary"
                      variant="ghost"
                      icon="i-lucide-pencil"
                      size="sm"
                      square
                      @click="navigateTo(`/admin/contratos/${row.original.id}/editar`)"
                    />
                  </UTooltip>

                  <UTooltip 
                    v-if="row.original.status === 'pendiente'" 
                    text="Activar"
                  >
                    <UButton
                      color="success"
                      variant="ghost"
                      icon="i-lucide-check"
                      size="sm"
                      square
                      @click="handleActivate(row.original)"
                    />
                  </UTooltip>

                  <UTooltip 
                    v-if="row.original.status === 'activo' || row.original.status === 'pendiente'" 
                    text="Cancelar"
                  >
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-lucide-x"
                      size="sm"
                      square
                      @click="handleCancel(row.original)"
                    />
                  </UTooltip>
                </div>
              </template>
            </UTable>
          </div>

          <!-- Empty State -->
          <div v-if="!loading && contracts.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-file-text" class="size-16 mx-auto mb-4 text-muted" />
            <h3 class="text-lg font-semibold mb-2">No hay contratos</h3>
            <p class="text-muted mb-4">No se encontraron contratos con los filtros seleccionados.</p>
            <UButton to="/admin/contratos/nuevo">Nuevo Contrato</UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
