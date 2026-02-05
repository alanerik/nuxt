<script setup lang="ts">
import type { Database } from '~/types/database.types'
import type { PropertyRow } from '~/types/property.types'
import type { Tenant } from '~/types/tenant.types'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const toast = useToast()
const { createRequest, fetchCategories, categories } = useMaintenance()
const { fetchProperties } = useProperties()
const { fetchTenants } = useTenants()

// Estado
const loading = ref(false)
const properties = ref<PropertyRow[]>([])
const tenants = ref<Tenant[]>([])

// Form data
const form = ref({
  property_id: '',
  tenant_id: '',
  title: '',
  description: '',
  category: '',
  priority: 'media'
})

// Validación
const errors = ref<Record<string, string>>({})

// Cargar datos iniciales
onMounted(async () => {
  try {
    await fetchCategories()
    const [propertiesResult, tenantsResult] = await Promise.all([
      fetchProperties({}),
      fetchTenants({})
    ])
    properties.value = propertiesResult.data || []
    tenants.value = tenantsResult.data || []
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'No se pudieron cargar los datos',
      color: 'error'
    })
  }
})

// Validar formulario
const validateForm = () => {
  errors.value = {}
  
  if (!form.value.property_id) {
    errors.value.property_id = 'Debe seleccionar una propiedad'
  }
  if (!form.value.title) {
    errors.value.title = 'El título es requerido'
  }
  if (!form.value.category) {
    errors.value.category = 'Debe seleccionar una categoría'
  }
  if (!form.value.priority) {
    errors.value.priority = 'Debe seleccionar una prioridad'
  }

  return Object.keys(errors.value).length === 0
}

// Enviar formulario
const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    await createRequest({
      property_id: form.value.property_id,
      title: form.value.title,
      description: form.value.description,
      category: form.value.category,
      priority: form.value.priority
    })

    toast.add({
      title: 'Solicitud creada',
      description: 'La solicitud de mantenimiento fue creada correctamente',
      color: 'success'
    })

    // Esperar un poco para que la base de datos registre el cambio
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    router.push('/admin/mantenimiento')
  } catch (e) {
    console.error('Error creating request:', e)
    toast.add({
      title: 'Error',
      description: 'No se pudo crear la solicitud',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Opciones de prioridad
const priorityOptions = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Nueva Solicitud de Mantenimiento">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton 
            icon="i-lucide-arrow-left" 
            to="/admin/mantenimiento"
            variant="ghost"
            color="neutral"
            label="Volver"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6 max-w-lg mx-auto">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Propiedad -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Propiedad</h3>
            </template>

            <USelectMenu
              v-model="form.property_id"
              :items="properties.map(p => ({ value: p.id, label: p.title }))"
              value-key="value"
              placeholder="Seleccionar propiedad..."
              searchable
              :error="!!errors.property_id"
            />
            <p v-if="errors.property_id" class="text-sm text-error mt-2">
              {{ errors.property_id }}
            </p>
          </UCard>

          <!-- Categoría y Prioridad -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UCard>
              <template #header>
                <h3 class="font-semibold">Categoría</h3>
              </template>

              <USelectMenu
                v-model="form.category"
                :items="categories.map(c => ({ value: c.id, label: c.name }))"
                value-key="value"
                placeholder="Seleccionar categoría..."
                searchable
                :error="!!errors.category"
              />
              <p v-if="errors.category" class="text-sm text-error mt-2">
                {{ errors.category }}
              </p>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="font-semibold">Prioridad</h3>
              </template>

              <USelectMenu
                v-model="form.priority"
                :items="priorityOptions"
                value-key="value"
                :error="!!errors.priority"
              />
              <p v-if="errors.priority" class="text-sm text-error mt-2">
                {{ errors.priority }}
              </p>
            </UCard>
          </div>

          <!-- Título -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Título</h3>
            </template>

            <UInput
              v-model="form.title"
              placeholder="Descripción breve del problema..."
              :error="!!errors.title"
            />
            <p v-if="errors.title" class="text-sm text-error mt-2">
              {{ errors.title }}
            </p>
          </UCard>

          <!-- Descripción -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Descripción Detallada</h3>
            </template>

            <textarea
              v-model="form.description"
              placeholder="Describe el problema en detalle..."
              class="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows="5"
            />
          </UCard>

          <!-- Botones -->
          <div class="flex gap-3 justify-end">
            <UButton
              to="/admin/mantenimiento"
              variant="ghost"
              label="Cancelar"
            />
            <UButton
              type="submit"
              :loading="loading"
              label="Crear Solicitud"
            />
          </div>
        </form>
      </div>
    </template>
  </UDashboardPanel>
</template>
