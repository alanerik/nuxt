<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <UCard class="max-w-md w-full">
      <!-- Estado de Error -->
      <div v-if="state === 'error'" class="space-y-4">
        <UAlert
          icon="i-lucide-alert-circle"
          color="red"
          variant="soft"
          :title="errorTitle"
          :description="errorMessage"
        />
        
        <!-- Acciones según tipo de error -->
        <div class="flex flex-col gap-2">
          <!-- Botón reenviar email (si el token expiró) -->
          <UButton
            v-if="errorType === 'expired'"
            color="primary"
            block
            icon="i-lucide-mail"
            :loading="isResending"
            @click="resendConfirmationEmail"
          >
            Reenviar correo de confirmación
          </UButton>

          <!-- Botón volver a intentar (otros errores) -->
          <UButton
            v-else
            color="gray"
            block
            icon="i-lucide-rotate-cw"
            @click="retry"
          >
            Volver a intentar
          </UButton>

          <!-- Siempre mostrar botón para ir a login -->
          <UButton
            color="gray"
            variant="ghost"
            block
            icon="i-lucide-log-in"
            @click="goToLogin"
          >
            Ir al inicio de sesión
          </UButton>
        </div>

        <!-- Countdown automático (opcional, se puede cancelar) -->
        <div v-if="autoRedirect && countdown > 0" class="flex items-center justify-center gap-2 text-sm text-gray-500">
          <UIcon name="i-lucide-timer" class="animate-pulse" />
          <span>Redirigiendo automáticamente en {{ countdown }}s</span>
          <UButton
            size="xs"
            color="gray"
            variant="ghost"
            @click="cancelAutoRedirect"
          >
            Cancelar
          </UButton>
        </div>
      </div>

      <!-- Estado de Éxito -->
      <div v-else-if="state === 'success'" class="space-y-4">
        <UAlert
          icon="i-lucide-check-circle"
          color="green"
          variant="soft"
          title="¡Verificación Exitosa!"
          description="Redirigiendo a tu dashboard..."
        />
        
        <div class="flex justify-center">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary-500 animate-spin" />
        </div>
      </div>

      <!-- Email reenviado -->
      <div v-else-if="state === 'resent'" class="space-y-4">
        <UAlert
          icon="i-lucide-mail-check"
          color="blue"
          variant="soft"
          title="Correo Reenviado"
          description="Revisa tu bandeja de entrada y haz clic en el nuevo enlace de confirmación."
        />
        
        <UButton
          color="gray"
          block
          icon="i-lucide-log-in"
          @click="goToLogin"
        >
          Volver al inicio
        </UButton>
      </div>

      <!-- Estado de Carga -->
      <div v-else class="text-center space-y-4">
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        </div>
        <div>
          <h2 class="text-xl font-semibold">Verificando sesión</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-2">Un momento por favor...</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

// Composables
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()
const toast = useToast()

// Estado reactivo
type PageState = 'loading' | 'success' | 'error' | 'resent'
type ErrorType = 'expired' | 'network' | 'profile' | 'timeout' | 'generic'

const state = ref<PageState>('loading')
const errorMessage = ref('')
const errorTitle = ref('Error de Verificación')
const errorType = ref<ErrorType>('generic')
const countdown = ref(5)
const autoRedirect = ref(false)
const isResending = ref(false)

// Timer para countdown
let countdownInterval: NodeJS.Timeout | null = null
let redirectTimeout: NodeJS.Timeout | null = null

// Limpiar timers
const clearTimers = () => {
  if (countdownInterval) clearInterval(countdownInterval)
  if (redirectTimeout) clearTimeout(redirectTimeout)
  countdownInterval = null
  redirectTimeout = null
}

// Cancelar redirección automática
const cancelAutoRedirect = () => {
  clearTimers()
  autoRedirect.value = false
  countdown.value = 0
}

// Redirigir con countdown opcional
const redirectWithCountdown = async (path: string, delay = 5000, auto = true) => {
  autoRedirect.value = auto
  countdown.value = Math.ceil(delay / 1000)
  
  if (auto) {
    countdownInterval = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && countdownInterval) {
        clearInterval(countdownInterval)
      }
    }, 1000)

    redirectTimeout = setTimeout(async () => {
      await router.push(path)
    }, delay)
  }
}

