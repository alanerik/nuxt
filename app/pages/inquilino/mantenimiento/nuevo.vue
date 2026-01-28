<script setup lang="ts">
import type { MaintenanceCategory } from '~/composables/useMaintenance'

definePageMeta({
  layout: 'inquilino'
})

const router = useRouter()
const { createRequest, fetchCategories, categories, loading } = useMaintenance()
const { fetchActiveContracts } = usePayments() // Reuse this to get properties if suitable or fetch manually

const user = useSupabaseUser()
const supabase = useSupabaseClient()

// State
const myProperties = ref<any[]>([])
const loadingProps = ref(false)

const form = ref({
    property_id: '',
    category: '', // Rubro name
    priority: 'media',
    title: '',
    description: '',
    images: [] as string[]
})

const priorityOptions = [
    { value: 'baja', label: 'Baja - Puede esperar' },
    { value: 'media', label: 'Media - Necesita atención' },
    { value: 'alta', label: 'Alta - Urgente' },
    { value: 'urgente', label: 'Emergencia - Inmediato' }
]

// Load initial data
onMounted(async () => {
    fetchCategories()
    fetchMyProperties()
})

const fetchMyProperties = async () => {
    loadingProps.value = true
    try {
        if (!user.value) return
        
        // Fetch active contracts to get properties
        const { data } = await supabase
            .from('contracts')
            .select('property:properties(id, title, address)')
            .eq('tenant_id', user.value.id)
            .eq('status', 'activo')
        
        if (data) {
            myProperties.value = data.map((c: any) => c.property)
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

const handleSubmit = async () => {
    try {
        await createRequest({
            property_id: form.value.property_id,
            category: form.value.category,
            priority: form.value.priority,
            title: form.value.title,
            description: form.value.description,
            images: form.value.images
        })
        
        useToast().add({ title: 'Solicitud enviada', description: 'El agente ha sido notificado.', color: 'success' })
        router.push('/inquilino/mantenimiento')
    } catch (e) {
        useToast().add({ title: 'Error', description: 'No se pudo enviar la solicitud.', color: 'error' })
    }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Nueva Solicitud de Mantenimiento">
        <template #leading>
            <UButton icon="i-lucide-arrow-left" variant="ghost" to="/inquilino/mantenimiento" />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="p-6 max-w-2xl mx-auto">
        <form @submit.prevent="handleSubmit" class="space-y-6">
            
            <UCard>
                <div class="space-y-4">
                    <!-- Property Selection -->
                    <div v-if="myProperties.length > 1">
                        <UFormGroup label="Propiedad afectada" required>
                             <USelectMenu
                                v-model="form.property_id"
                                :options="myProperties"
                                option-attribute="title"
                                value-attribute="id"
                                placeholder="Selecciona la propiedad"
                             />
                        </UFormGroup>
                    </div>
                    <div v-else-if="myProperties.length === 1" class="text-sm text-muted">
                        Solicitud para: <span class="font-medium text-foreground">{{ myProperties[0].title }}</span>
                    </div>

                    <!-- Category (Rubro) -->
                    <UFormGroup label="Rubro (Categoría)" required>
                        <USelectMenu
                            v-model="form.category"
                            :options="categories"
                            option-attribute="name"
                            value-attribute="name"
                            placeholder="Ej: Plomería, Electricidad..."
                            searchable
                        />
                    </UFormGroup>

                    <!-- Priority -->
                    <UFormGroup label="Prioridad" required>
                        <USelectMenu
                            v-model="form.priority"
                            :options="priorityOptions"
                            option-attribute="label"
                            value-attribute="value"
                        />
                    </UFormGroup>

                    <!-- Title -->
                     <UFormGroup label="Título del problema" required>
                        <UInput v-model="form.title" placeholder="Ej: Cañería rota en el baño" />
                    </UFormGroup>

                    <!-- Description -->
                    <UFormGroup label="Descripción detallada" required>
                        <UTextarea 
                            v-model="form.description" 
                            placeholder="Describe el problema con el mayor detalle posible..."
                            :rows="4"
                        />
                    </UFormGroup>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton to="/inquilino/mantenimiento" variant="ghost" color="neutral">Cancelar</UButton>
                        <UButton type="submit" :loading="loading" :disabled="!form.title || !form.category">
                            Enviar Solicitud
                        </UButton>
                    </div>
                </template>
            </UCard>
        </form>
    </div>
  </UDashboardPanel>
</template>
