<script setup lang="ts">
import { MONTHS_LABELS } from '~/types/payment.types'
import type { ContractRow } from '~/types/contract.types'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const { fetchActiveContracts, createPayment } = usePayments()
const toast = useToast()

// Estado
const loading = ref(false)
const contracts = ref<ContractRow[]>([])
const loadingContracts = ref(true)

// Form data
const selectedContractId = ref<string | null>(null)
const amount = ref<number>(0)
const currency = ref('ARS')
const periodMonth = ref(new Date().getMonth() + 1)
const periodYear = ref(new Date().getFullYear())
const dueDate = ref('')
const notes = ref('')

// Cargar contratos
const loadContracts = async () => {
  loadingContracts.value = true
  try {
    contracts.value = await fetchActiveContracts()
  } finally {
    loadingContracts.value = false
  }
}

onMounted(() => {
  loadContracts()
  // Calcular fecha de vencimiento por defecto (día 10 del mes seleccionado)
  updateDueDate()
})

// Contrato seleccionado
const selectedContract = computed(() => {
  if (!selectedContractId.value) return null
  return contracts.value.find(c => c.id === selectedContractId.value)
})

// Opciones de contratos para el select
const contractOptions = computed(() => {
  return contracts.value.map(c => ({
    value: c.id,
    label: `${c.tenant?.full_name || 'Sin inquilino'} - ${c.property?.title || 'Sin propiedad'}`
  }))
})

// Opciones de moneda
const currencyOptions = [
  { value: 'ARS', label: 'ARS (Pesos)' },
  { value: 'USD', label: 'USD (Dólares)' }
]

// Opciones de mes
const monthOptions = MONTHS_LABELS.map((label, index) => ({
  value: index + 1,
  label
}))

// Opciones de año
const currentYear = new Date().getFullYear()
const yearOptions = [
  { value: currentYear - 1, label: String(currentYear - 1) },
  { value: currentYear, label: String(currentYear) },
  { value: currentYear + 1, label: String(currentYear + 1) }
]

// Al seleccionar contrato, actualizar monto
watch(selectedContractId, () => {
  if (selectedContract.value) {
    amount.value = selectedContract.value.monthly_rent || 0
    currency.value = selectedContract.value.currency || 'ARS'
    // Actualizar fecha de vencimiento según el día de pago del contrato
    updateDueDate()
  }
})

// Al cambiar mes/año, actualizar fecha de vencimiento
watch([periodMonth, periodYear], () => {
  updateDueDate()
})

