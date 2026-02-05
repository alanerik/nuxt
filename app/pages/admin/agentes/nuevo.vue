<script setup lang="ts">
import { AGENT_SPECIALIZATIONS } from '~/types/agent.types'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const { createAgent } = useAgents()
const toast = useToast()

// Form state
const loading = ref(false)
const form = ref({
  full_name: '',
  email: '',
  phone: '',
  license_number: '',
  commission_rate: 5,
  specialization: [] as string[],
  bio: ''
})

// Opciones de especialización
const specializationOptions = Object.entries(AGENT_SPECIALIZATIONS).map(([value, label]) => ({
  value,
  label
}))

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

  if (form.value.commission_rate < 0 || form.value.commission_rate > 100) {
    errors.value.commission_rate = 'La comisión debe estar entre 0 y 100'
  }

  return Object.keys(errors.value).length === 0
}

// Submit
const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    await createAgent({
      full_name: form.value.full_name,
      email: form.value.email,
      phone: form.value.phone || undefined,
      license_number: form.value.license_number || undefined,
      commission_rate: form.value.commission_rate,
      specialization: form.value.specialization.length > 0 ? form.value.specialization : undefined,
      bio: form.value.bio || undefined
    })

    toast.add({
      title: 'Agente creado',
      description: 'El agente fue registrado correctamente. Se le enviará un email para establecer su contraseña.',
      color: 'success'
    })

    router.push('/admin/agentes')
  } catch (error: Error | unknown) {
    console.error('Error creating agent:', error)
    
    let errorMessage = 'No se pudo crear el agente'
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
  <UDashboardPanel id="new-agent">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push('/admin/agentes')"
          >
            Volver
          </UButton>
        </template>

        <template #title>
          Nuevo Agente
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
                <h2 class="text-lg font-semibold">Registrar nuevo agente</h2>
                <p class="text-sm text-muted">Complete los datos del agente inmobiliario</p>
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
                  label="Email" 
                  required
                  :error="errors.email"
                >
                  <UInput
                    v-model="form.email"
                    type="email"
                    placeholder="juan@inmobiliaria.com"
                    icon="i-lucide-mail"
                    size="lg"
                  />
                </UFormField>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Teléfono">
                  <UInput
                    v-model="form.phone"
                    placeholder="+54 11 1234-5678"
                    icon="i-lucide-phone"
                    size="lg"
                  />
                </UFormField>

                <UFormField label="Matrícula">
                  <UInput
                    v-model="form.license_number"
                    placeholder="CUCICBA 1234"
                    icon="i-lucide-id-card"
                    size="lg"
                  />
                </UFormField>
              </div>
            </div>

            <!-- Datos Profesionales -->
            <div class="space-y-4">
              <h3 class="font-medium flex items-center gap-2">
                <UIcon name="i-lucide-briefcase" class="size-4" />
                Datos Profesionales
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField 
                  label="Tasa de Comisión (%)"
                  :error="errors.commission_rate"
                >
                  <UInput
                    v-model.number="form.commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    icon="i-lucide-percent"
                    size="lg"
                  />
                </UFormField>

                <UFormField label="Especialización">
                  <USelectMenu
                    v-model="form.specialization"
                    :items="specializationOptions"
                    value-key="value"
                    multiple
                    placeholder="Seleccionar áreas..."
                    size="lg"
                  />
                </UFormField>
              </div>

              <UFormField label="Biografía / Descripción">
                <UTextarea
                  v-model="form.bio"
                  placeholder="Breve descripción del agente y su experiencia..."
                  :rows="3"
                />
              </UFormField>
            </div>

            <!-- Info -->
            <UAlert
              color="info"
              icon="i-lucide-info"
              title="Información"
              description="Se creará una cuenta para el agente y se le enviará un email para establecer su contraseña."
            />

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t">
              <UButton
                color="neutral"
                variant="ghost"
                @click="router.push('/admin/agentes')"
              >
                Cancelar
              </UButton>
              <UButton
                type="submit"
                :loading="loading"
                icon="i-lucide-save"
              >
                Guardar Agente
              </UButton>
            </div>
          </form>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
