<script setup lang="ts">
import type { Property } from '~/types/property.types'
import { 
  PROPERTY_TYPE_LABELS, 
  OPERATION_TYPE_LABELS,
  PROPERTY_STATUS_COLORS 
} from '~/types/property.types'

definePageMeta({
  layout: false // Sin layout, página pública
})

useSeoMeta({
  title: 'Propiedades en Venta y Alquiler',
  description: 'Encontrá tu próxima propiedad. Casas, departamentos, locales y más.'
})

const { fetchProperties } = useProperties()
const {
  filters,
  sort,
  pagination,
  totalPages,
  hasActiveFilters,
  activeFiltersCount,
  filtersDescription,
  updateFilter,
  clearFilters,
  updateSort,
  updatePage
} = usePropertyFilters()

// Estado
const properties = ref<Property[]>([])
const loading = ref(false)
const showFilters = ref(false)

// Carga inicial y reactiva
const loadProperties = async () => {
  loading.value = true
  try {
    const result = await fetchProperties(
      filters.value,
      sort.value,
      pagination.value
    )
    properties.value = result.data
  } finally {
    loading.value = false
  }
}

// Watch filters changes
watch([filters, sort, pagination], () => {
  loadProperties()
}, { deep: true })

// Carga inicial
onMounted(() => {
  loadProperties()
})

// Formato de precio
const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(price)
}

// Tipos para filtros rápidos
const propertyTypes = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}))

const operationTypes = Object.entries(OPERATION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}))

// Sort options
const sortOptions = [
  { value: 'created_at', label: 'Más recientes' },
  { value: 'price', label: 'Precio' },
  { value: 'area_m2', label: 'Superficie' },
  { value: 'views_count', label: 'Más vistas' }
]
</script>

