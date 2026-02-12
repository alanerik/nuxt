<script setup lang="ts">
import type { MaintenanceCategory } from '~/composables/useMaintenance'
import type { PropertyRow } from '~/types/property.types'

definePageMeta({
  layout: 'inquilino'
})

const router = useRouter()
const { createRequest, fetchCategories, categories, loading } = useMaintenance()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()

// State
const myProperties = ref<PropertyRow[]>([])
const loadingProps = ref(false)
const errors = ref<Record<string, string>>({})

const form = ref({
    property_id: '',
    category: '',
    priority: 'media',
    title: '',
    description: ''
})

const priorityOptions = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' }
]

// Load initial data
onMounted(async () => {
    fetchCategories()
    
    // Fallback: Check if user is already available in state or fetch from auth
    if (!user.value || !user.value.id) {

        const { data, error } = await supabase.auth.getUser()
        
        if (data?.user) {

             // Manually call fetch with the retrieved ID
             fetchMyProperties(data.user.id)
        } else {
             console.warn('⚠️ Maintenance Form: No session found.')
        }
    } else {
        // User already available
        fetchMyProperties(user.value.id)
    }
})

// Watch for user to be available to fetch properties (reactive fallback)
watch(user, (newUser) => {
    if (newUser?.id) {

        fetchMyProperties(newUser.id)
    }
})

const fetchMyProperties = async (userId?: string) => {
    const targetUserId = userId || user.value?.id
    
    if (!targetUserId) {

        return
    }

    loadingProps.value = true
    try {

        
        // Fetch active AND pending contracts to get properties
        // Sometimes a tenant might want to report an issue on a property they just signed for
        const { data, error } = await supabase
            .from('contracts')
            .select('status, property:properties(id, title, address)')
            .eq('tenant_id', targetUserId)
            .in('status', ['activo', 'pendiente'])
        

        
        if (error) {
            console.error('❌ Error fetching contracts:', error)
        }
        
        if (data) {
            // Filter out null properties just in case
            myProperties.value = data
                .map((c) => c.property)
                .filter(p => p !== null) as PropertyRow[]
                
            console.log('🏠 Properties found:', myProperties.value.length)
            
            if (myProperties.value.length === 1) {
                form.value.property_id = myProperties.value[0].id
            }
        }
    } catch (e) {
        console.error('Error fetching properties', e)
    } finally {
        loadingProps.value = false
    }
}

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

const handleSubmit = async () => {
    if (!validateForm()) return

    try {
        await createRequest({
            property_id: form.value.property_id,
            category: form.value.category,
            priority: form.value.priority,
            title: form.value.title,
            description: form.value.description
        })
        
        toast.add({ 
            title: 'Solicitud enviada', 
            description: 'Los administradores han sido notificados de tu problema.', 
            color: 'success' 
        })
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push('/inquilino/mantenimiento')
    } catch (e) {
        console.error('Error:', e)
        toast.add({ 
            title: 'Error', 
            description: 'No se pudo enviar la solicitud.', 
            color: 'error' 
        })
    }
}
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
            to="/inquilino/mantenimiento"
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

            <div v-if="myProperties.length > 1">
              <USelectMenu
                v-model="form.property_id"
                :items="myProperties.map(p => ({ value: p.id, label: p.title }))"
                value-key="value"
                placeholder="Seleccionar propiedad..."
                searchable
                :error="!!errors.property_id"
              />
              <p v-if="errors.property_id" class="text-sm text-error mt-2">
                {{ errors.property_id }}
              </p>
            </div>
            <div v-else-if="myProperties.length === 1" class="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p class="text-sm font-medium">{{ myProperties[0].title }}</p>
            </div>
            <div v-else class="p-3 rounded-lg bg-warning/5 border border-warning/20">
              <p class="text-sm text-warning font-medium">No tienes propiedades disponibles</p>
            </div>
          </UCard>

          <!-- Categoría y Prioridad -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UCard>
              <template #header>
                <h3 class="font-semibold">Categoría</h3>
              </template>

              <USelectMenu
                v-model="form.category"
                :items="categories.map(c => ({ value: c.name, label: c.name }))"
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
              to="/inquilino/mantenimiento"
              variant="ghost"
              label="Cancelar"
            />
            <UButton
              type="submit"
              :loading="loading"
              label="Enviar Solicitud"
            />
          </div>
        </form>
      </div>
    </template>
  </UDashboardPanel>
</template>
