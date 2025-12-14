<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <UCard class="max-w-md w-full">
      <template #header>
        <h1 class="text-3xl font-bold text-center">Bienvenido</h1>
      </template>

      <div class="space-y-4">
        <p class="text-center text-gray-600 dark:text-gray-400">
          Sistema de Gestión de Propiedades
        </p>

        <UButton
          to="/login"
          size="lg"
          block
          color="primary"
        >
          Iniciar Sesión
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>
