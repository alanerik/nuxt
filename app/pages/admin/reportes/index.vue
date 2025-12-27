<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Reportes" />
    </template>

    <div class="p-6">
      <UCard>
        <div class="text-center py-12">
          <UIcon name="i-lucide-bar-chart-3" class="size-12 mx-auto mb-4 text-muted" />
          <h3 class="text-lg font-semibold">Página en construcción</h3>
          <p class="text-muted">Los reportes estarán disponibles pronto.</p>
        </div>
      </UCard>
    </div>
  </UDashboardPanel>
</template>
