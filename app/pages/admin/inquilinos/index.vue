<script setup lang="ts">
import type { TenantWithDetails, TenantStats } from '~/types/tenant.types'
import {
  TENANT_CONTRACT_STATUS,
  TENANT_CONTRACT_COLORS,
  TENANT_PAYMENT_STATUS,
  TENANT_PAYMENT_COLORS,
  getTenantContractStatus,
  getTenantPaymentStatus
} from '~/types/tenant.types'

definePageMeta({
  layout: 'admin'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const { 
  fetchTenants, 
  getTenantStats,
  deactivateTenant
} = useTenants()
const toast = useToast()

// Estado
const tenants = ref<TenantWithDetails[]>([])
const loading = ref(false)
const stats = ref<TenantStats>({
  total: 0,
  withActiveContract: 0,
  withPendingPayments: 0,
  newThisMonth: 0
})

// Filtros
const searchQuery = ref('')
const statusFilter = ref<string>('all')

// Columnas de la tabla
const columns = [
  { id: 'tenant', header: 'Inquilino' },
  { id: 'contact', header: 'Contacto' },
  { id: 'property', header: 'Propiedad Actual' },
  { id: 'contractStatus', header: 'Contrato' },
  { id: 'paymentStatus', header: 'Pagos' },
  { id: 'actions', header: '' }
]

// Opciones de estado
const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'with_contract', label: 'Con contrato' },
  { value: 'without_contract', label: 'Sin contrato' }
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

    const [tenantsResult, statsResult] = await Promise.all([
      fetchTenants(filters),
      getTenantStats()
    ])

    tenants.value = tenantsResult.data
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

// Obtener iniciales del nombre
const getInitials = (name: string | null) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Confirmar desactivación
const confirmDeactivate = ref(false)
const tenantToDeactivate = ref<TenantWithDetails | null>(null)

const handleDeactivateClick = (tenant: TenantWithDetails) => {
  tenantToDeactivate.value = tenant
  confirmDeactivate.value = true
}

const handleDeactivate = async () => {
  if (!tenantToDeactivate.value) return
  
  try {
    await deactivateTenant(tenantToDeactivate.value.id)
    
    toast.add({
      title: 'Inquilino desactivado',
      description: 'El inquilino fue desactivado correctamente',
      color: 'success'
    })

    confirmDeactivate.value = false
    tenantToDeactivate.value = null
    loadData()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo desactivar el inquilino',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="admin-tenants">
    <template #header>
      <UDashboardNavbar title="Inquilinos">
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
            label="Nuevo Inquilino"
            to="/admin/inquilinos/nuevo"
          />
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
                <p class="text-sm text-muted">Total Inquilinos</p>
                <p class="text-2xl font-bold">{{ stats.total }}</p>
              </div>
              <UIcon name="i-lucide-users" class="size-6 text-primary" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Con Contrato Activo</p>
                <p class="text-2xl font-bold text-success">{{ stats.withActiveContract }}</p>
              </div>
              <UIcon name="i-lucide-file-check" class="size-6 text-success" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Pagos Pendientes</p>
                <p class="text-2xl font-bold text-warning">{{ stats.withPendingPayments }}</p>
              </div>
              <UIcon name="i-lucide-clock" class="size-6 text-warning" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Nuevos Este Mes</p>
                <p class="text-2xl font-bold text-primary">{{ stats.newThisMonth }}</p>
              </div>
              <UIcon name="i-lucide-user-plus" class="size-6 text-primary" />
            </div>
          </UCard>
        </div>

        <!-- Filters -->
        <UCard>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <UInput
                v-model="searchQuery"
                placeholder="Buscar por nombre, email, DNI o teléfono..."
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
              :data="tenants"
              :loading="loading"
              class="min-w-225"
            >
              <template #tenant-cell="{ row }">
                <div class="flex items-center gap-3 min-w-50">
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    <img 
                      v-if="row.original.avatar_url"
                      :src="row.original.avatar_url"
                      :alt="row.original.full_name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-sm font-medium text-primary">
                      {{ getInitials(row.original.full_name) }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium">{{ row.original.full_name || 'Sin nombre' }}</p>
                    <p class="text-sm text-muted">DNI: {{ row.original.dni || 'No registrado' }}</p>
                  </div>
                </div>
              </template>

              <template #contact-cell="{ row }">
                <div class="min-w-45">
                  <p class="text-sm">{{ row.original.email }}</p>
                  <p class="text-sm text-muted">{{ row.original.phone || 'Sin teléfono' }}</p>
                </div>
              </template>

              <template #property-cell="{ row }">
                <div v-if="row.original.current_contract?.property" class="min-w-50">
                  <p class="font-medium">{{ row.original.current_contract.property.title }}</p>
                  <p class="text-sm text-muted">{{ row.original.current_contract.property.city }}</p>
                </div>
                <div v-else class="min-w-50">
                  <p class="text-muted">Sin propiedad asignada</p>
                </div>
              </template>

              <template #contractStatus-cell="{ row }">
                <UBadge
                  :color="(TENANT_CONTRACT_COLORS[getTenantContractStatus(row.original)] || 'neutral') as any"
                  variant="soft"
                >
                  {{ TENANT_CONTRACT_STATUS[getTenantContractStatus(row.original)] }}
                </UBadge>
              </template>

              <template #paymentStatus-cell="{ row }">
                <UBadge
                  :color="(TENANT_PAYMENT_COLORS[getTenantPaymentStatus(row.original)] || 'neutral') as any"
                  variant="soft"
                >
                  {{ TENANT_PAYMENT_STATUS[getTenantPaymentStatus(row.original)] }}
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
                      @click="navigateTo(`/admin/inquilinos/${row.original.id}`)"
                    />
                  </UTooltip>

                  <UTooltip text="Editar">
                    <UButton
                      color="primary"
                      variant="ghost"
                      icon="i-lucide-pencil"
                      size="sm"
                      square
                      @click="navigateTo(`/admin/inquilinos/${row.original.id}/editar`)"
                    />
                  </UTooltip>

                  <UTooltip text="Desactivar">
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-lucide-user-x"
                      size="sm"
                      square
                      @click="handleDeactivateClick(row.original)"
                    />
                  </UTooltip>
                </div>
              </template>
            </UTable>
          </div>

          <!-- Empty State -->
          <div v-if="!loading && tenants.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-users" class="size-16 mx-auto mb-4 text-muted" />
            <h3 class="text-lg font-semibold mb-2">No hay inquilinos</h3>
            <p class="text-muted mb-4">No se encontraron inquilinos con los filtros seleccionados.</p>
            <UButton label="Nuevo Inquilino" to="/admin/inquilinos/nuevo" />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Modal de confirmación -->
  <UModal v-model:open="confirmDeactivate">
    <template #content>
      <div class="p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="p-3 rounded-full bg-warning/10">
            <UIcon name="i-lucide-alert-triangle" class="size-6 text-warning" />
          </div>
          <div>
            <h3 class="font-semibold text-lg">Confirmar desactivación</h3>
            <p class="text-sm text-muted">Esta acción se puede deshacer</p>
          </div>
        </div>

        <p class="mb-6">
          ¿Estás seguro de que deseas desactivar a 
          <strong>{{ tenantToDeactivate?.full_name }}</strong>?
          El inquilino no podrá acceder al sistema pero sus datos se conservarán.
        </p>

        <div class="flex justify-end gap-2">
          <UButton variant="ghost" label="Cancelar" @click="confirmDeactivate = false" />
          <UButton color="error" label="Desactivar" @click="handleDeactivate" />
        </div>
      </div>
    </template>
  </UModal>
</template>

