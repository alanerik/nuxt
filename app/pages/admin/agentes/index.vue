<script setup lang="ts">
import type { Agent, AgentStats } from '~/types/agent.types'
import {
  AGENT_VERIFICATION_STATUS,
  AGENT_VERIFICATION_COLORS,
  AGENT_SPECIALIZATIONS,
  getAgentVerificationStatus,
  formatRating,
  formatCommissionRate
} from '~/types/agent.types'

definePageMeta({
  layout: 'admin'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const { 
  fetchAgents, 
  getAgentStats,
  toggleAgentVerification
} = useAgents()
const toast = useToast()

// Estado
const agents = ref<Agent[]>([])
const loading = ref(false)
const stats = ref<AgentStats>({
  total: 0,
  verified: 0,
  totalSales: 0,
  totalRentals: 0
})

// Filtros
const searchQuery = ref('')
const verifiedFilter = ref<string>('all')

// Columnas de la tabla
const columns = [
  { id: 'agent', header: 'Agente' },
  { id: 'contact', header: 'Contacto' },
  { id: 'stats', header: 'Estadísticas' },
  { id: 'commission', header: 'Comisión' },
  { id: 'status', header: 'Estado' },
  { id: 'actions', header: '' }
]

// Opciones de filtro
const verifiedOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'verified', label: 'Verificados' },
  { value: 'pending', label: 'Pendientes' }
]

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    const filters: any = {}

    if (searchQuery.value) {
      filters.search = searchQuery.value
    }

    if (verifiedFilter.value === 'verified') {
      filters.verified = true
    } else if (verifiedFilter.value === 'pending') {
      filters.verified = false
    }

    const [agentsResult, statsResult] = await Promise.all([
      fetchAgents(filters),
      getAgentStats()
    ])

    agents.value = agentsResult.data
    stats.value = statsResult
  } finally {
    loading.value = false
  }
}

// Watch filtros
watch([searchQuery, verifiedFilter], () => {
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

// Verificar agente
const handleVerify = async (agent: Agent) => {
  try {
    await toggleAgentVerification(agent.id, !agent.is_verified)
    
    toast.add({
      title: agent.is_verified ? 'Verificación removida' : 'Agente verificado',
      description: agent.is_verified 
        ? 'Se removió la verificación del agente' 
        : 'El agente fue verificado correctamente',
      color: 'success'
    })

    loadData()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cambiar el estado de verificación',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="admin-agents">
    <template #header>
      <UDashboardNavbar title="Agentes">
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
            to="/admin/agentes/nuevo"
          >
            Nuevo Agente
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
                <p class="text-sm text-muted">Total Agentes</p>
                <p class="text-2xl font-bold">{{ stats.total }}</p>
              </div>
              <UIcon name="i-lucide-users" class="size-6 text-primary" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Verificados</p>
                <p class="text-2xl font-bold text-success">{{ stats.verified }}</p>
              </div>
              <UIcon name="i-lucide-badge-check" class="size-6 text-success" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Total Ventas</p>
                <p class="text-2xl font-bold text-primary">{{ stats.totalSales }}</p>
              </div>
              <UIcon name="i-lucide-trending-up" class="size-6 text-primary" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Total Alquileres</p>
                <p class="text-2xl font-bold">{{ stats.totalRentals }}</p>
              </div>
              <UIcon name="i-lucide-key" class="size-6" />
            </div>
          </UCard>
        </div>

        <!-- Filters -->
        <UCard>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <UInput
                v-model="searchQuery"
                placeholder="Buscar por nombre, email o matrícula..."
                icon="i-lucide-search"
                size="lg"
              />
            </div>

            <USelectMenu
              v-model="verifiedFilter"
              :items="verifiedOptions"
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
              :data="agents"
              :loading="loading"
              class="min-w-[900px]"
            >
              <template #agent-cell="{ row }">
                <div class="flex items-center gap-3 min-w-[220px]">
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    <img 
                      v-if="row.original.profile?.avatar_url"
                      :src="row.original.profile.avatar_url"
                      :alt="row.original.profile.full_name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-sm font-medium text-primary">
                      {{ getInitials(row.original.profile?.full_name) }}
                    </span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-medium">{{ row.original.profile?.full_name || 'Sin nombre' }}</p>
                      <UIcon 
                        v-if="row.original.is_verified" 
                        name="i-lucide-badge-check" 
                        class="size-4 text-success" 
                      />
                    </div>
                    <p class="text-sm text-muted">{{ row.original.license_number || 'Sin matrícula' }}</p>
                  </div>
                </div>
              </template>

              <template #contact-cell="{ row }">
                <div class="min-w-[180px]">
                  <p class="text-sm">{{ row.original.profile?.email }}</p>
                  <p class="text-sm text-muted">{{ row.original.profile?.phone || 'Sin teléfono' }}</p>
                </div>
              </template>

              <template #stats-cell="{ row }">
                <div class="min-w-[120px]">
                  <div class="flex items-center gap-4">
                    <div class="text-center">
                      <p class="font-semibold">{{ row.original.total_sales }}</p>
                      <p class="text-xs text-muted">Ventas</p>
                    </div>
                    <div class="text-center">
                      <p class="font-semibold">{{ row.original.total_rentals }}</p>
                      <p class="text-xs text-muted">Alquileres</p>
                    </div>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-star" class="size-4 text-warning" />
                      <span class="font-medium">{{ formatRating(row.original.rating) }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <template #commission-cell="{ row }">
                <UBadge variant="soft" color="primary">
                  {{ formatCommissionRate(row.original.commission_rate) }}
                </UBadge>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :color="(AGENT_VERIFICATION_COLORS[getAgentVerificationStatus(row.original)] || 'neutral') as any"
                  variant="soft"
                >
                  {{ AGENT_VERIFICATION_STATUS[getAgentVerificationStatus(row.original)] }}
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
                      @click="navigateTo(`/admin/agentes/${row.original.id}`)"
                    />
                  </UTooltip>

                  <UTooltip text="Editar">
                    <UButton
                      color="primary"
                      variant="ghost"
                      icon="i-lucide-pencil"
                      size="sm"
                      square
                      @click="navigateTo(`/admin/agentes/${row.original.id}/editar`)"
                    />
                  </UTooltip>

                  <UTooltip :text="row.original.is_verified ? 'Quitar verificación' : 'Verificar'">
                    <UButton
                      :color="row.original.is_verified ? 'warning' : 'success'"
                      variant="ghost"
                      :icon="row.original.is_verified ? 'i-lucide-shield-off' : 'i-lucide-shield-check'"
                      size="sm"
                      square
                      @click="handleVerify(row.original)"
                    />
                  </UTooltip>
                </div>
              </template>
            </UTable>
          </div>

          <!-- Empty State -->
          <div v-if="!loading && agents.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-users" class="size-16 mx-auto mb-4 text-muted" />
            <h3 class="text-lg font-semibold mb-2">No hay agentes</h3>
            <p class="text-muted mb-4">No se encontraron agentes con los filtros seleccionados.</p>
            <UButton to="/admin/agentes/nuevo">Nuevo Agente</UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
