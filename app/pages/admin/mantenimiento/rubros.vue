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
  description: ''
})

// Load data
onMounted(() => {
  fetchCategories()
})

// Actions
const openCreateModal = () => {
  editingCategory.value = null
  formData.value = { name: '', description: '' }
  isModalOpen.value = true
}

const openEditModal = (category: MaintenanceCategory) => {
  editingCategory.value = category
  formData.value = { 
    name: category.name, 
    description: category.description || '' 
  }
  isModalOpen.value = true
}

const handleSave = async () => {
  try {
    if (editingCategory.value) {
      // Update
      const { error } = await supabase
        .from('maintenance_categories' as any)
        .update({ 
          name: formData.value.name, 
          description: formData.value.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCategory.value.id)

      if (error) throw error
      toast.add({ title: 'Rubro actualizado', color: 'success' })
    } else {
      // Create
      const { error } = await supabase
        .from('maintenance_categories' as any)
        .insert({ 
          name: formData.value.name, 
          description: formData.value.description 
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
      .from('maintenance_categories' as any)
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
          >
            Volver
          </UButton>
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
            <template #status-data="{ row }">
              <UBadge :color="row.is_active ? 'success' : 'neutral'" variant="subtle" size="xs">
                {{ row.is_active ? 'Activo' : 'Inactivo' }}
              </UBadge>
            </template>

            <template #actions-data="{ row }">
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
            <UButton @click="openCreateModal">Crear Rubro</UButton>
          </div>
        </UCard>

        <UModal v-model="isModalOpen">
          <div class="p-6">
            <UCard>
              <template #header>
                <h3 class="font-semibold text-lg">
                  {{ editingCategory ? 'Editar Rubro' : 'Nuevo Rubro' }}
                </h3>
              </template>

              <div class="space-y-4">
                <div>
                  <label class="text-sm font-medium mb-2 block">Nombre</label>
                  <UInput v-model="formData.name" placeholder="Ej: Plomería" />
                </div>
                
                <div>
                  <label class="text-sm font-medium mb-2 block">Descripción</label>
                  <UInput v-model="formData.description" placeholder="Breve descripción del rubro" />
                </div>
              </div>

              <template #footer>
                <div class="flex justify-end gap-2">
                  <UButton color="neutral" variant="ghost" @click="isModalOpen = false">Cancelar</UButton>
                  <UButton color="primary" @click="handleSave" :disabled="!formData.name">Guardar</UButton>
                </div>
              </template>
            </UCard>
          </div>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
