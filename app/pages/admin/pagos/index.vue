<script setup lang="ts">
import type { Payment } from '~/types/payment.types'
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  formatPeriod
} from '~/types/payment.types'

definePageMeta({
  layout: 'admin'
})

const { isNotificationsSlideoverOpen } = useDashboard()
const { 
  fetchPayments, 
  getPaymentStats, 
  registerPayment, 
  updatePaymentStatus 
} = usePayments()
const toast = useToast()

// Estado
const payments = ref<Payment[]>([])
const loading = ref(false)
const stats = ref({
  totalPendiente: 0,
  totalPagado: 0,
  totalVencido: 0,
  countPendiente: 0,
  countPagado: 0,
  countVencido: 0
})

// Filtros
const searchQuery = ref('')
const statusFilter = ref<string>('all')
const periodYear = ref(new Date().getFullYear())
const periodMonth = ref<number | null>(null)

// Modal de pago
const showPaymentModal = ref(false)
const selectedPayment = ref<Payment | null>(null)
const paymentMethod = ref<'efectivo' | 'transferencia'>('transferencia')
const paymentDate = ref(new Date().toISOString().split('T')[0])
const receiptNumber = ref('')

// Columnas de la tabla
const columns = [
  { id: 'tenant', header: 'Inquilino' },
  { id: 'property', header: 'Propiedad' },
  { id: 'period', header: 'Período' },
  { id: 'amount', header: 'Monto' },
  { id: 'due_date', header: 'Vencimiento' },
  { id: 'status', header: 'Estado' },
  { id: 'payment_method', header: 'Método' },
  { id: 'actions', header: '' }
]

// Opciones de estado
const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'pagado', label: 'Pagados' },
  { value: 'vencido', label: 'Vencidos' },
  { value: 'cancelado', label: 'Cancelados' }
]

// Opciones de mes
const monthOptions = [
  { value: null, label: 'Todos los meses' },
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    const filters: { search?: string; status?: string; period_month?: number; period_year?: number } = {}

    if (searchQuery.value) {
      filters.search = searchQuery.value
    }

    if (statusFilter.value !== 'all') {
      filters.status = statusFilter.value
    }

    if (periodMonth.value) {
      filters.period_month = periodMonth.value
      filters.period_year = periodYear.value
    }

    const [paymentsResult, statsResult] = await Promise.all([
      fetchPayments(filters),
      getPaymentStats(periodYear.value, periodMonth.value || undefined)
    ])

    payments.value = paymentsResult.data
    stats.value = statsResult
  } finally {
    loading.value = false
  }
}

// Watch filtros
watch([searchQuery, statusFilter, periodMonth, periodYear], () => {
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

// Abrir modal de pago
const openPaymentModal = (payment: Payment) => {
  selectedPayment.value = payment
  paymentMethod.value = 'transferencia'
  paymentDate.value = new Date().toISOString().split('T')[0]
  receiptNumber.value = ''
  showPaymentModal.value = true
}

// Registrar pago
const handleRegisterPayment = async () => {
  if (!selectedPayment.value) return

  try {
    await registerPayment(
      selectedPayment.value.id,
      paymentMethod.value,
      paymentDate.value,
      receiptNumber.value || undefined
    )

    toast.add({
      title: 'Pago registrado',
      description: 'El pago fue registrado correctamente',
      color: 'success'
    })

    showPaymentModal.value = false
    selectedPayment.value = null
    loadData()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo registrar el pago',
      color: 'error'
    })
  }
}

