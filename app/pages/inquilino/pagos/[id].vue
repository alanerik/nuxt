<script setup lang="ts">
import type { Payment } from '~/types/payment.types'
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  formatPeriod
} from '~/types/payment.types'

definePageMeta({
  layout: 'inquilino'
})

const route = useRoute()
const router = useRouter()
const { fetchPayment } = usePayments()
const toast = useToast()

// Estado
const payment = ref<Payment | null>(null)
const loading = ref(true)

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
      router.push('/inquilino/pagos')
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

// Días hasta vencimiento
const getDaysUntilDue = (dueDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
</script>

<template>
  <UDashboardPanel id="inquilino-payment-detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push('/inquilino/pagos')"
          />
        </template>

        <template #title>
          <span v-if="payment">
            Pago - {{ formatPeriod(payment.period_month, payment.period_year) }}
          </span>
          <span v-else>Detalle de Pago</span>
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
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <UIcon 
                :name="payment.status === 'pagado' ? 'i-lucide-check-circle' : 
                       payment.status === 'vencido' ? 'i-lucide-alert-circle' :
                       payment.status === 'cancelado' ? 'i-lucide-x-circle' : 'i-lucide-clock'"
                class="size-10"
                :class="{
                  'text-warning': payment.status === 'pendiente',
                  'text-success': payment.status === 'pagado',
                  'text-error': payment.status === 'vencido',
                  'text-neutral': payment.status === 'cancelado'
                }"
              />
              <div>
                <UBadge
                  :color="(PAYMENT_STATUS_COLORS[payment.status as keyof typeof PAYMENT_STATUS_COLORS] || 'neutral') as any"
                  variant="soft"
                  size="lg"
                >
                  {{ PAYMENT_STATUS_LABELS[payment.status as keyof typeof PAYMENT_STATUS_LABELS] }}
                </UBadge>
                <p 
                  v-if="payment.status === 'pendiente'" 
                  class="text-sm mt-2"
                  :class="getDaysUntilDue(payment.due_date) <= 3 ? 'text-error font-medium' : 'text-muted'"
                >
                  {{ getDaysUntilDue(payment.due_date) > 0 
                    ? `Faltan ${getDaysUntilDue(payment.due_date)} días para el vencimiento` 
                    : getDaysUntilDue(payment.due_date) === 0 
                      ? '¡Vence hoy!' 
                      : 'Vencido' 
                  }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-muted">Monto a pagar</p>
              <p class="text-4xl font-bold">
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
              <div v-if="payment.status === 'pagado'" class="flex justify-between">
                <dt class="text-muted">Fecha de pago</dt>
                <dd class="font-medium text-success">{{ formatDate(payment.payment_date) }}</dd>
              </div>
              <div v-if="payment.payment_method" class="flex justify-between">
                <dt class="text-muted">Método de pago</dt>
                <dd class="font-medium">
                  {{ PAYMENT_METHOD_LABELS[payment.payment_method as keyof typeof PAYMENT_METHOD_LABELS] }}
                </dd>
              </div>
              <div v-if="payment.receipt_number" class="flex justify-between">
                <dt class="text-muted">Número de recibo</dt>
                <dd class="font-medium">{{ payment.receipt_number }}</dd>
              </div>
            </dl>
          </UCard>

          <!-- Instrucciones de Pago -->
          <UCard v-if="payment.status === 'pendiente' || payment.status === 'vencido'">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-info" class="size-5 text-primary" />
                <h3 class="font-semibold">Instrucciones de Pago</h3>
              </div>
            </template>

            <div class="space-y-4">
              <div class="p-4 rounded-lg bg-muted/50">
                <p class="text-sm font-medium mb-2">Transferencia Bancaria</p>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted">Banco:</span>
                    <span class="font-mono">Banco Galicia</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">CBU:</span>
                    <span class="font-mono">0070999920000012345678</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">Alias:</span>
                    <span class="font-mono">INMOBILIARIA.PAGOS</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">Titular:</span>
                    <span>Inmobiliaria S.A.</span>
                  </div>
                </div>
              </div>

              <div class="p-4 rounded-lg bg-muted/50">
                <p class="text-sm font-medium mb-2">Pago en Efectivo</p>
                <p class="text-sm text-muted">
                  Acercate a nuestras oficinas en horario de atención: 
                  Lunes a Viernes de 9:00 a 18:00 hs.
                </p>
              </div>

              <p class="text-xs text-muted text-center">
                Una vez que realices el pago por los medios indicados, un administrador confirmará la recepción y lo verás reflejado en el sistema.
              </p>
            </div>
          </UCard>

          <!-- Comprobante (si está pagado) -->
          <UCard v-if="payment.status === 'pagado'">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-file-check" class="size-5 text-success" />
                <h3 class="font-semibold">Comprobante de Pago</h3>
              </div>
            </template>

            <div class="text-center py-4">
              <UIcon name="i-lucide-check-circle" class="size-16 mx-auto mb-4 text-success" />
              <p class="font-semibold text-lg text-success">Pago Confirmado</p>
              <p class="text-muted mt-2">
                Pagado el {{ formatDate(payment.payment_date) }}
                <span v-if="payment.payment_method">
                  mediante {{ PAYMENT_METHOD_LABELS[payment.payment_method as keyof typeof PAYMENT_METHOD_LABELS] }}
                </span>
              </p>
              <p v-if="payment.receipt_number" class="text-sm text-muted mt-1">
                Recibo N°: {{ payment.receipt_number }}
              </p>
            </div>
          </UCard>
        </div>

        <!-- Propiedad -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-building-2" class="size-5 text-primary" />
              <h3 class="font-semibold">Propiedad</h3>
            </div>
          </template>

          <div v-if="payment.contract?.property" class="flex flex-col md:flex-row gap-6">
            <div class="w-full md:w-40 h-28 rounded-lg overflow-hidden bg-muted shrink-0">
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

              <div class="mt-4 flex gap-4 text-sm">
                <div>
                  <span class="text-muted">Contrato:</span>
                  <span class="ml-1 font-medium">{{ payment.contract.contract_number || 'Sin número' }}</span>
                </div>
                <div>
                  <span class="text-muted">Alquiler:</span>
                  <span class="ml-1 font-medium">{{ formatPrice(payment.contract.monthly_rent) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-muted">
            No hay información de la propiedad
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
