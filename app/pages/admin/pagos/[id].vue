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

const route = useRoute()
const router = useRouter()
const { fetchPayment, registerPayment, updatePaymentStatus } = usePayments()
const toast = useToast()

// Estado
const payment = ref<Payment | null>(null)
const loading = ref(true)

// Modal de pago
const showPaymentModal = ref(false)
const paymentMethod = ref<'efectivo' | 'transferencia'>('transferencia')
const paymentDate = ref(new Date().toISOString().split('T')[0])
const receiptNumber = ref('')

// Cargar pago
const loadPayment = async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    payment.value = await fetchPayment(id)
    
    if (!payment.value) {
      toast.add({
        title: 'Error',
        description: 'No se encontró el pago',
        color: 'error'
      })
      router.push('/admin/pagos')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPayment()
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
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Abrir modal de pago
const openPaymentModal = () => {
  paymentMethod.value = 'transferencia'
  paymentDate.value = new Date().toISOString().split('T')[0]
  receiptNumber.value = ''
  showPaymentModal.value = true
}

// Registrar pago
const handleRegisterPayment = async () => {
  if (!payment.value) return

  try {
    await registerPayment(
      payment.value.id,
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
    loadPayment()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo registrar el pago',
      color: 'error'
    })
  }
}

// Cancelar pago
const handleCancelPayment = async () => {
  if (!payment.value) return

  try {
    await updatePaymentStatus(payment.value.id, 'cancelado')
    
    toast.add({
      title: 'Pago cancelado',
      description: 'El pago fue cancelado correctamente',
      color: 'success'
    })

    loadPayment()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cancelar el pago',
      color: 'error'
    })
  }
}

