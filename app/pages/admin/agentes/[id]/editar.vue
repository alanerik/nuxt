<script setup lang="ts">
import type { AgentWithDetails } from '~/types/agent.types'
import { AGENT_SPECIALIZATIONS } from '~/types/agent.types'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const { getAgentById, updateAgent } = useAgents()
const toast = useToast()

const agentId = computed(() => route.params.id as string)

// Estado
const agent = ref<AgentWithDetails | null>(null)
const loading = ref(true)
const saving = ref(false)

// Form state
const form = ref({
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

  if (form.value.commission_rate < 0 || form.value.commission_rate > 100) {
    errors.value.commission_rate = 'La comisión debe estar entre 0 y 100'
  }

  return Object.keys(errors.value).length === 0
}

// Cargar datos
const loadData = async () => {
  loading.value = true
  try {
    const agentData = await getAgentById(agentId.value)

    if (!agentData) {
      toast.add({
        title: 'Error',
        description: 'Agente no encontrado',
        color: 'error'
      })
      router.push('/admin/agentes')
      return
    }

    agent.value = agentData
    
    // Rellenar formulario
    form.value = {
      license_number: agentData.license_number || '',
      commission_rate: agentData.commission_rate || 5,
      specialization: agentData.specialization || [],
      bio: agentData.bio || ''
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo cargar la información del agente',
      color: 'error'
    })
    router.push('/admin/agentes')
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
    await updateAgent(agentId.value, {
      license_number: form.value.license_number || undefined,
      commission_rate: form.value.commission_rate,
      specialization: form.value.specialization.length > 0 ? form.value.specialization : undefined,
      bio: form.value.bio || undefined
    })

    toast.add({
      title: 'Agente actualizado',
      description: 'Los datos fueron guardados correctamente',
      color: 'success'
    })

    router.push(`/admin/agentes/${agentId.value}`)
  } catch (error) {
    console.error('Error updating agent:', error)
    toast.add({
      title: 'Error',
      description: 'No se pudo actualizar el agente',
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
  <UDashboardPanel id="edit-agent">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="router.push(`/admin/agentes/${agentId}`)"
          >
            Volver
          </UButton>
        </template>

        <template #title>
          Editar Agente
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
                  v-if="agent?.profile?.avatar_url"
                  :src="agent.profile.avatar_url"
                  :alt="agent.profile.full_name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-2xl font-semibold text-primary">
                  {{ getInitials(agent?.profile?.full_name) }}
                </span>
              </div>
              <div>
                <h2 class="text-lg font-semibold">{{ agent?.profile?.full_name || 'Sin nombre' }}</h2>
                <p class="text-sm text-muted">{{ agent?.profile?.email }}</p>
              </div>
            </div>
          </template>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Datos de Contacto (solo lectura) -->
            <div class="space-y-4">
              <h3 class="font-medium flex items-center gap-2">
                <UIcon name="i-lucide-user" class="size-4" />
                Datos de Contacto
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Email">
                  <UInput
                    :model-value="agent?.profile?.email"
                    disabled
                    icon="i-lucide-mail"
                    size="lg"
                  />
                  <template #hint>
                    <span class="text-xs text-muted">El email no puede ser modificado</span>
                  </template>
                </UFormField>

                <UFormField label="Teléfono">
                  <UInput
                    :model-value="agent?.profile?.phone || 'No registrado'"
                    disabled
                    icon="i-lucide-phone"
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
                <UFormField label="Matrícula">
                  <UInput
                    v-model="form.license_number"
                    placeholder="CUCICBA 1234"
                    icon="i-lucide-id-card"
                    size="lg"
                  />
                </UFormField>

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
              </div>

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

              <UFormField label="Biografía / Descripción">
                <UTextarea
                  v-model="form.bio"
                  placeholder="Breve descripción del agente y su experiencia..."
                  :rows="3"
                />
              </UFormField>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t">
              <UButton
                color="neutral"
                variant="ghost"
                @click="router.push(`/admin/agentes/${agentId}`)"
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