// Ir a login manualmente
const goToLogin = async () => {
  clearTimers()
  await supabase.auth.signOut()
  await router.push('/login')
}

// Reintentar verificación
const retry = async () => {
  clearTimers()
  state.value = 'loading'
  errorMessage.value = ''
  await handleRedirect()
}

// Reenviar email de confirmación
const resendConfirmationEmail = async () => {
  if (!user.value?.email) {
    toast.add({
      title: 'Error',
      description: 'No se encontró el email del usuario',
      color: 'red'
    })
    return
  }

  isResending.value = true

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.value.email
    })

    if (error) throw error

    state.value = 'resent'
    
    toast.add({
      title: 'Correo enviado',
      description: 'Revisa tu bandeja de entrada',
      color: 'green'
    })
  } catch (err: any) {
    console.error('Error reenviando email:', err)
    
    toast.add({
      title: 'Error al reenviar',
      description: err.message || 'No se pudo reenviar el correo',
      color: 'red'
    })
  } finally {
    isResending.value = false
  }
}

// Determinar tipo de error y mensaje apropiado
const categorizeError = (error: any): { type: ErrorType; title: string; message: string } => {
  const errorMsg = error?.message || error?.toString() || ''

  // Token expirado
  if (errorMsg.includes('expired') || errorMsg.includes('invalid') || errorMsg.includes('token')) {
    return {
      type: 'expired',
      title: 'Enlace Expirado',
      message: 'El enlace de confirmación ha expirado. Puedes solicitar uno nuevo.'
    }
  }

  // Error de red
  if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
    return {
      type: 'network',
      title: 'Error de Conexión',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
    }
  }

  // Error de perfil
  if (errorMsg.includes('profile') || errorMsg.includes('role')) {
    return {
      type: 'profile',
      title: 'Error de Perfil',
      message: 'No se pudo cargar tu perfil de usuario. Contacta con soporte.'
    }
  }

  // Timeout
  if (errorMsg.includes('timeout') || errorMsg.includes('agotado')) {
    return {
      type: 'timeout',
      title: 'Tiempo Agotado',
      message: 'La verificación tomó demasiado tiempo. Por favor, intenta nuevamente.'
    }
  }

  // Genérico
  return {
    type: 'generic',
    title: 'Error de Verificación',
    message: errorMsg || 'Ocurrió un error al verificar tu cuenta. Por favor, intenta nuevamente.'
  }
}

// Manejar error
const handleError = async (error: Error | string, autoRedirectToLogin = true) => {
  console.error('Error en confirmación:', error)
  
  const categorized = categorizeError(error)
  
  state.value = 'error'
  errorType.value = categorized.type
  errorTitle.value = categorized.title
  errorMessage.value = categorized.message
  
  // Solo auto-redirigir en errores no recuperables
  if (autoRedirectToLogin && categorized.type !== 'expired') {
    await supabase.auth.signOut()
    await redirectWithCountdown('/login', 5000, true)
  } else {
    // Para errores recuperables, no auto-redirigir
    autoRedirect.value = false
  }
}

// Procesar redirección
const handleRedirect = async () => {
  if (!user.value) {
    await handleError('No se encontró usuario autenticado')
    return
  }

  try {
    // Obtener perfil con role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .single()

    if (profileError) throw profileError

    if (!profile?.role) {
      throw new Error('No se encontró el rol del usuario')
    }

    // Éxito - redirigir al dashboard
    state.value = 'success'
    const dashboardPath = `/${profile.role}/dashboard`
    
    // Redirección más rápida en éxito
    await redirectWithCountdown(dashboardPath, 1500, true)
    
  } catch (err) {
    await handleError(err as Error, true)
  }
}

// Watch para cambios en usuario
watch(user, (newUser) => {
  if (newUser && state.value === 'loading') {
    handleRedirect()
  }
}, { immediate: true })

// Timeout de seguridad
onMounted(() => {
  const safetyTimeout = setTimeout(async () => {
    if (state.value === 'loading') {
      await handleError('Tiempo de espera agotado. Por favor, intenta nuevamente.', false)
    }
  }, 10000) // 10 segundos

  onBeforeUnmount(() => {
    clearTimeout(safetyTimeout)
    clearTimers()
  })
})

// Limpiar timers al desmontar
onBeforeUnmount(() => {
  clearTimers()
})
</script>