// Cancelar pago
const handleCancelPayment = async (payment: Payment) => {
  try {
    await updatePaymentStatus(payment.id, 'cancelado')
    
    toast.add({
      title: 'Pago cancelado',
      description: 'El pago fue cancelado correctamente',
      color: 'success'
    })

    loadData()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cancelar el pago',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="admin-payments">
    <template #header>
      <UDashboardNavbar title="Pagos">
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
            to="/admin/pagos/nuevo"
          >
            Nuevo Pago
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
                <p class="text-sm text-muted">Total Pagos</p>
                <p class="text-2xl font-bold">{{ stats.countPendiente + stats.countPagado + stats.countVencido }}</p>
              </div>
              <UIcon name="i-lucide-credit-card" class="size-6 text-primary" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Pendientes</p>
                <p class="text-2xl font-bold text-warning">{{ stats.countPendiente }}</p>
                <p class="text-xs text-muted">{{ formatPrice(stats.totalPendiente) }}</p>
              </div>
              <UIcon name="i-lucide-clock" class="size-6 text-warning" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Pagados</p>
                <p class="text-2xl font-bold text-success">{{ stats.countPagado }}</p>
                <p class="text-xs text-muted">{{ formatPrice(stats.totalPagado) }}</p>
              </div>
              <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted">Vencidos</p>
                <p class="text-2xl font-bold text-error">{{ stats.countVencido }}</p>
                <p class="text-xs text-muted">{{ formatPrice(stats.totalVencido) }}</p>
              </div>
              <UIcon name="i-lucide-alert-circle" class="size-6 text-error" />
            </div>
          </UCard>
        </div>

        <!-- Filters -->
        <UCard>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <UInput
                v-model="searchQuery"
                placeholder="Buscar por inquilino o propiedad..."
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

            <USelectMenu
              v-model="periodMonth"
              :items="monthOptions"
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
              :data="payments"
              :loading="loading"
              class="min-w-[900px]"
            >
              <template #tenant-cell="{ row }">
                <div class="min-w-[150px]">
                  <p class="font-medium">{{ row.original.tenant?.full_name || 'Sin nombre' }}</p>
                  <p class="text-sm text-muted">{{ row.original.tenant?.email }}</p>
                </div>
              </template>

              <template #property-cell="{ row }">
                <div class="min-w-[180px]">
                  <p class="font-medium">{{ row.original.contract?.property?.title || 'Sin propiedad' }}</p>
                  <p class="text-sm text-muted">{{ row.original.contract?.property?.city }}</p>
                </div>
              </template>

              <template #period-cell="{ row }">
                <span class="whitespace-nowrap">
                  {{ formatPeriod(row.original.period_month, row.original.period_year) }}
                </span>
              </template>

              <template #amount-cell="{ row }">
                <div>
                  <span class="font-semibold whitespace-nowrap">
                    {{ formatPrice(row.original.amount, row.original.currency) }}
                  </span>
                  <span 
                    v-if="row.original.late_fee > 0" 
                    class="block text-xs text-error"
                  >
                    +{{ formatPrice(row.original.late_fee) }} mora
                  </span>
                </div>
              </template>

              <template #due_date-cell="{ row }">
                <div>
                  <p class="whitespace-nowrap">{{ formatDate(row.original.due_date) }}</p>
                  <p 
                    v-if="row.original.status === 'pendiente'"
                    class="text-xs"
                    :class="getDaysUntilDue(row.original.due_date) <= 3 ? 'text-error' : 'text-muted'"
                  >
                    {{ getDaysUntilDue(row.original.due_date) > 0 
                      ? `En ${getDaysUntilDue(row.original.due_date)} días` 
                      : getDaysUntilDue(row.original.due_date) === 0 
                        ? 'Hoy' 
                        : 'Vencido' 
                    }}
                  </p>
                </div>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :color="(PAYMENT_STATUS_COLORS[row.original.status as keyof typeof PAYMENT_STATUS_COLORS] || 'neutral') as any"
                  variant="soft"
                >
                  {{ PAYMENT_STATUS_LABELS[row.original.status as keyof typeof PAYMENT_STATUS_LABELS] || row.original.status }}
                </UBadge>
              </template>

              <template #payment_method-cell="{ row }">
                <span v-if="row.original.payment_method">
                  {{ PAYMENT_METHOD_LABELS[row.original.payment_method as keyof typeof PAYMENT_METHOD_LABELS] || row.original.payment_method }}
                </span>
                <span v-else class="text-muted">-</span>
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
                      @click="navigateTo(`/admin/pagos/${row.original.id}`)"
                    />
                  </UTooltip>

                  <UTooltip 
                    v-if="row.original.status === 'pendiente' || row.original.status === 'vencido'" 
                    text="Registrar pago"
                  >
                    <UButton
                      color="success"
                      variant="ghost"
                      icon="i-lucide-check"
                      size="sm"
                      square
                      @click="openPaymentModal(row.original)"
                    />
                  </UTooltip>

                  <UTooltip 
                    v-if="row.original.status === 'pendiente'" 
                    text="Cancelar"
                  >
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-lucide-x"
                      size="sm"
                      square
                      @click="handleCancelPayment(row.original)"
                    />
                  </UTooltip>
                </div>
              </template>
            </UTable>
          </div>

          <!-- Empty State -->
          <div v-if="!loading && payments.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-credit-card" class="size-16 mx-auto mb-4 text-muted" />
            <h3 class="text-lg font-semibold mb-2">No hay pagos</h3>
            <p class="text-muted">No se encontraron pagos con los filtros seleccionados.</p>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Payment Modal -->
  <UModal v-model:open="showPaymentModal">
    <template #content>
      <div class="p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="p-3 rounded-full bg-success/10">
            <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
          </div>
          <div>
            <h3 class="font-semibold text-lg">Registrar Pago</h3>
            <p class="text-sm text-muted">{{ selectedPayment?.tenant?.full_name }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="p-4 rounded-lg bg-muted/50">
            <div class="flex justify-between items-center">
              <span class="text-muted">Monto</span>
              <span class="text-xl font-bold">
                {{ selectedPayment ? formatPrice(selectedPayment.amount, selectedPayment.currency) : '' }}
              </span>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-muted">Período</span>
              <span>
                {{ selectedPayment ? formatPeriod(selectedPayment.period_month, selectedPayment.period_year) : '' }}
              </span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Método de pago</label>
            <USelectMenu
              v-model="paymentMethod"
              :items="PAYMENT_METHOD_OPTIONS"
              value-key="value"
              size="lg"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Fecha de pago</label>
            <UInput
              v-model="paymentDate"
              type="date"
              size="lg"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Número de recibo (opcional)</label>
            <UInput
              v-model="receiptNumber"
              placeholder="Ej: 0001-00000123"
              size="lg"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <UButton variant="ghost" @click="showPaymentModal = false">
            Cancelar
          </UButton>
          <UButton color="success" @click="handleRegisterPayment">
            Confirmar Pago
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
