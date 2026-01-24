<script setup lang="ts">
import type { TenantWithDetails } from '~/types/tenant.types'
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

const route = useRoute()
const router = useRouter()
const { 
  getTenantById, 
  getTenantPayments, 
  getTenantMaintenanceRequests 
} = useTenants()
const toast = useToast()

const tenantId = computed(() => route.params.id as string)

// Estado
const tenant = ref<TenantWithDetails | null>(null)
const payments = ref<any[]>([])
const maintenanceRequests = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('contracts')

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    const [tenantData, paymentsData, maintenanceData] = await Promise.all([
      getTenantById(tenantId.value),
      getTenantPayments(tenantId.value),
      getTenantMaintenanceRequests(tenantId.value)
    ])

    if (!tenantData) {
      toast.add({
        title: 'Error',
        description: 'Inquilino no encontrado',
        color: 'error'
      })
      router.push('/admin/inquilinos')
      return
    }

    tenant.value = tenantData
    payments.value = paymentsData
    maintenanceRequests.value = maintenanceData
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cargar la información del inquilino',
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

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatPrice = (amount: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

// Tabs
const tabs = [
  { id: 'contracts', label: 'Contratos', icon: 'i-lucide-file-text' },
  { id: 'payments', label: 'Pagos', icon: 'i-lucide-credit-card' },
  { id: 'maintenance', label: 'Mantenimiento', icon: 'i-lucide-wrench' }
]

// Payment status
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  vencido: 'Vencido',
  cancelado: 'Cancelado'
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendiente: 'warning',
  pagado: 'success',
  vencido: 'error',
  cancelado: 'neutral'
}

// Contract status
const CONTRACT_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  activo: 'Activo',
  vencido: 'Vencido',
  cancelado: 'Cancelado'
}

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  pendiente: 'warning',
  activo: 'success',
  vencido: 'error',
  cancelado: 'neutral'
}

// Maintenance status
const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado'
}

const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  pendiente: 'warning',
  en_proceso: 'info',
  completado: 'success',
  cancelado: 'neutral'
}
</script>

