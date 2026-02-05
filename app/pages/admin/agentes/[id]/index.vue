<script setup lang="ts">
import type { AgentWithDetails } from '~/types/agent.types'
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

const route = useRoute()
const router = useRouter()
const { 
  getAgentById, 
  getAgentProperties, 
  getAgentCommissions,
  toggleAgentVerification
} = useAgents()
const toast = useToast()

const agentId = computed(() => route.params.id as string)

// Estado
const agent = ref<AgentWithDetails | null>(null)
const properties = ref<(Record<string, unknown>)[]>([])
const commissions = ref<(Record<string, unknown>)[]>([])
const loading = ref(true)
const activeTab = ref('properties')

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    const [agentData, propertiesData, commissionsData] = await Promise.all([
      getAgentById(agentId.value),
      getAgentProperties(agentId.value),
      getAgentCommissions(agentId.value)
    ])

    if (!agentData) {
      toast.add({
        title: 'Error',
        description: 'Agente no encontrado',
        color: 'error'
      })
      router.push('/admin/agentes')
      return
    }

    agent.value = agentData
    properties.value = propertiesData
    commissions.value = commissionsData
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cargar la información del agente',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// Helpers
const getInitials = (name: string | null) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatPrice = (amount: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Tabs
const tabs = [
  { id: 'properties', label: 'Propiedades', icon: 'i-lucide-building-2' },
  { id: 'commissions', label: 'Comisiones', icon: 'i-lucide-wallet' }
]

// Property status
const PROPERTY_STATUS_COLORS: Record<string, string> = {
  disponible: 'success',
  reservada: 'warning',
  alquilada: 'info',
  vendida: 'primary',
  en_mantenimiento: 'neutral'
}

// Commission status
const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  cancelada: 'Cancelada'
}

const COMMISSION_STATUS_COLORS: Record<string, string> = {
  pendiente: 'warning',
  pagada: 'success',
  cancelada: 'neutral'
}

