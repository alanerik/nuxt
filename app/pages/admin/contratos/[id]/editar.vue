<script setup lang="ts">
import type { Contract, ContractUpdate } from '~/types/contract.types'
import { 
  CURRENCY_OPTIONS, 
  ADJUSTMENT_INDEX_OPTIONS,
  CONTRACT_STATUS_OPTIONS 
} from '~/types/contract.types'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const { fetchContract, updateContract } = useContracts()
const toast = useToast()

// Estado
const loading = ref(false)
const loadingData = ref(true)
const contract = ref<Contract | null>(null)

// Form data
const form = ref<Partial<ContractUpdate>>({})

// Cargar contrato
const loadContract = async () => {
  loadingData.value = true
  try {
    const id = route.params.id as string
    contract.value = await fetchContract(id)
    
    if (!contract.value) {
      toast.add({
        title: 'Error',
        description: 'No se encontró el contrato',
        color: 'error'
      })
      router.push('/admin/contratos')
      return
    }

    // Inicializar form con datos del contrato
    form.value = {
      start_date: contract.value.start_date,
      end_date: contract.value.end_date,
      monthly_rent: contract.value.monthly_rent,
      deposit: contract.value.deposit,
      currency: contract.value.currency,
      payment_day: contract.value.payment_day,
      adjustment_frequency: contract.value.adjustment_frequency,
      adjustment_index: contract.value.adjustment_index,
      status: contract.value.status,
      guarantor_name: contract.value.guarantor_name || '',
      guarantor_phone: contract.value.guarantor_phone || '',
      guarantor_dni: contract.value.guarantor_dni || '',
      notes: contract.value.notes || ''
    }
  } finally {
    loadingData.value = false
  }
}

onMounted(() => {
  loadContract()
})

// Opciones de día de pago
const paymentDayOptions = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1)
}))

// Opciones de frecuencia de ajuste
const adjustmentFrequencyOptions = [
  { value: 3, label: 'Trimestral (3 meses)' },
  { value: 6, label: 'Semestral (6 meses)' },
  { value: 12, label: 'Anual (12 meses)' }
]

// Validación
const isValid = computed(() => {
  return form.value.start_date && 
         form.value.end_date &&
         form.value.monthly_rent && form.value.monthly_rent > 0
})

