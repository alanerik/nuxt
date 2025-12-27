<script setup lang="ts">
import type { PropertyInsert } from '~/types/property.types'
import { COMMON_AMENITIES } from '~/types/property.types'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const toast = useToast()
const { createProperty, uploadPropertyImages } = useProperties()
const supabase = useSupabaseClient()

// Estado
const loading = ref(false)
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])

// Form data
const form = ref<Partial<PropertyInsert>>({
  title: '',
  slug: '',
  description: '',
  property_type: 'departamento',
  operation_type: 'venta',
  status: 'disponible',
  address: '',
  city: '',
  state: '',
  country: 'Argentina',
  zip_code: '',
  latitude: null,
  longitude: null,
  bedrooms: 1,
  bathrooms: 1,
  area_m2: null,
  built_area_m2: null,
  floor_number: null,
  total_floors: null,
  parking_spaces: 0,
  year_built: null,
  price: 0,
  currency: 'USD',
  expenses: 0,
  amenities: [],
  images: [],
  video_url: '',
  virtual_tour_url: '',
  is_featured: false,
  is_published: true,
  rental_period: 'mes',
  semi_covered_area_m2: null,
  land_area_m2: null
})

// Estado adicional
// Estado adicional
const isNewProperty = ref(false)

// Períodos de alquiler temporal
const rentalPeriods = [
  { value: 'dia', label: 'Por día' },
  { value: 'semana', label: 'Por semana' },
  { value: 'quincena', label: 'Por quincena' },
  { value: 'mes', label: 'Por mes' }
]

// Label dinámico del precio
const priceLabel = computed(() => {
  if (form.value.operation_type === 'venta') return 'Precio de venta'
  if (form.value.operation_type === 'alquiler') return 'Precio mensual'
  // alquiler_temporal
  const periodLabels: Record<string, string> = {
    dia: 'Precio por día',
    semana: 'Precio por semana',
    quincena: 'Precio por quincena',
    mes: 'Precio por mes'
  }
  return periodLabels[form.value.rental_period || 'mes'] || 'Precio'
})

// Tipos de operación con íconos
const operationTypes = [
  { value: 'venta', label: 'Venta', icon: 'i-lucide-banknote' },
  { value: 'alquiler', label: 'Alquiler', icon: 'i-lucide-key' },
  { value: 'alquiler_temporal', label: 'Temporal', icon: 'i-lucide-calendar' }
]

// Tipos de propiedad con íconos
const propertyTypes = [
  { value: 'departamento', label: 'Departamento', icon: 'i-lucide-building-2' },
  { value: 'casa', label: 'Casa', icon: 'i-lucide-home' },
  { value: 'ph', label: 'PH', icon: 'i-lucide-building' },
  { value: 'local', label: 'Local', icon: 'i-lucide-store' },
  { value: 'oficina', label: 'Oficina', icon: 'i-lucide-briefcase' },
  { value: 'terreno', label: 'Terreno', icon: 'i-lucide-map' },
  { value: 'cochera', label: 'Cochera', icon: 'i-lucide-car' }
]

// Manejo de imágenes
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      imageFiles.value.push(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        imagePreviews.value.push(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  })
}

const removeImage = (index: number) => {
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

// Generar slug automáticamente
watch(() => form.value.title, (newTitle) => {
  if (newTitle) {
    form.value.slug = newTitle
      .toLowerCase()
      .normalize('NFD') // Eliminar acentos
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/-+/g, '-') // Eliminar guiones duplicados
  }
})

// Toggle amenity
const toggleAmenity = (amenity: string) => {
  const amenities = form.value.amenities || []
  const index = amenities.indexOf(amenity)
  
  if (index > -1) {
    amenities.splice(index, 1)
  } else {
    amenities.push(amenity)
  }
  
  form.value.amenities = [...amenities]
}

// Formatear moneda
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

// Validación
const isFormValid = computed(() => {
  return !!(
    form.value.title &&
    form.value.property_type &&
    form.value.operation_type &&
    form.value.address &&
    form.value.city &&
    form.value.price && form.value.price > 0
  )
})

