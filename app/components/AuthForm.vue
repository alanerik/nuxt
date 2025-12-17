<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  role: 'admin' | 'inquilino' | 'agente'
}>()

const { signIn, signUp, socialLogin, loading, error } = useAuth()
const url = useRequestURL()

const isLogin = ref(true)
const success = ref<string | null>(null)

const form = ref({
  email: '',
  password: '',
  full_name: '',
  confirm_password: ''
})

const config = {
  admin: { title: 'Panel de Administrador', redirect: '/admin/dashboard' },
  inquilino: { title: 'Portal de Inquilino', redirect: '/inquilino/dashboard' },
  agente: { title: 'Portal de Agente', redirect: '/agente/dashboard' }
}

const currentConfig = config[props.role]

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = null
  success.value = null
}

const handleSubmit = async () => {
  success.value = null
  
  if (isLogin.value) {
    await signIn(
      form.value.email, 
      form.value.password, 
      props.role, 
      currentConfig.redirect
    )
  } else {
    // Validación UI
    if (form.value.password !== form.value.confirm_password) {
      error.value = 'Las contraseñas no coinciden'
      return
    }
    
    if (form.value.password.length < 6) {
      error.value = 'La contraseña debe tener al menos 6 caracteres'
      return
    }
    
    const registered = await signUp(
      form.value.email, 
      form.value.password, 
      form.value.full_name, 
      props.role,
      url.origin
    )
    
    if (registered) {
      success.value = 'Cuenta creada. Revisa tu email para confirmar.'
      isLogin.value = true
    }
  }
}

const handleSocialLogin = async (provider: 'google') => {
  await socialLogin(provider, `${url.origin}${currentConfig.redirect}`)
}
</script>

<template>
  <div class="w-full max-w-md mx-auto p-6">
    <UCard>
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-bold">
            {{ isLogin ? 'Iniciar Sesión' : 'Registrarse' }}
          </h2>
          <p class="text-gray-500 mt-2">{{ currentConfig.title }}</p>
        </div>
      </template>

      <UForm :state="form" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Email" name="email" required>
          <UInput
            v-model="form.email"
            type="email"
            placeholder="tu@email.com"
            icon="i-lucide-mail"
          />
        </UFormField>

        <UFormField v-if="!isLogin" label="Nombre completo" name="full_name" required>
          <UInput
            v-model="form.full_name"
            type="text"
            placeholder="Juan Pérez"
            icon="i-lucide-user"
          />
        </UFormField>

        <UFormField label="Contraseña" name="password" required>
          <UInput
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
          />
        </UFormField>

        <UFormField v-if="!isLogin" label="Confirmar contraseña" name="confirm_password" required>
          <UInput
            v-model="form.confirm_password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
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

        <UAlert
          v-if="success"
          color="success"
          variant="soft"
          :title="success"
        />

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="loading"
        >
          {{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}
        </UButton>

        <div class="text-center">
          <UButton
            variant="link"
            @click="toggleMode"
            :disabled="loading"
          >
            {{ isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión' }}
          </UButton>
        </div>

        <USeparator label="O" />

        <UButton
          block
          color="neutral"
          variant="outline"
          @click="handleSocialLogin('google')"
          :disabled="loading"
        >
          <template #leading>
            <UIcon name="i-simple-icons-google" class="size-5" />
          </template>
          Continuar con Google
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>