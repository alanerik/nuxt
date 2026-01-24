<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const { createTenant } = useTenants()
const toast = useToast()

// Form state
const loading = ref(false)
const form = ref({
  full_name: '',
  email: '',
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

  if (!form.value.email.trim()) {
    errors.value.email = 'El email es requerido'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'El email no es válido'
  }

  return Object.keys(errors.value).length === 0
}

// Submit
const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    await createTenant({
      full_name: form.value.full_name,
      email: form.value.email,
      phone: form.value.phone || undefined,
      dni: form.value.dni || undefined,
      address: form.value.address || undefined
    })

    toast.add({
      title: 'Inquilino creado',
      description: 'El inquilino fue registrado correctamente. Se le enviará un email para establecer su contraseña.',
      color: 'success'
    })

    router.push('/admin/inquilinos')
  } catch (error: any) {
    console.error('Error creating tenant:', error)
    
    let errorMessage = 'No se pudo crear el inquilino'
    if (error?.message?.includes('already registered')) {
      errorMessage = 'Este email ya está registrado en el sistema'
    }

    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="new-tenant">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push('/admin/inquilinos')"
          >
            Volver
          </UButton>
        </template>

        <template #title>
          Nuevo Inquilino
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-2xl mx-auto">
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <UIcon name="i-lucide-user-plus" class="size-6 text-primary" />
              </div>
              <div>
                <h2 class="text-lg font-semibold">Registrar nuevo inquilino</h2>
                <p class="text-sm text-muted">Complete los datos del inquilino</p>
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
                <UFormField 
                  label="Email" 
                  required
                  :error="errors.email"
                >
                  <UInput
                    v-model="form.email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    icon="i-lucide-mail"
                    size="lg"
                  />
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

            <!-- Info -->
            <UAlert
              color="info"
              icon="i-lucide-info"
              title="Información"
              description="Se creará una cuenta para el inquilino y se le enviará un email para establecer su contraseña."
            />

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t">
              <UButton
                color="neutral"
                variant="ghost"
                @click="router.push('/admin/inquilinos')"
              >
                Cancelar
              </UButton>
              <UButton
                type="submit"
                :loading="loading"
                icon="i-lucide-save"
              >
                Guardar Inquilino
              </UButton>
            </div>
          </form>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
