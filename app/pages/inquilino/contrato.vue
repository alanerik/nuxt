<script setup lang="ts">
import type { Contract } from '~/types/contract.types'

definePageMeta({
  layout: 'inquilino'
})

const user = useSupabaseUser()
const { fetchContracts } = useContracts()

// State
const loading = ref(true)
const contract = ref<Contract | null>(null)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatPrice = (price: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(price)
}

onMounted(async () => {
  loading.value = true
  try {
    if (!user.value?.id) return

    const { data } = await fetchContracts({
      tenant_id: user.value.id,
      status: 'activo'
    })

    if (data && data.length > 0) {
      contract.value = data[0]
    }
  } catch (error) {
    console.error('Error loading contract:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Mi Contrato">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton 
            icon="i-lucide-arrow-left" 
            to="/inquilino/dashboard"
            variant="ghost"
            color="neutral"
            label="Volver"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6 max-w-4xl mx-auto">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <USkeleton class="h-64 w-full rounded-lg" />
          <USkeleton class="h-32 w-full rounded-lg" />
        </div>

        <!-- No Contract -->
        <template v-else-if="!contract">
          <UAlert 
            color="warning" 
            icon="i-lucide-alert-triangle" 
            title="Sin contrato activo"
          >
            <template #description>
              No tienes un contrato activo en este momento. Para más información, contacta al administrador.
            </template>
          </UAlert>
        </template>

        <!-- Contract Details -->
        <template v-else>
          <!-- Header Card -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold">Contrato de Alquiler</h2>
                  <p class="text-sm text-muted mt-1">{{ contract.property?.title }}</p>
                </div>
                <UBadge color="success" variant="soft">Activo</UBadge>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-muted">Fecha de Inicio</p>
                  <p class="font-medium">{{ formatDate(contract.start_date) }}</p>
                </div>
                <div>
                  <p class="text-sm text-muted">Fecha de Vencimiento</p>
                  <p class="font-medium">{{ formatDate(contract.end_date) }}</p>
                </div>
              </div>

              <div class="space-y-3">
                <div>
                  <p class="text-sm text-muted">Alquiler Mensual</p>
                  <p class="text-2xl font-bold">{{ formatPrice(contract.monthly_rent, contract.currency) }}</p>
                </div>
                <div>
                  <p class="text-sm text-muted">Moneda</p>
                  <p class="font-medium">{{ contract.currency }}</p>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Property Details -->
          <UCard v-if="contract.property">
            <template #header>
              <h3 class="font-semibold">Detalles de la Propiedad</h3>
            </template>

            <div class="space-y-4">
              <div v-if="contract.property.images?.[0]" class="rounded-lg overflow-hidden h-64 bg-muted">
                <img 
                  :src="contract.property.images[0]" 
                  :alt="contract.property.title"
                  class="w-full h-full object-cover"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-3">
                  <div>
                    <p class="text-sm text-muted">Dirección</p>
                    <p class="font-medium">{{ contract.property.address }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-muted">Ciudad</p>
                    <p class="font-medium">{{ contract.property.city }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-muted">Tipo de Propiedad</p>
                    <p class="font-medium">{{ contract.property.property_type }}</p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div>
                    <p class="text-sm text-muted">Superficie</p>
                    <p class="font-medium">{{ contract.property.size }} m²</p>
                  </div>
                  <div>
                    <p class="text-sm text-muted">Dormitorios</p>
                    <p class="font-medium">{{ contract.property.bedrooms }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-muted">Baños</p>
                    <p class="font-medium">{{ contract.property.bathrooms }}</p>
                  </div>
                </div>
              </div>

              <div v-if="contract.property.description" class="pt-4 border-t border-default">
                <p class="text-sm text-muted mb-2">Descripción</p>
                <p class="text-sm">{{ contract.property.description }}</p>
              </div>
            </div>
          </UCard>

          <!-- Contract Terms -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Términos del Contrato</h3>
            </template>

            <div class="space-y-4">
              <div v-if="contract.deposit_amount" class="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <p class="text-sm text-muted">Depósito de Garantía</p>
                <p class="font-medium">{{ formatPrice(contract.deposit_amount, contract.currency) }}</p>
              </div>

              <div v-if="contract.notes" class="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Notas Adicionales</p>
                <p class="text-sm text-blue-800 dark:text-blue-200">{{ contract.notes }}</p>
              </div>

              <div class="pt-4 border-t border-default">
                <p class="text-xs text-muted">
                  Última actualización: {{ formatDate(contract.updated_at) }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Actions -->
          <div class="flex justify-center gap-3">
            <UButton 
              icon="i-lucide-download" 
              label="Descargar Contrato" 
              variant="soft"
              disabled
            />
            <UButton 
              icon="i-lucide-printer" 
              label="Imprimir" 
              variant="soft"
              disabled
            />
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