// Guardar propiedad
const handleSubmit = async () => {
  if (!isFormValid.value) {
    toast.add({
      title: 'Campos requeridos',
      description: 'Por favor completá todos los campos obligatorios',
      color: 'warning'
    })
    return
  }

  loading.value = true
  
  try {
    const property = await createProperty(form.value as PropertyInsert)
    
    if (!property) {
      throw new Error('No se pudo crear la propiedad')
    }
    
    // Subir imágenes si hay
    if (imageFiles.value.length > 0) {
      const uploadedUrls = await uploadPropertyImages(property.id, imageFiles.value)
      
      await supabase
        .from('properties')
        .update({ images: uploadedUrls } as any)
        .eq('id', property.id)
    }
    
    toast.add({
      title: 'Propiedad creada',
      description: 'La propiedad fue creada correctamente',
      color: 'success'
    })
    
    router.push('/admin/propiedades')
  } catch (error: any) {
    console.error('Error creating property:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'No se pudo crear la propiedad',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="admin-properties-new">
    <template #header>
      <UDashboardNavbar title="Nueva Propiedad">
        <template #leading>
          <UButton
            variant="ghost"
            icon="i-lucide-arrow-left"
            to="/admin/propiedades"
          >
            Volver
          </UButton>
        </template>

        <template #right>
          <UButton
            :loading="loading"
            :disabled="!isFormValid"
            icon="i-lucide-check"
            @click="handleSubmit"
          >
            Publicar Propiedad
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-4xl mx-auto p-6 space-y-8">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          
          <!-- ==================== INFORMACIÓN BÁSICA ==================== -->
          <section class="space-y-6">
            <div class="pb-4 border-b border-default">
              <h2 class="text-xl font-semibold">Información Básica</h2>
            </div>

            <!-- Título y Slug -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Título de la publicación *" required>
                <UInput
                  v-model="form.title"
                  placeholder="Ej: Departamento 3 ambientes con balcón en Palermo"
                  size="lg"
                />
              </UFormField>

              <UFormField label="Slug (URL amigable)">
                <UInput
                  v-model="form.slug"
                  placeholder="Se genera automáticamente"
                  size="lg"
                  readonly
                  disabled
                  class="opacity-75"
                />
              </UFormField>
            </div>

            <!-- Descripción -->
            <UFormField label="Descripción">
              <UTextarea
                v-model="form.description"
                placeholder="Describe las características principales de la propiedad..."
                :rows="4"
              />
            </UFormField>

            <!-- Tipo de Operación -->
            <div>
              <label class="block text-sm font-medium mb-3">Tipo de operación *</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="op in operationTypes"
                  :key="op.value"
                  type="button"
                  @click="form.operation_type = op.value as any"
                  class="p-4 rounded-xl border-2 transition-all text-center"
                  :class="form.operation_type === op.value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-default hover:border-primary/50'"
                >
                  <span class="text-sm font-medium">{{ op.label }}</span>
                </button>
              </div>
            </div>

            <!-- Período de alquiler temporal -->
            <div v-if="form.operation_type === 'alquiler_temporal'">
              <label class="block text-sm font-medium mb-3">Período de alquiler *</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  v-for="period in rentalPeriods"
                  :key="period.value"
                  type="button"
                  @click="form.rental_period = period.value"
                  class="p-3 rounded-xl border-2 transition-all text-center"
                  :class="form.rental_period === period.value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-default hover:border-primary/50'"
                >
                  <span class="text-sm font-medium">{{ period.label }}</span>
                </button>
              </div>
            </div>

            <!-- Precio y Moneda -->
            <div class="space-y-4 p-4 rounded-xl bg-muted/20 border border-default">
              <!-- Toggle Moneda -->
              <div>
                <label class="block text-sm font-medium mb-2">Moneda</label>
                <div class="inline-flex rounded-lg border border-default p-1 bg-muted/30">
                  <button
                    type="button"
                    @click="form.currency = 'USD'"
                    class="px-6 py-2 rounded-md text-sm font-medium transition-all"
                    :class="form.currency === 'USD' 
                      ? 'bg-success text-white shadow-sm' 
                      : 'text-muted hover:text-default'"
                  >
                    🇺🇸 USD
                  </button>
                  <button
                    type="button"
                    @click="form.currency = 'ARS'"
                    class="px-6 py-2 rounded-md text-sm font-medium transition-all"
                    :class="form.currency === 'ARS' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-muted hover:text-default'"
                  >
                    🇦🇷 ARS
                  </button>
                </div>
              </div>

              <!-- Precio Principal -->
              <div>
                <label class="block text-sm font-medium mb-2">{{ priceLabel }} *</label>
                <div class="flex items-center gap-3">
                  <span class="text-2xl font-bold text-muted">$</span>
                  <UInput
                    v-model.number="form.price"
                    type="number"
                    min="0"
                    size="xl"
                    placeholder="0"
                    class="text-2xl font-bold flex-1"
                  />
                  <span class="text-lg text-muted">{{ form.currency }}</span>
                </div>
              </div>

              <!-- Expensas (solo para alquiler normal) -->
              <div v-if="form.operation_type === 'alquiler'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Expensas mensuales">
                  <UInput v-model.number="form.expenses" type="number" min="0" size="lg" placeholder="0" />
                </UFormField>

                <div class="flex items-end">
                  <div class="p-3 rounded-lg bg-info/10 border border-info/20 w-full">
                    <p class="text-sm text-info">
                      Total mensual: <strong>{{ formatCurrency((form.price || 0) + (form.expenses || 0), form.currency || 'ARS') }}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tipo de Propiedad -->
            <div>
              <label class="block text-sm font-medium mb-3">Tipo de propiedad *</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  v-for="pt in propertyTypes"
                  :key="pt.value"
                  type="button"
                  @click="form.property_type = pt.value as any"
                  class="p-4 rounded-xl border-2 transition-all text-center"
                  :class="form.property_type === pt.value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-default hover:border-primary/50'"
                >
                  <span class="text-sm font-medium">{{ pt.label }}</span>
                </button>
              </div>
            </div>



            <!-- Características especiales -->
            <div class="flex flex-wrap gap-6">
              <UCheckbox v-model="isNewProperty" label="A estrenar" />
              <UCheckbox 
                :model-value="(form.parking_spaces ?? 0) > 0" 
                @update:model-value="form.parking_spaces = $event ? 1 : 0" 
                label="Cochera" 
              />
              <UCheckbox v-model="form.is_featured" label="Destacada" />
            </div>
          </section>

          <!-- ==================== UBICACIÓN ==================== -->
          <section class="space-y-6">
            <div class="pb-4 border-b border-default">
              <h2 class="text-xl font-semibold">Ubicación</h2>
            </div>

            <UFormField label="Dirección *" required>
              <UInput
                v-model="form.address"
                placeholder="Ej: Av. Santa Fe 1234"
                size="lg"
                icon="i-lucide-map-pin"
              />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Ciudad *" required>
                <UInput v-model="form.city" placeholder="Ej: Buenos Aires" size="lg" />
              </UFormField>

              <UFormField label="Provincia">
                <UInput v-model="form.state" placeholder="Ej: Buenos Aires" size="lg" />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Código Postal">
                <UInput v-model="form.zip_code" placeholder="Ej: 1425" size="lg" />
              </UFormField>

              <UFormField label="País">
                <UInput v-model="form.country" size="lg" />
              </UFormField>
            </div>
          </section>

          <!-- ==================== CARACTERÍSTICAS ==================== -->
          <section class="space-y-6">
            <div class="pb-4 border-b border-default">
              <h2 class="text-xl font-semibold">Características</h2>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <UFormField label="Dormitorios">
                <UInput v-model.number="form.bedrooms" type="number" min="0" size="lg" />
              </UFormField>

              <UFormField label="Baños">
                <UInput v-model.number="form.bathrooms" type="number" min="0" size="lg" />
              </UFormField>

              <UFormField label="Cocheras">
                <UInput v-model.number="form.parking_spaces" type="number" min="0" size="lg" />
              </UFormField>

              <UFormField label="Año construcción">
                <UInput 
                  v-model.number="form.year_built" 
                  type="number" 
                  min="1900" 
                  :max="new Date().getFullYear()" 
                  size="lg" 
                  :disabled="isNewProperty"
                  :placeholder="isNewProperty ? 'A estrenar' : ''"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <UFormField label="Sup. total (m²)">
                <UInput v-model.number="form.area_m2" type="number" min="0" size="lg" />
              </UFormField>

              <UFormField label="Sup. cubierta (m²)">
                <UInput v-model.number="form.built_area_m2" type="number" min="0" size="lg" />
              </UFormField>

              <UFormField label="Sup. semi cubierta (m²)">
                <UInput v-model.number="form.semi_covered_area_m2" type="number" min="0" size="lg" />
              </UFormField>

              <UFormField label="Sup. terreno (m²)">
                <UInput v-model.number="form.land_area_m2" type="number" min="0" size="lg" />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <UFormField label="Piso">
                <UInput v-model.number="form.floor_number" type="number" min="0" size="lg" />
              </UFormField>
            </div>
          </section>


          <!-- ==================== IMÁGENES ==================== -->
          <section class="space-y-6">
            <div class="pb-4 border-b border-default">
              <h2 class="text-xl font-semibold">Imágenes</h2>
            </div>

            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                @change="handleImageUpload"
                class="hidden"
                id="image-upload"
              />
              <label
                for="image-upload"
                class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-default rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <UIcon name="i-lucide-upload" class="size-12 mb-3 text-muted" />
                <p class="text-sm font-medium mb-1">Hacer click para subir imágenes</p>
                <p class="text-xs text-muted">PNG, JPG hasta 10MB</p>
              </label>
            </div>

            <!-- Image Previews -->
            <div v-if="imagePreviews.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(preview, index) in imagePreviews"
                :key="index"
                class="relative aspect-square rounded-lg overflow-hidden group"
              >
                <img :src="preview" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="removeImage(index)"
                  class="absolute top-2 right-2 p-1.5 bg-error rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <UIcon name="i-lucide-trash-2" class="size-4 text-white" />
                </button>
              </div>
            </div>

            <!-- Video & Tour Virtual -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Video URL">
                <UInput
                  v-model="form.video_url"
                  placeholder="https://youtube.com/watch?v=..."
                  size="lg"
                  icon="i-lucide-video"
                />
              </UFormField>

              <UFormField label="Tour Virtual URL">
                <UInput
                  v-model="form.virtual_tour_url"
                  placeholder="https://..."
                  size="lg"
                  icon="i-lucide-scan"
                />
              </UFormField>
            </div>
          </section>

          <!-- ==================== AMENITIES ==================== -->
          <section class="space-y-6">
            <div class="pb-4 border-b border-default">
              <h2 class="text-xl font-semibold">Amenities</h2>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                v-for="amenity in COMMON_AMENITIES"
                :key="amenity"
                type="button"
                @click="toggleAmenity(amenity)"
                class="p-3 rounded-lg border transition-all text-left"
                :class="form.amenities?.includes(amenity) 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-default hover:border-primary/50'"
              >
                <span class="text-sm">{{ amenity }}</span>
              </button>
            </div>
          </section>

          <!-- ==================== BOTÓN ENVIAR ==================== -->
          <div class="pt-6 border-t border-default">
            <div class="flex items-center justify-between">
              <UButton
                variant="ghost"
                icon="i-lucide-arrow-left"
                to="/admin/propiedades"
              >
                Cancelar
              </UButton>

              <UButton
                type="submit"
                size="lg"
                :loading="loading"
                :disabled="!isFormValid"
                icon="i-lucide-check"
              >
                Publicar Propiedad
              </UButton>
            </div>
          </div>

        </form>
      </div>
    </template>
  </UDashboardPanel>
</template>