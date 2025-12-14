<!-- app/pages/login.vue - Página única de login con selector de rol -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold">Iniciar Sesión</h2>
          <p class="text-gray-500">Selecciona tu tipo de acceso</p>
        </div>
      </template>

      <!-- Selector de Rol -->
      <div v-if="!selectedRole" class="space-y-3">
        <UButton
          block
          size="lg"
          color="red"
          @click="selectedRole = 'admin'"
        >
          <template #leading>
            <UIcon name="i-lucide-shield-check" class="w-5 h-5" />
          </template>
          Administrador
        </UButton>

        <UButton
          block
          size="lg"
          color="blue"
          @click="selectedRole = 'inquilino'"
        >
          <template #leading>
            <UIcon name="i-lucide-home" class="w-5 h-5" />
          </template>
          Inquilino
        </UButton>

        <UButton
          block
          size="lg"
          color="green"
          @click="selectedRole = 'agente'"
        >
          <template #leading>
            <UIcon name="i-lucide-briefcase" class="w-5 h-5" />
          </template>
          Agente
        </UButton>
      </div>

      <!-- Formulario de Auth -->
      <div v-else>
        <div class="flex items-center justify-between mb-6">
          <UButton
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="selectedRole = null"
          >
            Volver
          </UButton>
          <UBadge :color="roleColor" variant="subtle">
            {{ roleTitle }}
          </UBadge>
        </div>

        <AuthForm :role="selectedRole" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const selectedRole = ref<'admin' | 'inquilino' | 'agente' | null>(null)

const roleTitle = computed(() => {
  const titles = {
    admin: 'Administrador',
    inquilino: 'Inquilino',
    agente: 'Agente'
  }
  return selectedRole.value ? titles[selectedRole.value] : ''
})

const roleColor = computed(() => {
  const colors = {
    admin: 'red',
    inquilino: 'blue',
    agente: 'green'
  }
  return selectedRole.value ? colors[selectedRole.value] : 'gray'
})
</script>