<script setup lang="ts">
import type { Payment } from '~/types/payment.types'
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  formatPeriod
} from '~/types/payment.types'

definePageMeta({
  layout: 'inquilino'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const { fetchTenantPayments, getNextTenantPayment } = usePayments()

// Estado
const payments = ref<Payment[]>([])
const nextPayment = ref<Payment | null>(null)
const loading = ref(true)

// Filtros
const statusFilter = ref<string>('all')

// Opciones de estado
const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'pagado', label: 'Pagados' },
  { value: 'vencido', label: 'Vencidos' }
]

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    const filters: any = {}

    if (statusFilter.value !== 'all') {
      filters.status = statusFilter.value
    }

    const [paymentsResult, next] = await Promise.all([
      fetchTenantPayments(filters),
      getNextTenantPayment()
    ])

    payments.value = paymentsResult.data
    nextPayment.value = next
  } finally {
    loading.value = false
  }
}

// Watch filtros
watch(statusFilter, () => {
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

// Días hasta vencimiento
const getDaysUntilDue = (dueDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Calcular totales
const totals = computed(() => {
  const pendiente = payments.value
    .filter(p => p.status === 'pendiente' || p.status === 'vencido')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const pagadoMes = payments.value
    .filter(p => {
      if (p.status !== 'pagado' || !p.payment_date) return false
      const paymentDate = new Date(p.payment_date)
      const now = new Date()
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, p) => sum + p.amount, 0)

  return { pendiente, pagadoMes }
})
</script>

<template>
  <UDashboardPanel id="inquilino-payments">
    <template #header>
      <UDashboardNavbar title="Mis Pagos">
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
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Próximo Pago Alert -->
        <UCard 
          v-if="nextPayment && (nextPayment.status === 'pendiente' || nextPayment.status === 'vencido')"
          :class="{
            'border-warning': nextPayment.status === 'pendiente' && getDaysUntilDue(nextPayment.due_date) <= 7,
            'border-error': nextPayment.status === 'vencido' || getDaysUntilDue(nextPayment.due_date) < 0
          }"
          class="border-l-4"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div 
                class="p-3 rounded-full"
                :class="{
                  'bg-warning/10': nextPayment.status === 'pendiente',
                  'bg-error/10': nextPayment.status === 'vencido'
                }"
              >
                <UIcon 
                  :name="nextPayment.status === 'vencido' ? 'i-lucide-alert-circle' : 'i-lucide-calendar'" 
                  class="size-6"
                  :class="{
                    'text-warning': nextPayment.status === 'pendiente',
                    'text-error': nextPayment.status === 'vencido'
                  }"
                />
              </div>
              <div>
                <p class="font-semibold text-lg">
                  {{ nextPayment.status === 'vencido' ? '¡Pago Vencido!' : 'Próximo Pago' }}
                </p>
                <p class="text-muted">
                  {{ formatPeriod(nextPayment.period_month, nextPayment.period_year) }}
                  <span v-if="nextPayment.status === 'pendiente'">
                    - Vence el {{ formatDate(nextPayment.due_date) }}
                  </span>
                </p>
                <p 
                  v-if="nextPayment.status === 'pendiente'"
                  class="text-sm mt-1"
                  :class="getDaysUntilDue(nextPayment.due_date) <= 3 ? 'text-error font-medium' : 'text-muted'"
                >
                  {{ getDaysUntilDue(nextPayment.due_date) > 0 
                    ? `Faltan ${getDaysUntilDue(nextPayment.due_date)} días` 
                    : getDaysUntilDue(nextPayment.due_date) === 0 
                      ? '¡Vence hoy!' 
                      : 'Vencido' 
                  }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-3xl font-bold">
                {{ formatPrice(nextPayment.amount, nextPayment.currency) }}
              </p>
              <p v-if="nextPayment.late_fee > 0" class="text-sm text-error">
                +{{ formatPrice(nextPayment.late_fee) }} de mora
              </p>
            </div>
          </div>
        </UCard>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UCard>
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-full bg-warning/10">
                <UIcon name="i-lucide-clock" class="size-6 text-warning" />
              </div>
              <div>
                <p class="text-sm text-muted">Total Pendiente</p>
                <p class="text-2xl font-bold">{{ formatPrice(totals.pendiente) }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-full bg-success/10">
                <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
              </div>
              <div>
                <p class="text-sm text-muted">Pagado este mes</p>
                <p class="text-2xl font-bold text-success">{{ formatPrice(totals.pagadoMes) }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Filter -->
        <div class="flex justify-end">
          <USelectMenu
            v-model="statusFilter"
            :items="statusOptions"
            value-key="value"
            class="w-48"
          />
        </div>

        <!-- Payments List -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
        </div>

        <div v-else-if="payments.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-credit-card" class="size-16 mx-auto mb-4 text-muted" />
          <h3 class="text-lg font-semibold mb-2">No hay pagos</h3>
          <p class="text-muted">No se encontraron pagos para mostrar.</p>
        </div>

        <div v-else class="space-y-4">
          <UCard 
            v-for="payment in payments" 
            :key="payment.id"
            class="cursor-pointer hover:bg-muted/50 transition-colors"
            @click="navigateTo(`/inquilino/pagos/${payment.id}`)"
          >
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div 
                  class="p-3 rounded-full"
                  :class="{
                    'bg-warning/10': payment.status === 'pendiente',
                    'bg-success/10': payment.status === 'pagado',
                    'bg-error/10': payment.status === 'vencido',
                    'bg-neutral/10': payment.status === 'cancelado'
                  }"
                >
                  <UIcon 
                    :name="payment.status === 'pagado' ? 'i-lucide-check-circle' : 
                           payment.status === 'vencido' ? 'i-lucide-alert-circle' :
                           payment.status === 'cancelado' ? 'i-lucide-x-circle' : 'i-lucide-clock'"
                    class="size-6"
                    :class="{
                      'text-warning': payment.status === 'pendiente',
                      'text-success': payment.status === 'pagado',
                      'text-error': payment.status === 'vencido',
                      'text-neutral': payment.status === 'cancelado'
                    }"
                  />
                </div>
                <div>
                  <p class="font-semibold">
                    {{ formatPeriod(payment.period_month, payment.period_year) }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ payment.contract?.property?.title || 'Propiedad' }}
                  </p>
                  <p class="text-xs text-muted">
                    Vencimiento: {{ formatDate(payment.due_date) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-xl font-bold">
                    {{ formatPrice(payment.amount, payment.currency) }}
                  </p>
                  <UBadge
                    :color="(PAYMENT_STATUS_COLORS[payment.status as keyof typeof PAYMENT_STATUS_COLORS] || 'neutral') as any"
                    variant="soft"
                    size="sm"
                  >
                    {{ PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS] }}
                  </UBadge>
                </div>
                <UIcon name="i-lucide-chevron-right" class="size-5 text-muted" />
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
