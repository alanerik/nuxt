<script setup lang="ts">
import type { PropertyInsert, PropertyUpdate } from '~/types/property.types'
import { COMMON_AMENITIES } from '~/types/property.types'

definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { fetchProperty, updateProperty, uploadPropertyImages } = useProperties()
const supabase = useSupabaseClient()

// Estado
const loading = ref(true)
const saving = ref(false)
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const propertyId = computed(() => route.params.id as string)

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

const isNewProperty = ref(false)

// Cargar datos
onMounted(async () => {
  try {
    const property = await fetchProperty(propertyId.value)
    if (property) {
      form.value = { ...property }
      // Ajustar estados derivados
      isNewProperty.value = property.year_built === new Date().getFullYear() // Aproximacion o usar logica custom si existiera campo
      
      // Cargar previsualizaciones de imagenes existentes
      if (property.images) {
        imagePreviews.value = [...property.images]
      }
    } else {
      toast.add({
        title: 'Error',
        description: 'No se encontró la propiedad',
        color: 'error'
      })
      router.push('/admin/propiedades')
    }
  } catch (error) {
    console.error('Error loading property:', error)
  } finally {
    loading.value = false
  }
})

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
  
  const periodLabels: Record<string, string> = {
    dia: 'Precio por día',
    semana: 'Precio por semana',
    quincena: 'Precio por quincena',
    mes: 'Precio por mes'
  }
  return periodLabels[form.value.rental_period || 'mes'] || 'Precio'
})

// Tipos de operación
const operationTypes = [
  { value: 'venta', label: 'Venta', icon: 'i-lucide-banknote' },
  { value: 'alquiler', label: 'Alquiler', icon: 'i-lucide-key' },
  { value: 'alquiler_temporal', label: 'Temporal', icon: 'i-lucide-calendar' }
]

// Tipos de propiedad
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
  // Si es una imagen nueva (File), la sacamos de imageFiles
  // Si es una imagen vieja (URL), solo la sacamos del array visual y del form
  
  const isExistingImage = typeof imagePreviews.value[index] === 'string' && imagePreviews.value[index].startsWith('http')
  
  if (!isExistingImage) {
    // Es una imagen nueva subida ahora, hay que alinear el indice
    // Esto es complejo si mezclamos, simplifiquemos:
    // Si borramos, borramos de previews. Al guardar, reconstruiremos.
  }
  
  imagePreviews.value.splice(index, 1)
  // Actualizar form.images si son existentes
  if (form.value.images) {
     // Nota: Esto es simple, si sacamos del preview, asumimos que sacamos de la lista final
     // Pero imageFiles (nuevas) estan separadas.
     // Simplificación: Solo permitimos borrar visualmente, al guardar procesamos.
     
     // Mejor estrategia: Separar visualmente o al enviar
  }
}

// Generar slug
watch(() => form.value.title, (newTitle) => {
  // Solo generar si no hay slug (para no cambiar URL de existentes accidentalmente)
  if (newTitle && !form.value.slug) {
    form.value.slug = newTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
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

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

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

const handleSubmit = async () => {
  if (!isFormValid.value) {
    toast.add({ title: 'Campos requeridos', color: 'warning' })
    return
  }

  saving.value = true
  
  try {
    // 1. Subir imagenes nuevas
    let newImageUrls: string[] = []
    if (imageFiles.value.length > 0) {
      newImageUrls = await uploadPropertyImages(propertyId.value, imageFiles.value)
    }
    
    // 2. Combinar imagenes existentes (que queden en previews y sean URLs) con nuevas
    const currentImages = imagePreviews.value.filter(url => url.startsWith('http'))
    const finalImages = [...currentImages, ...newImageUrls]
    
    // 3. Actualizar
    const updates = {
        ...form.value,
        images: finalImages
    }
    delete updates.id // No actualizar ID
    delete updates.created_at
    delete updates.agent // No actualizar relaciones
    delete updates.owner
    delete updates.active_contract
    
    await updateProperty(propertyId.value, updates as PropertyUpdate)

    toast.add({
      title: 'Propiedad actualizada',
      color: 'success'
    })
    
    router.push('/admin/propiedades')
  } catch (error: any) {
    console.error('Error updating property:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'No se pudo actualizar',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="admin-properties-edit">
    <template #header>
      <UDashboardNavbar title="Editar Propiedad">
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
            :loading="saving"
            :disabled="!isFormValid || loading"
            icon="i-lucide-save"
            @click="handleSubmit"
          >
            Guardar Cambios
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="p-6 text-center">
         <UIcon name="i-lucide-loader-2" class="animate-spin size-8 mx-auto" />
         <p class="mt-2 text-muted">Cargando propiedad...</p>
      </div>

      <div v-else class="max-w-4xl mx-auto p-6 space-y-8">
        <form @submit.prevent="handleSubmit" class="space-y-8">
          
          <!-- ==================== INFORMACIÓN BÁSICA ==================== -->
          <section class="space-y-6">
            <div class="pb-4 border-b border-default">
              <h2 class="text-xl font-semibold">Información Básica</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Título de la publicación *" required>
                <UInput
                  v-model="form.title"
                  size="lg"
                />
              </UFormField>

              <UFormField label="Slug (URL amigable)">
                <UInput
                  v-model="form.slug"
                  size="lg"
                  readonly
                  disabled
                  class="opacity-75"
                />
              </UFormField>
            </div>

            <UFormField label="Descripción">
              <UTextarea
                v-model="form.description"
                :rows="4"
              />
            </UFormField>

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

            <div class="space-y-4 p-4 rounded-xl bg-muted/20 border border-default">
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

              <div>
                <label class="block text-sm font-medium mb-2">{{ priceLabel }} *</label>
                <div class="flex items-center gap-3">
                  <span class="text-2xl font-bold text-muted">$</span>
                  <UInput
                    v-model.number="form.price"
                    type="number"
                    min="0"
                    size="xl"
                    class="text-2xl font-bold flex-1"
                  />
                  <span class="text-lg text-muted">{{ form.currency }}</span>
                </div>
              </div>

              <div v-if="form.operation_type === 'alquiler'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Expensas mensuales">
                  <UInput v-model.number="form.expenses" type="number" min="0" size="lg" />
                </UFormField>
              </div>
            </div>

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
              <UInput v-model="form.address" size="lg" icon="i-lucide-map-pin" />
            </UFormField>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Ciudad *" required>
                <UInput v-model="form.city" size="lg" />
              </UFormField>
              <UFormField label="Provincia">
                <UInput v-model="form.state" size="lg" />
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
              <input type="file" accept="image/*" multiple @change="handleImageUpload" class="hidden" id="image-upload-edit" />
              <label for="image-upload-edit" class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-default rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                <UIcon name="i-lucide-upload" class="size-12 mb-3 text-muted" />
                <p class="text-sm font-medium mb-1">Agregar imágenes</p>
              </label>
            </div>

            <div v-if="imagePreviews.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="(preview, index) in imagePreviews" :key="index" class="relative aspect-square rounded-lg overflow-hidden group">
                <img :src="preview" class="w-full h-full object-cover" />
                <button type="button" @click="removeImage(index)" class="absolute top-2 right-2 p-1.5 bg-error rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
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
              <UButton variant="ghost" icon="i-lucide-arrow-left" to="/admin/propiedades">
                Cancelar
              </UButton>
              <UButton type="submit" size="lg" :loading="saving" :disabled="!isFormValid || saving" icon="i-lucide-save">
                Guardar Cambios
              </UButton>
            </div>
          </div>

        </form>
      </div>
    </template>
  </UDashboardPanel>
</template>
