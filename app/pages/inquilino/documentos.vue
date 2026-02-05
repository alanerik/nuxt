<script setup lang="ts">
definePageMeta({
  layout: 'inquilino'
})

const documents = ref([
  {
    id: 1,
    name: 'Contrato de Alquiler',
    description: 'Documento principal del contrato',
    date: '2024-01-15',
    type: 'pdf',
    size: '2.4 MB'
  },
  {
    id: 2,
    name: 'Recibo de Garantía',
    description: 'Comprobante del depósito de garantía',
    date: '2024-01-15',
    type: 'pdf',
    size: '1.1 MB'
  },
  {
    id: 3,
    name: 'Inventario de Bienes',
    description: 'Lista de elementos incluidos en la propiedad',
    date: '2024-01-20',
    type: 'pdf',
    size: '890 KB'
  }
])

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'i-lucide-file-pdf'
    case 'doc':
      return 'i-lucide-file-text'
    default:
      return 'i-lucide-file'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Mis Documentos">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton 
            icon="i-lucide-arrow-left" 
            to="/inquilino/dashboard"
            variant="ghost"
            color="neutral"
            label="Volver"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6 max-w-4xl mx-auto">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Documentos Disponibles</h2>
              <UBadge variant="soft">{{ documents.length }} documentos</UBadge>
            </div>
          </template>

          <div class="divide-y divide-default">
            <div 
              v-for="doc in documents" 
              :key="doc.id"
              class="py-4 flex items-center justify-between hover:bg-muted/30 transition-colors px-2 rounded-lg"
            >
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-lg bg-primary/10">
                  <UIcon :name="getFileIcon(doc.type)" class="size-6 text-primary" />
                </div>
                <div>
                  <p class="font-medium">{{ doc.name }}</p>
                  <p class="text-sm text-muted">{{ doc.description }}</p>
                  <p class="text-xs text-muted mt-1">{{ formatDate(doc.date) }} • {{ doc.size }}</p>
                </div>
              </div>

              <UButton 
                icon="i-lucide-download" 
                variant="ghost" 
                color="neutral"
                disabled
                title="Descargar (próximamente)"
              />
            </div>
          </div>

          <template #footer>
            <p class="text-sm text-muted text-center py-4">
              Los documentos estarán disponibles para descargar próximamente
            </p>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