// Guardar cambios
const handleSubmit = async () => {
  if (!isValid.value || !contract.value) return

  loading.value = true
  try {
    await updateContract(contract.value.id, form.value)

    toast.add({
      title: 'Contrato actualizado',
      description: 'Los cambios fueron guardados correctamente',
      color: 'success'
    })

    router.push(`/admin/contratos/${contract.value.id}`)
  } catch (error: Error | unknown) {
    toast.add({
      title: 'Error',
      description: error.message || 'No se pudo actualizar el contrato',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Formato de precio
const formatPrice = (value: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(value)
}
</script>

<template>
  <UDashboardPanel id="admin-edit-contract">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push(`/admin/contratos/${route.params.id}`)"
          />
        </template>

        <template #title>
          Editar Contrato {{ contract?.contract_number || '' }}
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-4xl mx-auto">
        <div v-if="loadingData" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
        </div>

        <form v-else-if="contract" class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Info de la propiedad e inquilino (solo lectura) -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-muted">
                  <UIcon name="i-lucide-info" class="size-5 text-muted" />
                </div>
                <div>
                  <h2 class="font-semibold">Información del Contrato</h2>
                  <p class="text-sm text-muted">Estos datos no se pueden modificar</p>
                </div>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted">Propiedad</p>
                <p class="font-medium">{{ contract.property?.title || 'Sin propiedad' }}</p>
                <p class="text-sm text-muted">{{ contract.property?.address }}</p>
              </div>
              <div>
                <p class="text-sm text-muted">Inquilino</p>
                <p class="font-medium">{{ contract.tenant?.full_name || 'Sin inquilino' }}</p>
                <p class="text-sm text-muted">{{ contract.tenant?.email }}</p>
              </div>
            </div>
          </UCard>

          <!-- Estado -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon name="i-lucide-activity" class="size-5 text-primary" />
                </div>
                <div>
                  <h2 class="font-semibold">Estado del Contrato</h2>
                </div>
              </div>
            </template>

            <USelectMenu
              v-model="form.status"
              :items="CONTRACT_STATUS_OPTIONS"
              value-key="value"
              size="lg"
            />
          </UCard>

          <!-- Fechas -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon name="i-lucide-calendar" class="size-5 text-primary" />
                </div>
                <div>
                  <h2 class="font-semibold">Duración del Contrato</h2>
                </div>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Fecha de inicio <span class="text-error">*</span>
                </label>
                <UInput
                  v-model="form.start_date"
                  type="date"
                  size="lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">
                  Fecha de fin <span class="text-error">*</span>
                </label>
                <UInput
                  v-model="form.end_date"
                  type="date"
                  size="lg"
                />
              </div>
            </div>
          </UCard>

          <!-- Condiciones Económicas -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon name="i-lucide-dollar-sign" class="size-5 text-primary" />
                </div>
                <div>
                  <h2 class="font-semibold">Condiciones Económicas</h2>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Alquiler Mensual <span class="text-error">*</span>
                  </label>
                  <UInput
                    v-model.number="form.monthly_rent"
                    type="number"
                    min="0"
                    step="1000"
                    size="lg"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Depósito
                  </label>
                  <UInput
                    v-model.number="form.deposit"
                    type="number"
                    min="0"
                    step="1000"
                    size="lg"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Moneda
                  </label>
                  <USelectMenu
                    v-model="form.currency"
                    :items="CURRENCY_OPTIONS"
                    value-key="value"
                    size="lg"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Día de pago
                  </label>
                  <USelectMenu
                    v-model="form.payment_day"
                    :items="paymentDayOptions"
                    value-key="value"
                    size="lg"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Frecuencia de ajuste
                  </label>
                  <USelectMenu
                    v-model="form.adjustment_frequency"
                    :items="adjustmentFrequencyOptions"
                    value-key="value"
                    size="lg"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">
                    Índice de ajuste
                  </label>
                  <USelectMenu
                    v-model="form.adjustment_index"
                    :items="ADJUSTMENT_INDEX_OPTIONS"
                    value-key="value"
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <!-- Garante -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon name="i-lucide-shield-check" class="size-5 text-primary" />
                </div>
                <div>
                  <h2 class="font-semibold">Garante</h2>
                </div>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Nombre completo</label>
                <UInput
                  v-model="form.guarantor_name"
                  placeholder="Juan Pérez"
                  size="lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Teléfono</label>
                <UInput
                  v-model="form.guarantor_phone"
                  placeholder="+54 11 1234-5678"
                  size="lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">DNI</label>
                <UInput
                  v-model="form.guarantor_dni"
                  placeholder="12345678"
                  size="lg"
                />
              </div>
            </div>
          </UCard>

          <!-- Notas -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon name="i-lucide-sticky-note" class="size-5 text-primary" />
                </div>
                <div>
                  <h2 class="font-semibold">Notas</h2>
                </div>
              </div>
            </template>

            <UTextarea
              v-model="form.notes"
              placeholder="Agregar notas o condiciones especiales..."
              :rows="4"
            />
          </UCard>

          <!-- Acciones -->
          <div class="flex justify-end gap-3">
            <UButton 
              variant="ghost" 
              @click="router.push(`/admin/contratos/${contract.id}`)"
            >
              Cancelar
            </UButton>
            <UButton 
              type="submit"
              :loading="loading"
              :disabled="!isValid"
            >
              Guardar Cambios
            </UButton>
          </div>
        </form>
      </div>
    </template>
  </UDashboardPanel>
</template>