<template>
  <div class="min-h-screen bg-default">
    <!-- Header público -->
    <header class="sticky top-0 z-50 border-b border-default bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-building" class="size-8 text-primary" />
            <span class="font-bold text-xl">Inmobiliaria</span>
          </div>
          
          <div class="flex items-center gap-2">
            <UButton variant="ghost" to="/login">
              Iniciar Sesión
            </UButton>
            <UButton to="/register">
              Registrarse
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-primary/5 to-background py-12 lg:py-20">
      <div class="container mx-auto px-4">
        <div class="text-center max-w-3xl mx-auto">
          <h1 class="text-4xl lg:text-5xl font-bold mb-4">
            Encontrá tu próxima propiedad
          </h1>
          <p class="text-lg text-muted mb-8">
            Miles de propiedades en venta y alquiler en todo el país
          </p>

          <!-- Búsqueda rápida -->
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex-1">
              <UInput
                :model-value="filters.search"
                @update:model-value="(val) => updateFilter('search', val)"
                size="xl"
                placeholder="Buscar por ubicación, tipo de propiedad..."
                icon="i-lucide-search"
              />
            </div>
            <UButton
              size="xl"
              @click="showFilters = !showFilters"
              variant="soft"
            >
              <UIcon name="i-lucide-sliders-horizontal" />
              Filtros
              <UBadge v-if="activeFiltersCount > 0" color="primary" size="xs">
                {{ activeFiltersCount }}
              </UBadge>
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters Panel -->
    <USlideover v-model:open="showFilters" title="Filtros">
      <template #body>
        <div class="p-4 space-y-6">
          <!-- Tipo de operación -->
          <div>
            <label class="text-sm font-medium mb-2 block">Tipo de operación</label>
            <div class="grid grid-cols-2 gap-2">
              <UButton
                v-for="op in operationTypes"
                :key="op.value"
                :variant="filters.operation_type === op.value ? 'solid' : 'soft'"
                @click="updateFilter('operation_type', op.value)"
                block
              >
                {{ op.label }}
              </UButton>
            </div>
          </div>

          <!-- Tipo de propiedad -->
          <div>
            <label class="text-sm font-medium mb-2 block">Tipo de propiedad</label>
            <USelectMenu
              :model-value="filters.property_type"
              @update:model-value="(val) => updateFilter('property_type', val)"
              :options="propertyTypes"
              placeholder="Seleccionar tipo"
              searchable
            />
          </div>

          <!-- Rango de precio -->
          <div>
            <label class="text-sm font-medium mb-2 block">Precio</label>
            <div class="grid grid-cols-2 gap-2">
              <UInput
                :model-value="filters.min_price"
                @update:model-value="(val) => updateFilter('min_price', Number(val))"
                type="number"
                placeholder="Mínimo"
                icon="i-lucide-dollar-sign"
              />
              <UInput
                :model-value="filters.max_price"
                @update:model-value="(val) => updateFilter('max_price', Number(val))"
                type="number"
                placeholder="Máximo"
                icon="i-lucide-dollar-sign"
              />
            </div>
          </div>

          <!-- Ambientes -->
          <div>
            <label class="text-sm font-medium mb-2 block">Dormitorios</label>
            <div class="grid grid-cols-4 gap-2">
              <UButton
                v-for="n in [1, 2, 3, 4]"
                :key="n"
                :variant="filters.bedrooms === n ? 'solid' : 'soft'"
                @click="updateFilter('bedrooms', n)"
                size="sm"
              >
                {{ n }}+
              </UButton>
            </div>
          </div>

          <!-- Baños -->
          <div>
            <label class="text-sm font-medium mb-2 block">Baños</label>
            <div class="grid grid-cols-4 gap-2">
              <UButton
                v-for="n in [1, 2, 3, 4]"
                :key="n"
                :variant="filters.bathrooms === n ? 'solid' : 'soft'"
                @click="updateFilter('bathrooms', n)"
                size="sm"
              >
                {{ n }}+
              </UButton>
            </div>
          </div>

          <!-- Ciudad -->
          <div>
            <label class="text-sm font-medium mb-2 block">Ciudad</label>
            <UInput
              :model-value="filters.city"
              @update:model-value="(val) => updateFilter('city', val)"
              placeholder="Ej: Buenos Aires"
              icon="i-lucide-map-pin"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <UButton variant="soft" @click="clearFilters" block>
              Limpiar filtros
            </UButton>
            <UButton @click="showFilters = false" block>
              Ver {{ properties.length }} resultados
            </UButton>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Results Section -->
    <section class="container mx-auto px-4 py-8">
      <!-- Toolbar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p class="text-sm text-muted">
            {{ properties.length }} propiedades encontradas
          </p>
          <p v-if="hasActiveFilters" class="text-sm text-primary">
            {{ filtersDescription }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <USelectMenu
            :model-value="sort.field"
            @update:model-value="(val) => updateSort(val)"
            :options="sortOptions"
            size="sm"
          >
            <template #label>
              <UIcon name="i-lucide-arrow-up-down" />
              Ordenar
            </template>
          </USelectMenu>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 6" :key="i" class="h-96" />
      </div>

      <!-- Properties Grid -->
      <div v-else-if="properties.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard 
          v-for="property in properties" 
          :key="property.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          :to="`/propiedades/${property.id}`"
        >
          <!-- Image -->
          <div class="aspect-video bg-muted rounded-lg overflow-hidden mb-4 relative">
            <img 
              v-if="property.images?.[0]"
              :src="property.images[0]" 
              :alt="property.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-lucide-image" class="size-12 text-muted" />
            </div>

            <!-- Badges -->
            <div class="absolute top-2 left-2 flex gap-2">
              <UBadge :color="PROPERTY_STATUS_COLORS[property.status]" variant="solid">
                {{ property.status }}
              </UBadge>
              <UBadge v-if="property.is_featured" color="warning" variant="solid">
                Destacada
              </UBadge>
            </div>
          </div>

          <!-- Info -->
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-semibold text-lg line-clamp-1">
                {{ property.title }}
              </h3>
              <UBadge variant="soft" size="sm">
                {{ OPERATION_TYPE_LABELS[property.operation_type] }}
              </UBadge>
            </div>

            <p class="text-sm text-muted mb-3 line-clamp-2">
              {{ property.address }}, {{ property.city }}
            </p>

            <div class="flex items-center gap-3 text-sm text-muted mb-3">
              <span v-if="property.bedrooms" class="flex items-center gap-1">
                <UIcon name="i-lucide-bed" />
                {{ property.bedrooms }}
              </span>
              <span v-if="property.bathrooms" class="flex items-center gap-1">
                <UIcon name="i-lucide-bath" />
                {{ property.bathrooms }}
              </span>
              <span v-if="property.area_m2" class="flex items-center gap-1">
                <UIcon name="i-lucide-ruler" />
                {{ property.area_m2 }}m²
              </span>
            </div>

            <div class="flex items-center justify-between">
              <p class="text-2xl font-bold text-primary">
                {{ formatPrice(property.price, property.currency) }}
              </p>
            </div>

            <p v-if="property.expenses > 0" class="text-xs text-muted mt-1">
              + {{ formatPrice(property.expenses, property.currency) }} expensas
            </p>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-search-x" class="size-16 mx-auto mb-4 text-muted" />
        <h3 class="text-xl font-semibold mb-2">No se encontraron propiedades</h3>
        <p class="text-muted mb-4">Intenta ajustar tus filtros de búsqueda</p>
        <UButton @click="clearFilters" variant="soft">
          Limpiar filtros
        </UButton>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <UPagination
          :model-value="pagination.page"
          @update:model-value="updatePage"
          :total="totalPages"
          :max="7"
        />
      </div>
    </section>
  </div>
</template>