// Revertir a pendiente
const handleRevertPayment = async () => {
  if (!payment.value) return

  try {
    await updatePaymentStatus(payment.value.id, 'pendiente')
    
    toast.add({
      title: 'Pago revertido',
      description: 'El pago fue marcado como pendiente',
      color: 'success'
    })

    loadPayment()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo revertir el pago',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="admin-payment-detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push('/admin/pagos')"
          />
        </template>

        <template #title>
          <span v-if="payment">
            Pago - {{ formatPeriod(payment.period_month, payment.period_year) }}
          </span>
          <span v-else>Detalle de Pago</span>
        </template>

        <template #right>
          <template v-if="payment">
            <UButton
              v-if="payment.status === 'pendiente' || payment.status === 'vencido'"
              color="success"
              icon="i-lucide-check"
              @click="openPaymentModal"
            >
              Registrar Pago
            </UButton>
            <UButton
              v-if="payment.status === 'pagado'"
              color="warning"
              variant="soft"
              icon="i-lucide-undo"
              @click="handleRevertPayment"
            >
              Revertir
            </UButton>
            <UButton
              v-if="payment.status === 'pendiente'"
              color="error"
              variant="ghost"
              icon="i-lucide-x"
              @click="handleCancelPayment"
            >
              Cancelar
            </UButton>
          </template>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="p-6 flex items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
      </div>

      <div v-else-if="payment" class="p-6 space-y-6">
        <!-- Status Banner -->
        <UCard 
          :class="{
            'border-warning': payment.status === 'pendiente',
            'border-success': payment.status === 'pagado',
            'border-error': payment.status === 'vencido',
            'border-neutral': payment.status === 'cancelado'
          }"
          class="border-l-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <UIcon 
                :name="payment.status === 'pagado' ? 'i-lucide-check-circle' : 
                       payment.status === 'vencido' ? 'i-lucide-alert-circle' :
                       payment.status === 'cancelado' ? 'i-lucide-x-circle' : 'i-lucide-clock'"
                class="size-8"
                :class="{
                  'text-warning': payment.status === 'pendiente',
                  'text-success': payment.status === 'pagado',
                  'text-error': payment.status === 'vencido',
                  'text-neutral': payment.status === 'cancelado'
                }"
              />
              <div>
                <p class="text-sm text-muted">Estado del pago</p>
                <UBadge
                  :color="(PAYMENT_STATUS_COLORS[payment.status as keyof typeof PAYMENT_STATUS_COLORS] || 'neutral') as any"
                  variant="soft"
                  size="lg"
                >
                  {{ PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS] }}
                </UBadge>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-muted">Monto</p>
              <p class="text-3xl font-bold">
                {{ formatPrice(payment.amount, payment.currency) }}
              </p>
              <p v-if="payment.late_fee > 0" class="text-sm text-error">
                +{{ formatPrice(payment.late_fee) }} de mora
              </p>
            </div>
          </div>
        </UCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Información del Pago -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-receipt" class="size-5 text-primary" />
                <h3 class="font-semibold">Información del Pago</h3>
              </div>
            </template>

            <dl class="space-y-4">
              <div class="flex justify-between">
                <dt class="text-muted">Período</dt>
                <dd class="font-medium">{{ formatPeriod(payment.period_month, payment.period_year) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Fecha de vencimiento</dt>
                <dd class="font-medium">{{ formatDate(payment.due_date) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Fecha de pago</dt>
                <dd class="font-medium">{{ formatDate(payment.payment_date) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Método de pago</dt>
                <dd class="font-medium">
                  {{ payment.payment_method 
                    ? PAYMENT_METHOD_LABELS[payment.payment_method as keyof typeof PAYMENT_METHOD_LABELS] 
                    : '-' }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Número de recibo</dt>
                <dd class="font-medium">{{ payment.receipt_number || '-' }}</dd>
              </div>
              <div v-if="payment.notes" class="pt-4 border-t border-default">
                <dt class="text-muted mb-2">Notas</dt>
                <dd>{{ payment.notes }}</dd>
              </div>
            </dl>
          </UCard>

          <!-- Inquilino -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-user" class="size-5 text-primary" />
                <h3 class="font-semibold">Inquilino</h3>
              </div>
            </template>

            <div v-if="payment.tenant" class="space-y-4">
              <div class="flex items-center gap-4">
                <UAvatar 
                  :alt="payment.tenant.full_name || 'User'"
                  size="lg"
                />
                <div>
                  <p class="font-semibold text-lg">{{ payment.tenant.full_name || 'Sin nombre' }}</p>
                  <p class="text-muted">{{ payment.tenant.email }}</p>
                </div>
              </div>

              <div class="pt-4 border-t border-default space-y-3">
                <div class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-mail" class="size-4 text-muted" />
                  <span>{{ payment.tenant.email }}</span>
                </div>
                <div v-if="payment.tenant.phone" class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-phone" class="size-4 text-muted" />
                  <span>{{ payment.tenant.phone }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-muted">
              No hay información del inquilino
            </div>
          </UCard>

          <!-- Propiedad -->
          <UCard class="lg:col-span-2">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-building-2" class="size-5 text-primary" />
                <h3 class="font-semibold">Propiedad</h3>
              </div>
            </template>

            <div v-if="payment.contract?.property" class="flex flex-col md:flex-row gap-6">
              <div class="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
                <img 
                  v-if="payment.contract.property.images?.[0]"
                  :src="payment.contract.property.images[0]"
                  :alt="payment.contract.property.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-lucide-image" class="size-8 text-muted" />
                </div>
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-semibold">{{ payment.contract.property.title }}</h4>
                <p class="text-muted">{{ payment.contract.property.address }}</p>
                <p class="text-muted">{{ payment.contract.property.city }}</p>

                <div class="mt-4 pt-4 border-t border-default">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted">Contrato</span>
                    <span class="font-medium">{{ payment.contract.contract_number || 'Sin número' }}</span>
                  </div>
                  <div class="flex justify-between text-sm mt-2">
                    <span class="text-muted">Alquiler mensual</span>
                    <span class="font-medium">{{ formatPrice(payment.contract.monthly_rent) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-muted">
              No hay información de la propiedad
            </div>
          </UCard>
        </div>
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
            <p class="text-sm text-muted">{{ payment?.tenant?.full_name }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="p-4 rounded-lg bg-muted/50">
            <div class="flex justify-between items-center">
              <span class="text-muted">Monto</span>
              <span class="text-xl font-bold">
                {{ payment ? formatPrice(payment.amount, payment.currency) : '' }}
              </span>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-muted">Período</span>
              <span>
                {{ payment ? formatPeriod(payment.period_month, payment.period_year) : '' }}
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
