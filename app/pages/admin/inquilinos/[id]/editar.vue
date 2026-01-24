<script setup lang="ts">
import type { TenantWithDetails } from '~/types/tenant.types'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const { getTenantById, updateTenant } = useTenants()
const toast = useToast()

const tenantId = computed(() => route.params.id as string)

// Estado
const tenant = ref<TenantWithDetails | null>(null)
const loading = ref(true)
const saving = ref(false)

// Form state
const form = ref({
  full_name: '',
  phone: '',
  dni: '',
  address: ''
})

// Validation
const errors = ref<Record<string, string>>({})

const validate = () => {
  errors.value = {}

  if (!form.value.full_name.trim()) {
    errors.value.full_name = 'El nombre es requerido'
  }

  return Object.keys(errors.value).length === 0
}

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    const tenantData = await getTenantById(tenantId.value)

    if (!tenantData) {
      toast.add({
        title: 'Error',
        description: 'Inquilino no encontrado',
        color: 'error'
      })
      router.push('/admin/inquilinos')
      return
    }

    tenant.value = tenantData
    
    // Rellenar formulario
    form.value = {
      full_name: tenantData.full_name || '',
      phone: tenantData.phone || '',
      dni: tenantData.dni || '',
      address: tenantData.address || ''
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cargar la información del inquilino',
      color: 'error'
    })
    router.push('/admin/inquilinos')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// Submit
const handleSubmit = async () => {
  if (!validate()) return

  saving.value = true
  try {
    await updateTenant(tenantId.value, {
      full_name: form.value.full_name,
      phone: form.value.phone || undefined,
      dni: form.value.dni || undefined,
      address: form.value.address || undefined
    })

    toast.add({
      title: 'Inquilino actualizado',
      description: 'Los datos fueron guardados correctamente',
      color: 'success'
    })

    router.push(`/admin/inquilinos/${tenantId.value}`)
  } catch (error) {
    console.error('Error updating tenant:', error)
    toast.add({
      title: 'Error',
      description: 'No se pudo actualizar el inquilino',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Helper
const getInitials = (name: string | null) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <UDashboardPanel id="edit-tenant">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push(`/admin/inquilinos/${tenantId}`)"
          >
            Volver
          </UButton>
        </template>

        <template #title>
          Editar Inquilino
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="loading" class="p-6 flex items-center justify-center min-h-[400px]">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <!-- Form -->
      <div v-else class="p-6 max-w-2xl mx-auto">
        <UCard>
          <template #header>
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                <img 
                  v-if="tenant?.avatar_url"
                  :src="tenant.avatar_url"
                  :alt="tenant.full_name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-2xl font-semibold text-primary">
                  {{ getInitials(tenant?.full_name) }}
                </span>
              </div>
              <div>
                <h2 class="text-lg font-semibold">{{ tenant?.full_name || 'Sin nombre' }}</h2>
                <p class="text-sm text-muted">{{ tenant?.email }}</p>
              </div>
            </div>
          </template>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Datos Personales -->
            <div class="space-y-4">
              <h3 class="font-medium flex items-center gap-2">
                <UIcon name="i-lucide-user" class="size-4" />
                Datos Personales
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField 
                  label="Nombre completo" 
                  required
                  :error="errors.full_name"
                >
                  <UInput
                    v-model="form.full_name"
                    placeholder="Juan Pérez"
                    icon="i-lucide-user"
                    size="lg"
                  />
                </UFormField>

                <UFormField 
                  label="DNI / Documento"
                  :error="errors.dni"
                >
                  <UInput
                    v-model="form.dni"
                    placeholder="12345678"
                    icon="i-lucide-id-card"
                    size="lg"
                  />
                </UFormField>
              </div>
            </div>

            <!-- Datos de Contacto -->
            <div class="space-y-4">
              <h3 class="font-medium flex items-center gap-2">
                <UIcon name="i-lucide-contact" class="size-4" />
                Datos de Contacto
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Email">
                  <UInput
                    :model-value="tenant?.email"
                    disabled
                    icon="i-lucide-mail"
                    size="lg"
                  />
                  <template #hint>
                    <span class="text-xs text-muted">El email no puede ser modificado</span>
                  </template>
                </UFormField>

                <UFormField 
                  label="Teléfono"
                  :error="errors.phone"
                >
                  <UInput
                    v-model="form.phone"
                    placeholder="+54 11 1234-5678"
                    icon="i-lucide-phone"
                    size="lg"
                  />
                </UFormField>
              </div>

              <UFormField 
                label="Dirección"
                :error="errors.address"
              >
                <UInput
                  v-model="form.address"
                  placeholder="Av. Corrientes 1234, CABA"
                  icon="i-lucide-map-pin"
                  size="lg"
                />
              </UFormField>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t">
              <UButton
                color="neutral"
                variant="ghost"
                @click="router.push(`/admin/inquilinos/${tenantId}`)"
              >
                Cancelar
              </UButton>
              <UButton
                type="submit"
                :loading="saving"
                icon="i-lucide-save"
              >
                Guardar Cambios
              </UButton>
            </div>
          </form>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