<template>
  <UDashboardPanel id="tenant-detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push('/admin/inquilinos')"
          >
            Volver
          </UButton>
        </template>

        <template #title>
          <span v-if="tenant">{{ tenant.full_name }}</span>
          <span v-else>Cargando...</span>
        </template>

        <template #right>
          <UButton 
            v-if="tenant"
            icon="i-lucide-pencil" 
            :to="`/admin/inquilinos/${tenantId}/editar`"
          >
            Editar
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="loading" class="p-6 flex items-center justify-center min-h-[400px]">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <!-- Content -->
      <div v-else-if="tenant" class="p-6 space-y-6">
        <!-- Header Card with Profile -->
        <UCard>
          <div class="flex flex-col md:flex-row gap-6">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div class="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                <img 
                  v-if="tenant.avatar_url"
                  :src="tenant.avatar_url"
                  :alt="tenant.full_name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-3xl font-semibold text-primary">
                  {{ getInitials(tenant.full_name) }}
                </span>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 space-y-4">
              <div class="flex flex-col md:flex-row md:items-center gap-3">
                <h2 class="text-2xl font-bold">{{ tenant.full_name || 'Sin nombre' }}</h2>
                <div class="flex gap-2">
                  <UBadge
                    :color="(TENANT_CONTRACT_COLORS[getTenantContractStatus(tenant)] || 'neutral') as any"
                    variant="soft"
                  >
                    {{ TENANT_CONTRACT_STATUS[getTenantContractStatus(tenant)] }}
                  </UBadge>
                  <UBadge
                    :color="(TENANT_PAYMENT_COLORS[getTenantPaymentStatus(tenant)] || 'neutral') as any"
                    variant="soft"
                  >
                    {{ TENANT_PAYMENT_STATUS[getTenantPaymentStatus(tenant)] }}
                  </UBadge>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-mail" class="size-4 text-muted" />
                  <span>{{ tenant.email }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-phone" class="size-4 text-muted" />
                  <span>{{ tenant.phone || 'No registrado' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-id-card" class="size-4 text-muted" />
                  <span>DNI: {{ tenant.dni || 'No registrado' }}</span>
                </div>
              </div>

              <div v-if="tenant.address" class="flex items-start gap-2">
                <UIcon name="i-lucide-map-pin" class="size-4 text-muted mt-0.5" />
                <span>{{ tenant.address }}</span>
              </div>
            </div>

            <!-- Stats Summary -->
            <div class="flex-shrink-0 grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-muted/30 rounded-lg">
                <p class="text-2xl font-bold">{{ tenant.contracts?.length || 0 }}</p>
                <p class="text-sm text-muted">Contratos</p>
              </div>
              <div class="text-center p-3 bg-muted/30 rounded-lg">
                <p class="text-2xl font-bold">{{ tenant.payments_summary?.total || 0 }}</p>
                <p class="text-sm text-muted">Pagos</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Current Property -->
        <UCard v-if="tenant.current_contract?.property">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-home" class="size-5 text-primary" />
              <h3 class="font-semibold">Propiedad Actual</h3>
            </div>
          </template>

          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
              <img 
                v-if="tenant.current_contract.property.images?.[0]"
                :src="tenant.current_contract.property.images[0]"
                :alt="tenant.current_contract.property.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-building-2" class="size-8 text-muted" />
              </div>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-lg">{{ tenant.current_contract.property.title }}</p>
              <p class="text-muted">{{ tenant.current_contract.property.address }}, {{ tenant.current_contract.property.city }}</p>
              <p class="text-sm mt-1">
                Alquiler: <span class="font-semibold">{{ formatPrice(tenant.current_contract.monthly_rent, tenant.current_contract.currency) }}</span>/mes
              </p>
            </div>
            <UButton
              variant="soft"
              :to="`/admin/contratos/${tenant.current_contract.id}`"
            >
              Ver Contrato
            </UButton>
          </div>
        </UCard>

        <!-- Tabs -->
        <UCard :ui="{ body: { padding: 'p-0 sm:p-0' } }">
          <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #content="{ item }">
              <div class="p-4">
                <!-- Contracts Tab -->
                <div v-if="item.id === 'contracts'">
                  <div v-if="tenant.contracts?.length" class="space-y-3">
                    <div 
                      v-for="contract in tenant.contracts" 
                      :key="contract.id"
                      class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <UIcon name="i-lucide-file-text" class="size-5" />
                        </div>
                        <div>
                          <p class="font-medium">{{ contract.property?.title || 'Propiedad' }}</p>
                          <p class="text-sm text-muted">
                            {{ formatDate(contract.start_date) }} - {{ formatDate(contract.end_date) }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <UBadge
                          :color="(CONTRACT_STATUS_COLORS[contract.status] || 'neutral') as any"
                          variant="soft"
                        >
                          {{ CONTRACT_STATUS_LABELS[contract.status] || contract.status }}
                        </UBadge>
                        <UButton
                          variant="ghost"
                          icon="i-lucide-arrow-right"
                          size="sm"
                          :to="`/admin/contratos/${contract.id}`"
                        />
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-8 text-muted">
                    <UIcon name="i-lucide-file-x" class="size-12 mx-auto mb-2" />
                    <p>No hay contratos registrados</p>
                  </div>
                </div>

                <!-- Payments Tab -->
                <div v-if="item.id === 'payments'">
                  <div v-if="payments.length" class="space-y-3">
                    <div 
                      v-for="payment in payments.slice(0, 10)" 
                      :key="payment.id"
                      class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <UIcon name="i-lucide-credit-card" class="size-5" />
                        </div>
                        <div>
                          <p class="font-medium">{{ formatPrice(payment.amount, payment.currency) }}</p>
                          <p class="text-sm text-muted">
                            Vence: {{ formatDate(payment.due_date) }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <UBadge
                          :color="(PAYMENT_STATUS_COLORS[payment.status] || 'neutral') as any"
                          variant="soft"
                        >
                          {{ PAYMENT_STATUS_LABELS[payment.status] || payment.status }}
                        </UBadge>
                        <UButton
                          variant="ghost"
                          icon="i-lucide-arrow-right"
                          size="sm"
                          :to="`/admin/pagos/${payment.id}`"
                        />
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-8 text-muted">
                    <UIcon name="i-lucide-credit-card" class="size-12 mx-auto mb-2" />
                    <p>No hay pagos registrados</p>
                  </div>
                </div>

                <!-- Maintenance Tab -->
                <div v-if="item.id === 'maintenance'">
                  <div v-if="maintenanceRequests.length" class="space-y-3">
                    <div 
                      v-for="request in maintenanceRequests.slice(0, 10)" 
                      :key="request.id"
                      class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <UIcon name="i-lucide-wrench" class="size-5" />
                        </div>
                        <div>
                          <p class="font-medium">{{ request.title }}</p>
                          <p class="text-sm text-muted">
                            {{ formatDate(request.created_at) }} • {{ request.property?.title }}
                          </p>
                        </div>
                      </div>
                      <UBadge
                        :color="(MAINTENANCE_STATUS_COLORS[request.status] || 'neutral') as any"
                        variant="soft"
                      >
                        {{ MAINTENANCE_STATUS_LABELS[request.status] || request.status }}
                      </UBadge>
                    </div>
                  </div>
                  <div v-else class="text-center py-8 text-muted">
                    <UIcon name="i-lucide-wrench" class="size-12 mx-auto mb-2" />
                    <p>No hay solicitudes de mantenimiento</p>
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
