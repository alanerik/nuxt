<script setup lang="ts">
const supabase = useSupabaseClient()
const colorMode = useColorMode()
const toast = useToast()

const changingPassword = ref(false)
const passwordForm = ref({
  new_password: '',
  confirm_password: ''
})

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
    toast.add({
      title: 'Tema actualizado',
      description: `Modo ${value ? 'oscuro' : 'claro'} activado`,
      color: 'success'
    })
  }
})

const passwordStrength = computed(() => {
  const pwd = passwordForm.value.new_password
  if (!pwd) return 0
  
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 8) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  
  return Math.min(score, 4)
})

const strengthText = computed(() => {
  const texts = ['Muy Débil', 'Débil', 'Media', 'Fuerte', 'Muy Fuerte']
  return texts[passwordStrength.value] || 'Muy Débil'
})

const strengthColor = computed(() => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500'
  ]
  return colors[passwordStrength.value] || colors[0]
})

const handlePasswordChange = async () => {
  if (!passwordForm.value.new_password) {
    toast.add({
      title: 'Error',
      description: 'Ingresa una nueva contraseña',
      color: 'error'
    })
    return
  }

  if (passwordForm.value.new_password.length < 6) {
    toast.add({
      title: 'Error',
      description: 'La contraseña debe tener al menos 6 caracteres',
      color: 'error'
    })
    return
  }

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    toast.add({
      title: 'Error',
      description: 'Las contraseñas no coinciden',
      color: 'error'
    })
    return
  }

  if (passwordStrength.value < 2) {
    toast.add({
      title: 'Error',
      description: 'Elige una contraseña más segura',
      color: 'error'
    })
    return
  }

  changingPassword.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.value.new_password
    })

    if (error) {
      if (error.message.includes('same as the old password')) {
        throw new Error('La nueva contraseña debe ser diferente a la anterior')
      }
      throw error
    }

    toast.add({
      title: 'Contraseña actualizada',
      description: 'Tu contraseña se cambió correctamente',
      color: 'success'
    })

    passwordForm.value = {
      new_password: '',
      confirm_password: ''
    }
  } catch (err: Error | unknown) {
    toast.add({
      title: 'Error',
      description: err.message || 'No se pudo cambiar la contraseña',
      color: 'error'
    })
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel>
      <UDashboardNavbar title="Configuración">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/admin/dashboard"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardPanelContent class="p-6">
        <div class="max-w-2xl space-y-6">
          <!-- Apariencia -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-lg">Apariencia</h3>
            </template>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">Tema</p>
                  <p class="text-sm text-gray-500">
                    {{ isDark ? 'Modo oscuro activado' : 'Modo claro activado' }}
                  </p>
                </div>
                <UToggle v-model="isDark" />
              </div>
            </div>
          </UCard>

          <!-- Seguridad -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-lg">Seguridad</h3>
            </template>

            <UForm :state="passwordForm" @submit="handlePasswordChange" class="space-y-4">
              <UFormField label="Nueva Contraseña" name="new_password">
                <UInput
                  v-model="passwordForm.new_password"
                  type="password"
                  placeholder="••••••••"
                  icon="i-lucide-lock"
                  :disabled="changingPassword"
                />
                <template #help>
                  <p class="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </template>
              </UFormField>

              <UFormField label="Confirmar Contraseña" name="confirm_password">
                <UInput
                  v-model="passwordForm.confirm_password"
                  type="password"
                  placeholder="••••••••"
                  icon="i-lucide-lock"
                  :disabled="changingPassword"
                />
              </UFormField>

              <!-- Indicador de fortaleza -->
              <div v-if="passwordForm.new_password" class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-500">Fortaleza:</span>
                  <span :class="strengthColor.replace('bg-', 'text-')">
                    {{ strengthText }}
                  </span>
                </div>
                <div class="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full transition-all duration-300"
                    :class="strengthColor"
                    :style="{ width: `${passwordStrength * 25}%` }"
                  />
                </div>
              </div>

              <div class="flex gap-2">
                <UButton
                  type="submit"
                  :loading="changingPassword"
                  :disabled="changingPassword || passwordStrength < 2"
                >
                  Cambiar Contraseña
                </UButton>

                <UButton
                  color="neutral"
                  variant="ghost"
                  :disabled="changingPassword"
                  @click="passwordForm = { new_password: '', confirm_password: '' }"
                >
                  Cancelar
                </UButton>
              </div>
            </UForm>
          </UCard>
        </div>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>