<script setup lang="ts">
import type { Contract } from '~/types/contract.types'
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  getDaysRemaining,
  isContractExpiringSoon,
  calculateContractDuration
} from '~/types/contract.types'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const { fetchContract, updateContractStatus } = useContracts()
const toast = useToast()

// Estado
const contract = ref<Contract | null>(null)
const loading = ref(true)

// Cargar contrato
const loadContract = async () => {
  loading.value = true
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
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadContract()
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

// Activar contrato
const handleActivate = async () => {
  if (!contract.value) return

  try {
    await updateContractStatus(contract.value.id, 'activo', contract.value.property_id || undefined)
    
    toast.add({
      title: 'Contrato activado',
      description: 'El contrato fue activado correctamente',
      color: 'success'
    })

    loadContract()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo activar el contrato',
      color: 'error'
    })
  }
}

// Cancelar contrato
const handleCancel = async () => {
  if (!contract.value) return

  try {
    await updateContractStatus(contract.value.id, 'cancelado', contract.value.property_id || undefined)
    
    toast.add({
      title: 'Contrato cancelado',
      description: 'El contrato fue cancelado correctamente',
      color: 'success'
    })

    loadContract()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cancelar el contrato',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="admin-contract-detail">
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
          <span v-if="contract">
            Contrato {{ contract.contract_number || '' }}
          </span>
          <span v-else>Detalle de Contrato</span>
        </template>

        <template #right>
          <template v-if="contract">
            <UButton
              v-if="contract.status === 'pendiente'"
              color="success"
              icon="i-lucide-check"
              @click="handleActivate"
            >
              Activar
            </UButton>
            <UButton
              v-if="contract.status === 'activo' || contract.status === 'pendiente'"
              color="error"
              variant="soft"
              icon="i-lucide-x"
              label="Cancelar"
              @click="handleCancel"
            />
            <UButton
              color="primary"
              variant="ghost"
              icon="i-lucide-pencil"
              label="Editar"
              @click="navigateTo(`/admin/contratos/${contract.id}/editar`)"
            />
          </template>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="p-6 flex items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
      </div>

      <div v-else-if="contract" class="p-6 space-y-6">
        <!-- Status Banner -->
        <UCard 
          :class="{
            'border-warning': contract.status === 'pendiente',
            'border-success': contract.status === 'activo',
            'border-error': contract.status === 'vencido' || contract.status === 'cancelado'
          }"
          class="border-l-4"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <UIcon 
                :name="contract.status === 'activo' ? 'i-lucide-check-circle' : 
                       contract.status === 'vencido' ? 'i-lucide-alert-circle' :
                       contract.status === 'cancelado' ? 'i-lucide-x-circle' : 'i-lucide-clock'"
                class="size-10"
                :class="{
                  'text-warning': contract.status === 'pendiente',
                  'text-success': contract.status === 'activo',
                  'text-error': contract.status === 'vencido' || contract.status === 'cancelado'
                }"
              />
              <div>
                <UBadge
                  :color="(CONTRACT_STATUS_COLORS[contract.status as keyof typeof CONTRACT_STATUS_COLORS] || 'neutral') as any"
                  variant="soft"
                  size="lg"
                >
                  {{ CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS] }}
                </UBadge>
                <p 
                  v-if="contract.status === 'activo'" 
                  class="text-sm mt-2"
                  :class="isContractExpiringSoon(contract.end_date) ? 'text-warning font-medium' : 'text-muted'"
                >
                  {{ getDaysRemaining(contract.end_date) > 0 
                    ? `${getDaysRemaining(contract.end_date)} días restantes` 
                    : 'Contrato vencido' 
                  }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-muted">Alquiler Mensual</p>
              <p class="text-3xl font-bold">
                {{ formatPrice(contract.monthly_rent, contract.currency) }}
              </p>
            </div>
          </div>
        </UCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Información del Contrato -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="size-5 text-primary" />
                <h3 class="font-semibold">Información del Contrato</h3>
              </div>
            </template>

            <dl class="space-y-4">
              <div class="flex justify-between">
                <dt class="text-muted">Número de contrato</dt>
                <dd class="font-medium">{{ contract.contract_number || 'Sin número' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Fecha de inicio</dt>
                <dd class="font-medium">{{ formatDate(contract.start_date) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Fecha de fin</dt>
                <dd class="font-medium">{{ formatDate(contract.end_date) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Duración</dt>
                <dd class="font-medium">{{ calculateContractDuration(contract.start_date, contract.end_date) }} meses</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Día de pago</dt>
                <dd class="font-medium">{{ contract.payment_day }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Depósito</dt>
                <dd class="font-medium">{{ formatPrice(contract.deposit, contract.currency) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted">Ajuste</dt>
                <dd class="font-medium">Cada {{ contract.adjustment_frequency }} meses ({{ contract.adjustment_index }})</dd>
              </div>
              <div v-if="contract.signing_date" class="flex justify-between">
                <dt class="text-muted">Fecha de firma</dt>
                <dd class="font-medium">{{ formatDate(contract.signing_date) }}</dd>
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

            <div v-if="contract.tenant" class="space-y-4">
              <div class="flex items-center gap-4">
                <UAvatar 
                  :alt="contract.tenant.full_name || 'User'"
                  size="lg"
                />
                <div>
                  <p class="font-semibold text-lg">{{ contract.tenant.full_name || 'Sin nombre' }}</p>
                  <p class="text-muted">{{ contract.tenant.email }}</p>
                </div>
              </div>

              <div class="pt-4 border-t border-default space-y-3">
                <div class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-mail" class="size-4 text-muted" />
                  <span>{{ contract.tenant.email }}</span>
                </div>
                <div v-if="contract.tenant.phone" class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-phone" class="size-4 text-muted" />
                  <span>{{ contract.tenant.phone }}</span>
                </div>
                <div v-if="contract.tenant.dni" class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-id-card" class="size-4 text-muted" />
                  <span>DNI: {{ contract.tenant.dni }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-muted">
              No hay información del inquilino
            </div>
          </UCard>

          <!-- Garante -->
          <UCard v-if="contract.guarantor_name">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-shield-check" class="size-5 text-primary" />
                <h3 class="font-semibold">Garante</h3>
              </div>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted">Nombre</dt>
                <dd class="font-medium">{{ contract.guarantor_name }}</dd>
              </div>
              <div v-if="contract.guarantor_phone" class="flex justify-between">
                <dt class="text-muted">Teléfono</dt>
                <dd class="font-medium">{{ contract.guarantor_phone }}</dd>
              </div>
              <div v-if="contract.guarantor_dni" class="flex justify-between">
                <dt class="text-muted">DNI</dt>
                <dd class="font-medium">{{ contract.guarantor_dni }}</dd>
              </div>
            </dl>
          </UCard>

          <!-- Notas -->
          <UCard v-if="contract.notes">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-sticky-note" class="size-5 text-primary" />
                <h3 class="font-semibold">Notas</h3>
              </div>
            </template>

            <p class="text-muted whitespace-pre-wrap">{{ contract.notes }}</p>
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

          <div v-if="contract.property" class="flex flex-col md:flex-row gap-6">
            <div class="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
              <img 
                v-if="contract.property.images?.[0]"
                :src="contract.property.images[0]"
                :alt="contract.property.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-lucide-image" class="size-8 text-muted" />
              </div>
            </div>
            <div class="flex-1">
              <h4 class="text-lg font-semibold">{{ contract.property.title }}</h4>
              <p class="text-muted">{{ contract.property.address }}</p>
              <p class="text-muted">{{ contract.property.city }}</p>

              <div class="mt-4">
                <UButton 
                  variant="soft" 
                  size="sm"
                  :to="`/admin/propiedades/${contract.property.id}`"
                >
                  Ver Propiedad
                </UButton>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-muted">
            No hay información de la propiedad
          </div>
        </UCard>

        <!-- Acciones rápidas -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-zap" class="size-5 text-primary" />
              <h3 class="font-semibold">Acciones Rápidas</h3>
            </div>
          </template>

          <div class="flex flex-wrap gap-3">
            <UButton 
              variant="soft" 
              icon="i-lucide-credit-card"
              label="Crear Pago"
              to="/admin/pagos/nuevo"
            />
            <UButton 
              variant="soft" 
              icon="i-lucide-file-text"
              disabled
            >
              Generar Recibo
            </UButton>
            <UButton 
              v-if="contract.document_url"
              variant="soft" 
              icon="i-lucide-download"
              :href="contract.document_url"
              target="_blank"
            >
              Descargar Contrato
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