// Verificar agente
const handleVerify = async () => {
  if (!agent.value) return
  
  try {
    await toggleAgentVerification(agent.value.id, !agent.value.is_verified)
    
    toast.add({
      title: agent.value.is_verified ? 'Verificación removida' : 'Agente verificado',
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
  <UDashboardPanel id="agent-detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            label="Volver"
            @click="router.push('/admin/agentes')"
          />
        </template>

        <template #title>
          <span v-if="agent">{{ agent.profile?.full_name }}</span>
          <span v-else>Cargando...</span>
        </template>

        <template #right>
          <UButton 
            v-if="agent"
            :color="agent.is_verified ? 'warning' : 'success'"
            variant="soft"
            :icon="agent.is_verified ? 'i-lucide-shield-off' : 'i-lucide-shield-check'"
            :label="agent.is_verified ? 'Quitar verificación' : 'Verificar'"
            @click="handleVerify"
          />
          <UButton 
            v-if="agent"
            icon="i-lucide-pencil" 
            label="Editar"
            :to="`/admin/agentes/${agentId}/editar`"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="loading" class="p-6 flex items-center justify-center min-h-[400px]">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <!-- Content -->
      <div v-else-if="agent" class="p-6 space-y-6">
        <!-- Header Card with Profile -->
        <UCard>
          <div class="flex flex-col md:flex-row gap-6">
            <!-- Avatar -->
            <div class="shrink-0">
              <div class="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                <img 
                  v-if="agent.profile?.avatar_url"
                  :src="agent.profile.avatar_url"
                  :alt="agent.profile.full_name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-3xl font-semibold text-primary">
                  {{ getInitials(agent.profile?.full_name) }}
                </span>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 space-y-4">
              <div class="flex flex-col md:flex-row md:items-center gap-3">
                <h2 class="text-2xl font-bold">{{ agent.profile?.full_name || 'Sin nombre' }}</h2>
                <div class="flex gap-2">
                  <UBadge
                    :color="(AGENT_VERIFICATION_COLORS[getAgentVerificationStatus(agent)] || 'neutral') as any"
                    variant="soft"
                  >
                    <UIcon v-if="agent.is_verified" name="i-lucide-badge-check" class="size-3 mr-1" />
                    {{ AGENT_VERIFICATION_STATUS[getAgentVerificationStatus(agent)] }}
                  </UBadge>
                  <UBadge variant="soft" color="primary">
                    {{ formatCommissionRate(agent.commission_rate) }} comisión
                  </UBadge>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-mail" class="size-4 text-muted" />
                  <span>{{ agent.profile?.email }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-phone" class="size-4 text-muted" />
                  <span>{{ agent.profile?.phone || 'No registrado' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-id-card" class="size-4 text-muted" />
                  <span>Matrícula: {{ agent.license_number || 'No registrada' }}</span>
                </div>
              </div>

              <!-- Specializations -->
              <div v-if="agent.specialization?.length" class="flex flex-wrap gap-2">
                <UBadge 
                  v-for="spec in agent.specialization" 
                  :key="spec"
                  variant="outline"
                  size="sm"
                >
                  {{ AGENT_SPECIALIZATIONS[spec as keyof typeof AGENT_SPECIALIZATIONS] || spec }}
                </UBadge>
              </div>

              <!-- Bio -->
              <p v-if="agent.bio" class="text-muted">{{ agent.bio }}</p>
            </div>

            <!-- Stats Summary -->
            <div class="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center p-3 bg-muted/30 rounded-lg">
                <p class="text-2xl font-bold">{{ agent.total_sales }}</p>
                <p class="text-sm text-muted">Ventas</p>
              </div>
              <div class="text-center p-3 bg-muted/30 rounded-lg">
                <p class="text-2xl font-bold">{{ agent.total_rentals }}</p>
                <p class="text-sm text-muted">Alquileres</p>
              </div>
              <div class="text-center p-3 bg-muted/30 rounded-lg">
                <div class="flex items-center justify-center gap-1">
                  <UIcon name="i-lucide-star" class="size-5 text-warning" />
                  <p class="text-2xl font-bold">{{ formatRating(agent.rating) }}</p>
                </div>
                <p class="text-sm text-muted">Rating</p>
              </div>
              <div class="text-center p-3 bg-muted/30 rounded-lg">
                <p class="text-2xl font-bold">{{ agent.properties_count }}</p>
                <p class="text-sm text-muted">Propiedades</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Pending Commissions Alert -->
        <UAlert
          v-if="agent.pending_commissions && agent.pending_commissions > 0"
          color="warning"
          icon="i-lucide-wallet"
          :title="`Comisiones pendientes: ${formatPrice(agent.pending_commissions)}`"
          description="Este agente tiene comisiones pendientes de pago."
        />

        <!-- Tabs -->
        <UCard :ui="{ body: { padding: 'p-0 sm:p-0' } }">
          <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #content="{ item }">
              <div class="p-4">
                <!-- Properties Tab -->
                <div v-if="item.id === 'properties'">
                  <div v-if="properties.length" class="space-y-3">
                    <div 
                      v-for="property in properties.slice(0, 10)" 
                      :key="property.id"
                      class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                          <img 
                            v-if="property.images?.[0]"
                            :src="property.images[0]"
                            :alt="property.title"
                            class="w-full h-full object-cover"
                          />
                          <div v-else class="w-full h-full flex items-center justify-center">
                            <UIcon name="i-lucide-building-2" class="size-6 text-muted" />
                          </div>
                        </div>
                        <div>
                          <p class="font-medium">{{ property.title }}</p>
                          <p class="text-sm text-muted">{{ property.address }}, {{ property.city }}</p>
                          <p class="text-sm font-semibold text-primary">{{ formatPrice(property.price, property.currency) }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <UBadge
                          :color="(PROPERTY_STATUS_COLORS[property.status] || 'neutral') as any"
                          variant="soft"
                        >
                          {{ property.status }}
                        </UBadge>
                        <UButton
                          variant="ghost"
                          icon="i-lucide-arrow-right"
                          size="sm"
                          :to="`/admin/propiedades/${property.id}`"
                        />
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-8 text-muted">
                    <UIcon name="i-lucide-building-2" class="size-12 mx-auto mb-2" />
                    <p>No hay propiedades asignadas</p>
                  </div>
                </div>

                <!-- Commissions Tab -->
                <div v-if="item.id === 'commissions'">
                  <div v-if="commissions.length" class="space-y-3">
                    <div 
                      v-for="commission in commissions.slice(0, 10)" 
                      :key="commission.id"
                      class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <UIcon name="i-lucide-wallet" class="size-5" />
                        </div>
                        <div>
                          <p class="font-medium">{{ formatPrice(commission.amount, commission.currency) }}</p>
                          <p class="text-sm text-muted">
                            {{ commission.property?.title || commission.description || 'Comisión' }}
                          </p>
                          <p class="text-xs text-muted">{{ formatDate(commission.created_at) }}</p>
                        </div>
                      </div>
                      <UBadge
                        :color="(COMMISSION_STATUS_COLORS[commission.status] || 'neutral') as any"
                        variant="soft"
                      >
                        {{ COMMISSION_STATUS_LABELS[commission.status] || commission.status }}
                      </UBadge>
                    </div>
                  </div>
                  <div v-else class="text-center py-8 text-muted">
                    <UIcon name="i-lucide-wallet" class="size-12 mx-auto mb-2" />
                    <p>No hay comisiones registradas</p>
                  </div>
                </div>
              </div>
            </template>
          </UTabs>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
