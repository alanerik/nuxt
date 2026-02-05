<script setup lang="ts">
import type { MaintenanceCategory } from '~/composables/useMaintenance'

definePageMeta({
  layout: 'admin'
})

const { fetchCategories, categories, loading } = useMaintenance()
const supabase = useSupabaseClient()
const toast = useToast()

// State
const isModalOpen = ref(false)
const editingCategory = ref<MaintenanceCategory | null>(null)
const formData = ref({
  name: '',
  description: '',
  contact_name: '',
  contact_last_name: '',
  contact_phone: '',
  contact_notes: ''
})

// Load data
onMounted(() => {
  fetchCategories()
})

// Actions
const openCreateModal = () => {
  editingCategory.value = null
  formData.value = { 
    name: '', 
    description: '',
    contact_name: '',
    contact_last_name: '',
    contact_phone: '',
    contact_notes: ''
  }
  isModalOpen.value = true
}

const openEditModal = (category: MaintenanceCategory) => {
  editingCategory.value = category
  formData.value = { 
    name: category.name, 
    description: category.description || '',
    contact_name: category.contact_name || '',
    contact_last_name: category.contact_last_name || '',
    contact_phone: category.contact_phone || '',
    contact_notes: category.contact_notes || ''
  }
  isModalOpen.value = true
}

const handleSave = async () => {
  try {
    if (editingCategory.value) {
      // Update
      const { error } = await supabase
        .from('maintenance_categories')
        .update({ 
          name: formData.value.name, 
          description: formData.value.description,
          contact_name: formData.value.contact_name || null,
          contact_last_name: formData.value.contact_last_name || null,
          contact_phone: formData.value.contact_phone || null,
          contact_notes: formData.value.contact_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCategory.value.id)

      if (error) throw error
      toast.add({ title: 'Rubro actualizado', color: 'success' })
    } else {
      // Create
      const { error } = await supabase
        .from('maintenance_categories')
        .insert({ 
          name: formData.value.name, 
          description: formData.value.description,
          contact_name: formData.value.contact_name || null,
          contact_last_name: formData.value.contact_last_name || null,
          contact_phone: formData.value.contact_phone || null,
          contact_notes: formData.value.contact_notes || null
        })

      if (error) throw error
      toast.add({ title: 'Rubro creado', color: 'success' })
    }

    isModalOpen.value = false
    fetchCategories()
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Error al guardar', color: 'error' })
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar este rubro?')) return

  try {
    const { error } = await supabase
      .from('maintenance_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    toast.add({ title: 'Rubro eliminado', color: 'success' })
    fetchCategories()
  } catch (e) {
    console.error(e)
    toast.add({ title: 'Error al eliminar', color: 'error' })
  }
}

const columns = [
  { key: 'name', label: 'Nombre', id: 'name' },
  { key: 'description', label: 'Descripción', id: 'description' },
  { key: 'status', label: 'Estado', id: 'status' },
  { key: 'actions', label: '', id: 'actions' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Gestión de Rubros">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton 
            to="/admin/mantenimiento"
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            label="Volver"
          />
          <UButton 
            label="Nuevo Rubro" 
            icon="i-lucide-plus" 
            @click="openCreateModal"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <UCard :ui="{ body: { padding: 'p-0 sm:p-0' } }">
          <UTable :columns="columns" :rows="categories" :loading="loading">
            <template #description-cell="{ row }">
              <div class="text-sm">
                <p class="text-muted">{{ row.description }}</p>
                <div v-if="row.contact_name || row.contact_phone" class="mt-2 pt-2 border-t space-y-1">
                  <p v-if="row.contact_name" class="text-xs font-medium">
                    👤 {{ row.contact_name }} {{ row.contact_last_name }}
                  </p>
                  <p v-if="row.contact_phone" class="text-xs">
                    📞 {{ row.contact_phone }}
                  </p>
                </div>
              </div>
            </template>

            <template #status-cell="{ row }">
              <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="subtle" size="xs">
                {{ row.is_active ? 'Activo' : 'Inactivo' }}
              </UBadge>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-2">
                <UButton 
                  icon="i-lucide-pencil" 
                  color="neutral" 
                  variant="ghost" 
                  size="xs"
                  @click="openEditModal(row)" 
                />
                <UButton 
                  icon="i-lucide-trash" 
                  color="error" 
                  variant="ghost" 
                  size="xs"
                  @click="handleDelete(row.id)" 
                />
              </div>
            </template>
          </UTable>

          <div v-if="!loading && categories.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-folder" class="size-16 mx-auto mb-4 text-muted" />
            <h3 class="text-lg font-semibold mb-2">No hay rubros</h3>
            <UButton label="Crear Rubro" @click="openCreateModal" />
          </div>
        </UCard>

        <!-- Formulario de Edición/Creación -->
        <div v-if="isModalOpen" class="max-w-lg mx-auto">
          <UCard class="border-primary/50">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-lg">
                {{ editingCategory ? 'Editar Rubro' : 'Nuevo Rubro' }}
              </h3>
              <UButton color="gray" variant="ghost" icon="i-lucide-x" size="sm" @click="isModalOpen = false" />
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium mb-2 block">Nombre</label>
                <UInput v-model="formData.name" placeholder="Ej: Plomería" />
              </div>
              
              <div>
                <label class="text-sm font-medium mb-2 block">Descripción</label>
                <UInput v-model="formData.description" placeholder="Breve descripción del rubro" />
              </div>
            </div>

            <div class="border-t pt-4">
              <h4 class="text-sm font-semibold mb-4">Información de Contacto (Responsable)</h4>
              
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="text-sm font-medium mb-2 block">Nombre</label>
                  <UInput v-model="formData.contact_name" placeholder="Nombre del responsable" />
                </div>
                <div>
                  <label class="text-sm font-medium mb-2 block">Apellido</label>
                  <UInput v-model="formData.contact_last_name" placeholder="Apellido" />
                </div>
              </div>

              <div class="mb-3">
                <label class="text-sm font-medium mb-2 block">Teléfono</label>
                <UInput v-model="formData.contact_phone" placeholder="+54 9 11 2345-6789" />
              </div>

              <div>
                <label class="text-sm font-medium mb-2 block">Notas</label>
                <UTextarea v-model="formData.contact_notes" placeholder="Información adicional (horarios, especialidad, etc.)" rows="3" />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="ghost" label="Cancelar" @click="isModalOpen = false" />
              <UButton color="primary" label="Guardar" @click="handleSave" :disabled="!formData.name" />
            </div>
          </template>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
