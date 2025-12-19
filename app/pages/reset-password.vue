<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <UCard class="max-w-md w-full">
      <template #header>
        <div class="text-center">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-key-round" class="w-8 h-8 text-primary-500" />
          </div>
          <h2 class="text-2xl font-bold">Recuperar Contraseña</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-2">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>
      </template>

      <!-- Estado de Éxito -->
      <div v-if="state === 'success'" class="space-y-4">
        <UAlert
          icon="i-lucide-mail-check"
          color="success"
          variant="soft"
          title="¡Correo Enviado!"
          description="Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña."
        />

        <div class="text-center space-y-2">
          <p class="text-sm text-gray-500">
            ¿No recibiste el correo?
          </p>
          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              block
              :disabled="cooldown > 0"
              @click="handleResend"
            >
              <template v-if="cooldown > 0">
                Reenviar en {{ cooldown }}s
              </template>
              <template v-else>
                Reenviar correo
              </template>
            </UButton>
          </div>
        </div>

        <UDivider label="O" />

        <UButton
          color="neutral"
          variant="outline"
          block
          icon="i-lucide-arrow-left"
          to="/login"
        >
          Volver al inicio de sesión
        </UButton>
      </div>

      <!-- Formulario -->
      <UForm v-else :state="form" @submit="handleSubmit" class="space-y-4">
        <UFormField 
          label="Email" 
          name="email" 
          required
          :error="emailError"
        >
          <UInput
            v-model="form.email"
            type="email"
            placeholder="tu@email.com"
            icon="i-lucide-mail"
            :disabled="loading"
            @input="emailError = null"
          />
        </UFormField>

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
          :disabled="loading"
        >
          Enviar Enlace de Recuperación
        </UButton>

        <UButton
          color="neutral"
          variant="link"
          block
          icon="i-lucide-arrow-left"
          to="/login"
          :disabled="loading"
        >
          Volver al inicio de sesión
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
const toast = useToast()
const url = useRequestURL()

type PageState = 'form' | 'success'

const state = ref<PageState>('form')
const loading = ref(false)
const error = ref<string | null>(null)
const emailError = ref<string | null>(null)
const cooldown = ref(0)

const form = ref({
  email: ''
})

let cooldownInterval: NodeJS.Timeout | null = null

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const startCooldown = (seconds: number) => {
  cooldown.value = seconds
  
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
  
  cooldownInterval = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

const sendResetEmail = async (email: string) => {
  const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${url.origin}/update-password`
  })

  if (err) {
    if (err.message.includes('rate limit')) {
      throw new Error('Demasiados intentos. Por favor espera unos minutos.')
    }
    if (err.message.includes('not found')) {
      throw new Error('No existe una cuenta con este email')
    }
    throw new Error(err.message || 'Error al enviar el correo')
  }
}

const handleSubmit = async () => {
  error.value = null
  emailError.value = null

  if (!form.value.email.trim()) {
    emailError.value = 'El email es obligatorio'
    return
  }

  if (!isValidEmail(form.value.email)) {
    emailError.value = 'Ingresa un email válido'
    return
  }

  loading.value = true

  try {
    await sendResetEmail(form.value.email)
    
    state.value = 'success'
    startCooldown(60)
    
    toast.add({
      title: 'Correo enviado',
      description: 'Revisa tu bandeja de entrada',
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

const handleResend = async () => {
  if (cooldown.value > 0) return
  
  loading.value = true
  error.value = null

  try {
    await sendResetEmail(form.value.email)
    
    startCooldown(60)
    
    toast.add({
      title: 'Correo reenviado',
      description: 'Revisa tu bandeja de entrada',
      color: 'success'
    })
  } catch (e: any) {
    error.value = e.message
    
    toast.add({
      title: 'Error al reenviar',
      description: e.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>