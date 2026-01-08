<script setup lang="ts">
import type { ContractInsert } from '~/types/contract.types'
import { CURRENCY_OPTIONS, ADJUSTMENT_INDEX_OPTIONS } from '~/types/contract.types'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const { 
  fetchAvailableProperties, 
  fetchTenants, 
  fetchAgents,
  createContract 
} = useContracts()
const toast = useToast()

// Estado
const loading = ref(false)
const properties = ref<any[]>([])
const tenants = ref<any[]>([])
const agents = ref<any[]>([])
const loadingData = ref(true)

// Form data
const form = ref<Partial<ContractInsert>>({
  property_id: undefined,
  tenant_id: undefined,
  agent_id: undefined,
  start_date: '',
  end_date: '',
  monthly_rent: 0,
  deposit: 0,
  currency: 'ARS',
  payment_day: 10,
  adjustment_frequency: 12,
  adjustment_index: 'ICL',
  status: 'pendiente',
  guarantor_name: '',
  guarantor_phone: '',
  guarantor_dni: '',
  notes: ''
})

// Cargar datos iniciales
const loadInitialData = async () => {
  loadingData.value = true
  try {
    const [propsResult, tenantsResult, agentsResult] = await Promise.all([
      fetchAvailableProperties(),
      fetchTenants(),
      fetchAgents()
    ])
    properties.value = propsResult
    tenants.value = tenantsResult
    agents.value = agentsResult
  } finally {
    loadingData.value = false
  }
}

onMounted(() => {
  loadInitialData()
  // Fecha de inicio por defecto: hoy
  const today = new Date()
  form.value.start_date = today.toISOString().split('T')[0]
  // Fecha fin por defecto: 2 años después
  const endDate = new Date(today)
  endDate.setFullYear(endDate.getFullYear() + 2)
  form.value.end_date = endDate.toISOString().split('T')[0]
})

// Opciones de propiedades
const propertyOptions = computed(() => {
  return properties.value.map(p => ({
    value: p.id,
    label: `${p.title} - ${p.city}`
  }))
})

// Opciones de inquilinos
const tenantOptions = computed(() => {
  return tenants.value.map(t => ({
    value: t.id,
    label: `${t.full_name || 'Sin nombre'} (${t.email})`
  }))
})

// Opciones de agentes
const agentOptions = computed(() => {
  return agents.value.map(a => ({
    value: a.id,
    label: a.profiles?.full_name || a.profiles?.email || 'Sin nombre'
  }))
})

// Propiedad seleccionada
const selectedProperty = computed(() => {
  if (!form.value.property_id) return null
  return properties.value.find(p => p.id === form.value.property_id)
})

// Al seleccionar propiedad, actualizar precio
watch(() => form.value.property_id, () => {
  if (selectedProperty.value) {
    form.value.monthly_rent = selectedProperty.value.price || 0
    form.value.currency = selectedProperty.value.currency || 'ARS'
    form.value.deposit = selectedProperty.value.price || 0
  }
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
  return form.value.property_id && 
         form.value.tenant_id && 
         form.value.start_date && 
         form.value.end_date &&
         form.value.monthly_rent && form.value.monthly_rent > 0
})

// Crear contrato
const handleSubmit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    await createContract(form.value as ContractInsert)

    toast.add({
      title: 'Contrato creado',
      description: 'El contrato fue creado correctamente',
      color: 'success'
    })

    router.push('/admin/contratos')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'No se pudo crear el contrato',
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
  <UDashboardPanel id="admin-new-contract">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push('/admin/contratos')"
          />
        </template>

        <template #title>
          Nuevo Contrato
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-4xl mx-auto">
        <div v-if="loadingData" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
        </div>

        <form v-else class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Propiedad y Partes -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <UIcon name="i-lucide-users" class="size-5 text-primary" />
                </div>
                <div>
                  <h2 class="font-semibold">Partes del Contrato</h2>
                  <p class="text-sm text-muted">Selecciona la propiedad, inquilino y agente</p>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Propiedad -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  Propiedad <span class="text-error">*</span>
                </label>
                <USelectMenu
                  v-model="form.property_id"
                  :items="propertyOptions"
                  value-key="value"
                  placeholder="Seleccionar propiedad..."
                  size="lg"
                />
                <p v-if="properties.length === 0" class="text-sm text-warning mt-2">
                  No hay propiedades disponibles para alquiler
                </p>
                <p v-if="selectedProperty" class="text-sm text-muted mt-2">
                  {{ selectedProperty.address }} - {{ formatPrice(selectedProperty.price, selectedProperty.currency) }}/mes
                </p>
              </div>

              <!-- Inquilino -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  Inquilino <span class="text-error">*</span>
                </label>
                <USelectMenu
                  v-model="form.tenant_id"
                  :items="tenantOptions"
                  value-key="value"
                  placeholder="Seleccionar inquilino..."
                  size="lg"
                />
                <p v-if="tenants.length === 0" class="text-sm text-warning mt-2">
                  No hay inquilinos registrados. Primero deben registrarse como usuarios con rol "inquilino".
                </p>
              </div>

              <!-- Agente -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  Agente (opcional)
                </label>
                <USelectMenu
                  v-model="form.agent_id"
                  :items="agentOptions"
                  value-key="value"
                  placeholder="Seleccionar agente..."
                  size="lg"
                />
              </div>
            </div>
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
                  <p class="text-sm text-muted">Define las fechas de inicio y fin</p>
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
                  <p class="text-sm text-muted">Define el alquiler, depósito y ajustes</p>
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
                  <h2 class="font-semibold">Garante (opcional)</h2>
                  <p class="text-sm text-muted">Información del garante si aplica</p>
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
                  <h2 class="font-semibold">Notas (opcional)</h2>
                </div>
              </div>
            </template>

            <UTextarea
              v-model="form.notes"
              placeholder="Agregar notas o condiciones especiales..."
              :rows="4"
            />
          </UCard>

          <!-- Resumen -->
          <UCard v-if="isValid" class="bg-primary/5 border-primary/20">
            <template #header>
              <h3 class="font-semibold">Resumen del Contrato</h3>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-muted">Propiedad</p>
                <p class="font-medium">{{ selectedProperty?.title }}</p>
              </div>
              <div>
                <p class="text-muted">Inquilino</p>
                <p class="font-medium">{{ tenants.find(t => t.id === form.tenant_id)?.full_name || '-' }}</p>
              </div>
              <div>
                <p class="text-muted">Alquiler</p>
                <p class="font-bold text-lg">{{ formatPrice(form.monthly_rent || 0, form.currency || 'ARS') }}</p>
              </div>
              <div>
                <p class="text-muted">Duración</p>
                <p class="font-medium">{{ form.start_date }} al {{ form.end_date }}</p>
              </div>
            </div>
          </UCard>

          <!-- Acciones -->
          <div class="flex justify-end gap-3">
            <UButton 
              variant="ghost" 
              @click="router.push('/admin/contratos')"
            >
              Cancelar
            </UButton>
            <UButton 
              type="submit"
              :loading="loading"
              :disabled="!isValid"
            >
              Crear Contrato
            </UButton>
          </div>
        </form>
      </div>
    </template>
  </UDashboardPanel>
</template>