// Calcular fecha de vencimiento
const updateDueDate = () => {
  const paymentDay = selectedContract.value?.payment_day || 10
  const year = periodYear.value
  const month = periodMonth.value
  
  // Asegurar que el día exista en el mes
  const lastDayOfMonth = new Date(year, month, 0).getDate()
  const day = Math.min(paymentDay, lastDayOfMonth)
  
  dueDate.value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Validación
const isValid = computed(() => {
  return selectedContractId.value && 
         amount.value > 0 && 
         dueDate.value && 
         periodMonth.value && 
         periodYear.value
})

// Crear pago
const handleSubmit = async () => {
  if (!isValid.value || !selectedContract.value) return

  loading.value = true
  try {
    await createPayment({
      contract_id: selectedContractId.value!,
      tenant_id: selectedContract.value.tenant_id,
      amount: amount.value,
      currency: currency.value,
      due_date: dueDate.value,
      period_month: periodMonth.value,
      period_year: periodYear.value,
      notes: notes.value || undefined
    })

    toast.add({
      title: 'Pago creado',
      description: 'El pago fue creado correctamente',
      color: 'success'
    })

    router.push('/admin/pagos')
  } catch (error: Error | unknown) {
    toast.add({
      title: 'Error',
      description: error.message || 'No se pudo crear el pago',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Formato de precio
const formatPrice = (value: number, curr: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: curr === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(value)
}
</script>

<template>
  <UDashboardPanel id="admin-new-payment">
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
          Nuevo Pago
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-3xl mx-auto">
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <UIcon name="i-lucide-plus-circle" class="size-6 text-primary" />
              </div>
              <div>
                <h2 class="font-semibold text-lg">Crear Nuevo Pago</h2>
                <p class="text-sm text-muted">Genera un pago pendiente para un contrato activo</p>
              </div>
            </div>
          </template>

          <div v-if="loadingContracts" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
          </div>

          <div v-else-if="contracts.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-file-x" class="size-16 mx-auto mb-4 text-muted" />
            <h3 class="text-lg font-semibold mb-2">No hay contratos activos</h3>
            <p class="text-muted mb-4">Necesitás tener al menos un contrato activo para crear pagos.</p>
            <UButton to="/admin/contratos">Ver Contratos</UButton>
          </div>

          <form v-else class="space-y-6" @submit.prevent="handleSubmit">
            <!-- Contrato -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Contrato <span class="text-error">*</span>
              </label>
              <USelectMenu
                v-model="selectedContractId"
                :items="contractOptions"
                value-key="value"
                placeholder="Seleccionar contrato..."
                size="lg"
              />
              <p v-if="selectedContract" class="text-sm text-muted mt-2">
                {{ selectedContract.property?.address }}, {{ selectedContract.property?.city }}
              </p>
            </div>

            <!-- Info del contrato seleccionado -->
            <div v-if="selectedContract" class="p-4 rounded-lg bg-muted/50 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted">Inquilino:</span>
                <span class="font-medium">{{ selectedContract.tenant?.full_name }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">Propiedad:</span>
                <span class="font-medium">{{ selectedContract.property?.title }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">Alquiler mensual:</span>
                <span class="font-medium">{{ formatPrice(selectedContract.monthly_rent, selectedContract.currency) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted">Día de pago:</span>
                <span class="font-medium">{{ selectedContract.payment_day || 10 }}</span>
              </div>
            </div>

            <!-- Período -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Mes <span class="text-error">*</span>
                </label>
                <USelectMenu
                  v-model="periodMonth"
                  :items="monthOptions"
                  value-key="value"
                  size="lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">
                  Año <span class="text-error">*</span>
                </label>
                <USelectMenu
                  v-model="periodYear"
                  :items="yearOptions"
                  value-key="value"
                  size="lg"
                />
              </div>
            </div>

            <!-- Monto y Moneda -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Monto <span class="text-error">*</span>
                </label>
                <UInput
                  v-model.number="amount"
                  type="number"
                  min="0"
                  step="100"
                  size="lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">
                  Moneda
                </label>
                <USelectMenu
                  v-model="currency"
                  :items="currencyOptions"
                  value-key="value"
                  size="lg"
                />
              </div>
            </div>

            <!-- Fecha de vencimiento -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Fecha de vencimiento <span class="text-error">*</span>
              </label>
              <UInput
                v-model="dueDate"
                type="date"
                size="lg"
              />
            </div>

            <!-- Notas -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Notas (opcional)
              </label>
              <UTextarea
                v-model="notes"
                placeholder="Agregar notas o comentarios..."
                :rows="3"
              />
            </div>

            <!-- Resumen -->
            <div v-if="isValid" class="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 class="font-medium mb-2">Resumen del pago</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Período:</span>
                  <span class="font-medium">{{ MONTHS_LABELS[periodMonth - 1] }} {{ periodYear }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Monto:</span>
                  <span class="font-bold text-lg">{{ formatPrice(amount, currency) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Vencimiento:</span>
                  <span class="font-medium">{{ new Date(dueDate).toLocaleDateString('es-AR') }}</span>
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex justify-end gap-3 pt-4 border-t border-default">
              <UButton 
                variant="ghost" 
                @click="router.push('/admin/pagos')"
              >
                Cancelar
              </UButton>
              <UButton 
                type="submit"
                :loading="loading"
                :disabled="!isValid"
              >
                Crear Pago
              </UButton>
            </div>
          </form>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
