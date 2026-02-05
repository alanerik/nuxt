<script setup lang="ts">
import type { Property } from '~/types/property.types'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const propertyId = computed(() => route.params.id as string)
const { fetchProperty } = useProperties()

const property = ref<Property | null>(null)
const loading = ref(true)

const loadProperty = async () => {
  loading.value = true
  try {
    property.value = await fetchProperty(propertyId.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProperty()
})

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(price)
}
</script>

<template>
  <div class="min-h-screen bg-default-50">
    <header class="sticky top-0 z-50 border-b border-default bg-background/95 backdrop-blur">
      <div class="container mx-auto px-4 py-4 flex items-center gap-4">
        <UButton variant="ghost" icon="i-lucide-arrow-left" label="Volver" to="/admin/propiedades" />
        <h1 v-if="property" class="text-xl font-semibold truncate">{{ property.title }}</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8 max-w-7xl">
      <div v-if="loading" class="space-y-4">
        <USkeleton class="h-[500px] w-full rounded-xl" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="md:col-span-2 space-y-4">
            <USkeleton class="h-8 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
            <USkeleton class="h-32 w-full" />
          </div>
          <div class="space-y-4">
            <USkeleton class="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div v-else-if="property" class="space-y-8">
        <!-- Galería -->
        <div class="relative aspect-video w-full overflow-hidden rounded-2xl bg-default-100 shadow-xl">
          <img 
            v-if="property.images && property.images.length > 0"
            :src="property.images[0]" 
            :alt="property.title"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full items-center justify-center text-default-400">
            <UIcon name="i-lucide-image" class="h-20 w-20" />
          </div>
          <div class="absolute top-4 right-4 flex gap-2">
            <UBadge :color="property.operation_type === 'venta' ? 'primary' : 'success'" variant="solid" size="lg">
              {{ property.operation_type === 'venta' ? 'Venta' : 'Alquiler' }}
            </UBadge>
            <UBadge color="neutral" variant="outline" size="lg" class="capitalize bg-background font-medium">
              {{ property.status }}
            </UBadge>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Información Principal -->
          <div class="lg:col-span-2 space-y-6">
            <div>
              <h1 class="text-4xl font-bold text-default-900 mb-2">{{ property.title }}</h1>
              <div class="flex items-center text-default-500 gap-2">
                <UIcon name="i-lucide-map-pin" />
                <span>{{ property.address }}, {{ property.city }}</span>
              </div>
            </div>

            <div class="flex flex-wrap gap-6 py-6 border-y border-default-200">
              <div class="flex items-center gap-2">
                <div class="p-2 bg-primary-50 text-primary rounded-lg">
                  <UIcon name="i-lucide-bed" class="w-6 h-6" />
                </div>
                <div>
                  <div class="text-sm text-default-500">Dormitorios</div>
                  <div class="font-bold">{{ property.bedrooms }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="p-2 bg-primary-50 text-primary rounded-lg">
                  <UIcon name="i-lucide-bath" class="w-6 h-6" />
                </div>
                <div>
                  <div class="text-sm text-default-500">Baños</div>
                  <div class="font-bold">{{ property.bathrooms }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="p-2 bg-primary-50 text-primary rounded-lg">
                  <UIcon name="i-lucide-maximize" class="w-6 h-6" />
                </div>
                <div>
                  <div class="text-sm text-default-500">Superficie</div>
                  <div class="font-bold">{{ property.area_m2 }} m²</div>
                </div>
              </div>
            </div>

            <section class="space-y-4">
              <h2 class="text-2xl font-bold">Descripción</h2>
              <p class="text-default-600 leading-relaxed whitespace-pre-line">
                {{ property.description }}
              </p>
            </section>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <UCard class="sticky top-24 shadow-xl border-none">
              <div class="space-y-6">
                <div>
                  <div class="text-default-500 text-sm mb-1">Precio</div>
                  <div class="text-3xl font-bold text-primary">
                    {{ formatPrice(property.price, property.currency) }}
                  </div>
                  <div v-if="property.expenses" class="text-sm text-default-500 mt-1">
                    + {{ formatPrice(property.expenses, property.currency) }} expensas
                  </div>
                </div>

                <UButton block size="xl" color="primary" icon="i-lucide-pencil" label="Editar Propiedad" :to="`/admin/propiedades/${property.id}/editar`" />
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
