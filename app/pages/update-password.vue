<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <UCard class="max-w-md w-full">
      <template #header>
        <div class="text-center">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-lock" class="w-8 h-8 text-primary-500" />
          </div>
          <h2 class="text-2xl font-bold">Nueva Contraseña</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-2">
            Ingresa tu nueva contraseña
          </p>
        </div>
      </template>

      <!-- Estado de Éxito -->
      <div v-if="state === 'success'" class="space-y-4">
        <UAlert
          icon="i-lucide-check-circle"
          color="success"
          variant="soft"
          title="¡Contraseña Actualizada!"
          description="Tu contraseña ha sido cambiada exitosamente."
        />

        <div class="flex justify-center">
          <div class="text-center space-y-2">
            <p class="text-sm text-gray-500">
              Redirigiendo al inicio de sesión en {{ countdown }}s
            </p>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              @click="goToLogin"
            >
              Ir ahora
            </UButton>
          </div>
        </div>
      </div>

      <!-- Estado de Error (token inválido/expirado) -->
      <div v-else-if="state === 'invalid'" class="space-y-4">
        <UAlert
          icon="i-lucide-alert-circle"
          color="error"
          variant="soft"
          title="Enlace Inválido o Expirado"
          description="Este enlace de recuperación no es válido o ha expirado. Solicita uno nuevo."
        />

        <UButton
          color="primary"
          block
          icon="i-lucide-key-round"
          to="/reset-password"
        >
          Solicitar Nuevo Enlace
        </UButton>

        <UButton
          color="neutral"
          variant="outline"
          block
          icon="i-lucide-arrow-left"
          to="/login"
        >
          Volver al Inicio
        </UButton>
      </div>

      <!-- Formulario -->
      <UForm v-else :state="form" @submit="handleSubmit" class="space-y-4">
        <UFormField 
          label="Nueva Contraseña" 
          name="password" 
          required
          :error="passwordError"
        >
          <UInput
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
            :disabled="loading"
            @input="passwordError = null"
          />
          <template #help>
            <p class="text-xs text-gray-500 mt-1">
              Mínimo 6 caracteres
            </p>
          </template>
        </UFormField>

        <UFormField 
          label="Confirmar Contraseña" 
          name="confirm_password" 
          required
          :error="confirmError"
        >
          <UInput
            v-model="form.confirm_password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
            :disabled="loading"
            @input="confirmError = null"
          />
        </UFormField>

        <!-- Indicador de fortaleza de contraseña -->
        <div v-if="form.password" class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-500">Fortaleza:</span>
            <span :class="strengthColor">{{ strengthText }}</span>
          </div>
          <div class="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-300"
              :class="strengthColor"
              :style="{ width: `${strength * 25}%` }"
            />
          </div>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
          :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
          @close="error = null"
        />

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="loading || strength < 2"
        >
          Actualizar Contraseña
        </UButton>

        <UButton
          color="neutral"
          variant="link"
          block
          icon="i-lucide-arrow-left"
          to="/login"
          :disabled="loading"
        >
          Cancelar
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()
const toast = useToast()

type PageState = 'form' | 'success' | 'invalid'

const state = ref<PageState>('form')
const loading = ref(false)
const error = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const confirmError = ref<string | null>(null)
const countdown = ref(3)

const form = ref({
  password: '',
  confirm_password: ''
})

let countdownInterval: NodeJS.Timeout | null = null

const strength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return 0
  
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 8) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  
  return Math.min(score, 4)
})

const strengthText = computed(() => {
  const texts = ['Muy Débil', 'Débil', 'Media', 'Fuerte', 'Muy Fuerte']
  return texts[strength.value] || 'Muy Débil'
})

const strengthColor = computed(() => {
  const colors = [
    'bg-red-500 text-red-500',
    'bg-orange-500 text-orange-500',
    'bg-yellow-500 text-yellow-500',
    'bg-blue-500 text-blue-500',
    'bg-green-500 text-green-500'
  ]
  return colors[strength.value] || colors[0]
})

const startCountdown = () => {
  countdown.value = 3
  
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownInterval) clearInterval(countdownInterval)
      goToLogin()
    }
  }, 1000)
}

const goToLogin = async () => {
  if (countdownInterval) clearInterval(countdownInterval)
  await router.push('/login')
}

const handleSubmit = async () => {
  error.value = null
  passwordError.value = null
  confirmError.value = null

  if (!form.value.password) {
    passwordError.value = 'La contraseña es obligatoria'
    return
  }

  if (form.value.password.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  if (!form.value.confirm_password) {
    confirmError.value = 'Confirma tu contraseña'
    return
  }

  if (form.value.password !== form.value.confirm_password) {
    confirmError.value = 'Las contraseñas no coinciden'
    return
  }

  if (strength.value < 2) {
    passwordError.value = 'Elige una contraseña más segura'
    return
  }

  loading.value = true

  try {
    const { error: err } = await supabase.auth.updateUser({
      password: form.value.password
    })

    if (err) {
      if (err.message.includes('same as the old password')) {
        throw new Error('La nueva contraseña debe ser diferente a la anterior')
      }
      if (err.message.includes('session not found')) {
        state.value = 'invalid'
        return
      }
      throw new Error(err.message || 'Error al actualizar la contraseña')
    }

    state.value = 'success'
    startCountdown()

    toast.add({
      title: 'Contraseña actualizada',
      description: 'Ya puedes iniciar sesión con tu nueva contraseña',
      color: 'success'
    })
  } catch (e: any) {
    error.value = e.message

    toast.add({
      title: 'Error',
      description: e.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.error) {
    state.value = 'invalid'
  }
})

onBeforeUnmount(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>