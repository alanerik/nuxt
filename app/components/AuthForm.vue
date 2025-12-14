<!-- components/AuthForm.vue -->
<template>
  <div class="w-full max-w-md mx-auto p-6">
    <UCard>
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-bold">{{ isLogin ? 'Iniciar Sesión' : 'Registrarse' }}</h2>
          <p class="text-gray-500 mt-2">{{ roleTitle }}</p>
        </div>
      </template>

      <UForm :state="form" @submit="handleSubmit" class="space-y-4">
        <!-- Email -->
        <UFormField label="Email" name="email" required>
          <UInput
            v-model="form.email"
            type="email"
            placeholder="tu@email.com"
            icon="i-lucide-mail"
          />
        </UFormField>

        <!-- Nombre completo (solo en registro) -->
        <UFormField v-if="!isLogin" label="Nombre completo" name="full_name" required>
          <UInput
            v-model="form.full_name"
            type="text"
            placeholder="Juan Pérez"
            icon="i-lucide-user"
          />
        </UFormField>

        <!-- Contraseña -->
        <UFormField label="Contraseña" name="password" required>
          <UInput
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
          />
        </UFormField>

        <!-- Confirmar contraseña (solo en registro) -->
        <UFormField v-if="!isLogin" label="Confirmar contraseña" name="confirm_password" required>
          <UInput
            v-model="form.confirm_password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
          />
        </UFormField>

        <!-- Error message -->
        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
          :close-button="{ icon: 'i-lucide-x', color: 'red', variant: 'link' }"
          @close="error = null"
        />

        <!-- Success message -->
        <UAlert
          v-if="success"
          color="green"
          variant="soft"
          :title="success"
        />

        <!-- Submit button -->
        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="loading"
        >
          {{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}
        </UButton>

        <!-- Toggle login/register -->
        <div class="text-center">
          <UButton
            variant="link"
            @click="toggleMode"
            :disabled="loading"
          >
            {{ isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión' }}
          </UButton>
        </div>

        <!-- Divider -->
        <USeparator label="O" />

        <!-- Social login -->
        <div class="space-y-2">
          <UButton
            block
            color="gray"
            variant="outline"
            @click="handleSocialLogin('google')"
            :disabled="loading"
          >
            <template #leading>
              <UIcon name="i-simple-icons-google" class="size-5" />
            </template>
            Continuar con Google
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  role: 'admin' | 'inquilino' | 'agente'
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const isLogin = ref(true)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const form = ref({
  email: '',
  password: '',
  full_name: '',
  confirm_password: ''
})

const roleTitle = computed(() => {
  const titles = {
    admin: 'Panel de Administrador',
    inquilino: 'Portal de Inquilino',
    agente: 'Portal de Agente'
  }
  return titles[props.role]
})

const redirectPath = computed(() => {
  const paths = {
    admin: '/admin/dashboard',
    inquilino: '/inquilino/dashboard',
    agente: '/agente/dashboard'
  }
  return paths[props.role]
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = null
  success.value = null
}

const handleSubmit = async () => {
  error.value = null
  success.value = null
  loading.value = true

  try {
    if (isLogin.value) {
      await handleLogin()
    } else {
      await handleRegister()
    }
  } catch (e: any) {
    error.value = e.message || 'Ocurrió un error'
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: form.value.email,
    password: form.value.password
  })

  if (signInError) throw signInError

  if (!data.user?.id) {
    throw new Error('Error al iniciar sesión: No se pudo obtener la información del usuario')
  }

  // Verificar que el usuario tenga el rol correcto
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role !== props.role) {
    await supabase.auth.signOut()
    throw new Error('No tienes permisos para acceder a esta área')
  }

  router.push(redirectPath.value)
}

const handleRegister = async () => {
  // Validaciones
  if (form.value.password !== form.value.confirm_password) {
    throw new Error('Las contraseñas no coinciden')
  }

  if (form.value.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  const { error: signUpError } = await supabase.auth.signUp({
    email: form.value.email,
    password: form.value.password,
    options: {
      data: {
        full_name: form.value.full_name,
        role: 'inquilino' // Siempre registrar como inquilino por defecto
      }
    }
  })

  if (signUpError) throw signUpError

  // El perfil se crea automáticamente via trigger en la base de datos
  success.value = 'Cuenta creada exitosamente. Revisa tu email para confirmar.'
}

const handleSocialLogin = async (provider: 'google') => {
  loading.value = true
  error.value = null

  try {
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${redirectPath.value}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (signInError) throw signInError
  } catch (e: any) {
    error.value = e.message || 'Error al iniciar sesión con Google'
    loading.value = false
  }
}

// Redirect if already logged in
watch(user, (newUser) => {
  if (newUser) {
    router.push(redirectPath.value)
  }
})
</script>