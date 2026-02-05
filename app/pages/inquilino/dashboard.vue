<script setup lang="ts">
import type { Contract } from '~/types/contract.types'
import type { Payment } from '~/types/payment.types'
import type { MaintenanceRequest } from '~/composables/useMaintenance'

definePageMeta({
  layout: 'inquilino'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const user = useSupabaseUser()
const { fetchContracts } = useContracts()
const { getNextTenantPayment } = usePayments()
const { fetchRequests, requests: allRequests } = useMaintenance()

// Estado reactivo
const loading = ref(true)
const contract = ref<Contract | null>(null)
const nextPayment = ref<Payment | null>(null)
const requests = computed(() => allRequests.value.slice(0, 2))

// Valores derivados
const property = computed(() => contract.value?.property || null)
const daysRemaining = computed(() => {
  if (!contract.value?.end_date) return 0
  const endDate = new Date(contract.value.end_date)
  const today = new Date()
  const diff = endDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const formatPrice = (price: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(price)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getDaysUntilDue = (dueDate: string) => {
  const due = new Date(dueDate)
  const today = new Date()
  const diff = due.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    if (!user.value?.id) return

    // Obtener contrato activo del inquilino
    const { data: contractsData } = await fetchContracts({
      tenant_id: user.value.id,
      status: 'activo'
    })

    if (contractsData && contractsData.length > 0) {
      contract.value = contractsData[0]
    }

    // Obtener próximo pago
    nextPayment.value = await getNextTenantPayment()

    // Obtener solicitudes de mantenimiento recientes
    await fetchRequests({
      tenant_id: user.value.id
    })
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <UDashboardPanel id="inquilino-home">
    <template #header>
      <UDashboardNavbar title="Mi Portal" :ui="{ right: 'gap-3' }">
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
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <USkeleton class="h-32 w-full rounded-lg" />
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <USkeleton class="h-24 w-full rounded-lg" />
            <USkeleton class="h-24 w-full rounded-lg" />
            <USkeleton class="h-24 w-full rounded-lg" />
          </div>
        </div>

        <!-- Content -->
        <div v-else class="space-y-6">
          <!-- Property Card -->
          <UCard v-if="property" class="overflow-hidden">
            <div class="flex flex-col md:flex-row gap-6">
              <div class="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-muted">
                <img 
                  v-if="property.images?.[0]"
                  :src="property.images[0]" 
                  :alt="property.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-lucide-image" class="size-8 text-muted" />
                </div>
              </div>
              <div class="flex-1">
                <h2 class="text-xl font-bold">Mi Propiedad</h2>
                <p class="text-lg mt-1">{{ property.title }}</p>
                <p class="text-muted">{{ property.address }}, {{ property.city }}</p>
                <UBadge v-if="property.property_type" variant="soft" class="mt-2">{{ property.property_type }}</UBadge>
              </div>
            </div>
          </UCard>

          <!-- No Property Alert -->
          <UAlert v-else color="warning" icon="i-lucide-alert-triangle" title="Sin contrato activo">
            No tienes un contrato activo en este momento. Contacta al administrador para más información.
          </UAlert>

          <!-- Quick Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Contract Status -->
            <UCard v-if="contract">
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-full bg-primary/10">
                  <UIcon name="i-lucide-file-text" class="size-6 text-primary" />
                </div>
                <div>
                  <p class="text-sm text-muted">Contrato</p>
                  <p class="font-bold">{{ formatDate(contract.start_date) }} - {{ formatDate(contract.end_date) }}</p>
                  <p class="text-xs text-muted">{{ daysRemaining }} días restantes</p>
                </div>
              </div>
            </UCard>

            <!-- Monthly Rent -->
            <UCard v-if="contract">
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-full bg-success/10">
                  <UIcon name="i-lucide-dollar-sign" class="size-6 text-success" />
                </div>
                <div>
                  <p class="text-sm text-muted">Alquiler Mensual</p>
                  <p class="font-bold text-xl">{{ formatPrice(contract.monthly_rent, contract.currency) }}</p>
                </div>
              </div>
            </UCard>

            <!-- Next Payment -->
            <UCard 
              v-if="nextPayment"
              :class="getDaysUntilDue(nextPayment.due_date) <= 5 ? 'ring-2 ring-warning' : ''"
            >
              <div class="flex items-center gap-4">
                <div 
                  class="p-3 rounded-full"
                  :class="getDaysUntilDue(nextPayment.due_date) <= 5 ? 'bg-warning/10' : 'bg-primary/10'"
                >
                  <UIcon 
                    name="i-lucide-calendar" 
                    class="size-6" 
                    :class="getDaysUntilDue(nextPayment.due_date) <= 5 ? 'text-warning' : 'text-primary'"
                  />
                </div>
                <div>
                  <p class="text-sm text-muted">Próximo Pago</p>
                  <p class="font-bold">{{ formatPrice(nextPayment.amount, nextPayment.currency) }}</p>
                  <p class="text-xs text-muted">Vence: {{ formatDate(nextPayment.due_date) }}</p>
                </div>
              </div>
            </UCard>

            <!-- No Pending Payments -->
            <UCard v-else class="md:col-span-3">
              <div class="flex items-center gap-4 text-success">
                <div class="p-3 rounded-full bg-success/10">
                  <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
                </div>
                <div>
                  <p class="text-sm text-muted">Estado de Pagos</p>
                  <p class="font-bold">¡Al día!</p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Actions & Requests -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Quick Actions -->
            <UCard>
              <template #header>
                <h3 class="font-semibold">Acciones Rápidas</h3>
              </template>
              <div class="grid grid-cols-2 gap-3">
                <UButton variant="soft" class="justify-start h-auto py-4 flex-col gap-2" to="/inquilino/pagos">
                  <UIcon name="i-lucide-credit-card" class="size-6" />
                  <span>Pagar Ahora</span>
                </UButton>
                <UButton variant="soft" class="justify-start h-auto py-4 flex-col gap-2" to="/inquilino/mantenimiento/nuevo">
                  <UIcon name="i-lucide-wrench" class="size-6" />
                  <span>Reportar Problema</span>
                </UButton>
                <UButton variant="soft" class="justify-start h-auto py-4 flex-col gap-2" to="/inquilino/contrato" :disabled="!contract">
                  <UIcon name="i-lucide-file-text" class="size-6" />
                  <span>Ver Contrato</span>
                </UButton>
                <UButton variant="soft" class="justify-start h-auto py-4 flex-col gap-2" to="/inquilino/documentos">
                  <UIcon name="i-lucide-download" class="size-6" />
                  <span>Documentos</span>
                </UButton>
              </div>
            </UCard>

            <!-- Recent Requests -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold">Mis Solicitudes</h3>
                  <UButton variant="ghost" size="sm" label="Ver todas" to="/inquilino/mantenimiento" />
                </div>
              </template>
              <div class="divide-y divide-default">
                <div 
                  v-for="request in requests" 
                  :key="request.id"
                  class="py-3 flex items-center justify-between"
                >
                  <div>
                    <p class="font-medium text-sm">{{ request.category || 'Mantenimiento' }}</p>
                    <p class="text-sm text-muted">{{ request.title }}</p>
                  </div>
                  <div class="text-right">
                    <UBadge 
                      :color="request.status === 'completado' ? 'success' : request.status === 'en_proceso' ? 'warning' : 'neutral'"
                      variant="soft"
                      size="sm"
                    >
                      {{ request.status?.replace('_', ' ').toUpperCase() }}
                    </UBadge>
                    <p class="text-xs text-muted mt-1">{{ formatDate(request.reported_date) }}</p>
                  </div>
                </div>

                <div v-if="requests.length === 0" class="py-6 text-center text-muted">
                  No tienes solicitudes recientes
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
