<script setup lang="ts">
definePageMeta({
  layout: 'inquilino'
})

const { isNotificationsSlideoverOpen } = useDashboard()

// Property info
const property = ref({
  address: 'Av. Libertador 1234, Piso 5 Depto A',
  city: 'Buenos Aires',
  type: 'Departamento 3 ambientes',
  image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'
})

// Contract info
const contract = ref({
  startDate: '01/03/2024',
  endDate: '01/03/2026',
  monthlyRent: '$185,000',
  daysRemaining: 456
})

// Next payment
const nextPayment = ref({
  amount: '$185,000',
  dueDate: '01/01/2025',
  daysUntilDue: 18,
  status: 'Pendiente'
})

// Recent requests
const requests = ref([
  { id: 1, type: 'Mantenimiento', description: 'Pérdida de agua en baño', status: 'En proceso', date: '10/12/2024' },
  { id: 2, type: 'Consulta', description: 'Certificado de domicilio', status: 'Completado', date: '05/12/2024' }
])
</script>

<template>
  <UDashboardPanel id="inquilino-home">
    <template #header>
      <UDashboardNavbar title="Mi Portal" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notificaciones" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Property Card -->
        <UCard class="overflow-hidden">
          <div class="flex flex-col md:flex-row gap-6">
            <div class="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-muted">
              <img 
                :src="property.image" 
                :alt="property.address"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-bold">Mi Propiedad</h2>
              <p class="text-lg mt-1">{{ property.address }}</p>
              <p class="text-muted">{{ property.city }}</p>
              <UBadge variant="soft" class="mt-2">{{ property.type }}</UBadge>
            </div>
          </div>
        </UCard>

        <!-- Quick Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Contract Status -->
          <UCard>
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-full bg-primary/10">
                <UIcon name="i-lucide-file-text" class="size-6 text-primary" />
              </div>
              <div>
                <p class="text-sm text-muted">Contrato</p>
                <p class="font-bold">{{ contract.startDate }} - {{ contract.endDate }}</p>
                <p class="text-xs text-muted">{{ contract.daysRemaining }} días restantes</p>
              </div>
            </div>
          </UCard>

          <!-- Monthly Rent -->
          <UCard>
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-full bg-success/10">
                <UIcon name="i-lucide-dollar-sign" class="size-6 text-success" />
              </div>
              <div>
                <p class="text-sm text-muted">Alquiler Mensual</p>
                <p class="font-bold text-xl">{{ contract.monthlyRent }}</p>
              </div>
            </div>
          </UCard>

          <!-- Next Payment -->
          <UCard 
            :class="nextPayment.daysUntilDue <= 5 ? 'ring-2 ring-warning' : ''"
          >
            <div class="flex items-center gap-4">
              <div 
                class="p-3 rounded-full"
                :class="nextPayment.daysUntilDue <= 5 ? 'bg-warning/10' : 'bg-primary/10'"
              >
                <UIcon 
                  name="i-lucide-calendar" 
                  class="size-6" 
                  :class="nextPayment.daysUntilDue <= 5 ? 'text-warning' : 'text-primary'"
                />
              </div>
              <div>
                <p class="text-sm text-muted">Próximo Pago</p>
                <p class="font-bold">{{ nextPayment.amount }}</p>
                <p class="text-xs text-muted">Vence: {{ nextPayment.dueDate }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Actions & Requests -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Quick Actions -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Acciones Rápidas</h3>
            </template>
            <div class="grid grid-cols-2 gap-3">
              <UButton variant="soft" class="justify-start h-auto py-4 flex-col gap-2" to="/inquilino/pagos">
                <UIcon name="i-lucide-credit-card" class="size-6" />
                <span>Pagar Ahora</span>
              </UButton>
              <UButton variant="soft" class="justify-start h-auto py-4 flex-col gap-2" to="/inquilino/mantenimiento">
                <UIcon name="i-lucide-wrench" class="size-6" />
                <span>Reportar Problema</span>
              </UButton>
              <UButton variant="soft" class="justify-start h-auto py-4 flex-col gap-2" to="/inquilino/contrato">
                <UIcon name="i-lucide-file-text" class="size-6" />
                <span>Ver Contrato</span>
              </UButton>
              <UButton variant="soft" class="justify-start h-auto py-4 flex-col gap-2" to="/inquilino/documentos">
                <UIcon name="i-lucide-download" class="size-6" />
                <span>Documentos</span>
              </UButton>
            </div>
          </UCard>

          <!-- Recent Requests -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">Mis Solicitudes</h3>
                <UButton variant="ghost" size="sm" to="/inquilino/mantenimiento">Ver todas</UButton>
              </div>
            </template>
            <div class="divide-y divide-default">
              <div 
                v-for="request in requests" 
                :key="request.id"
                class="py-3 flex items-center justify-between"
              >
                <div>
                  <p class="font-medium text-sm">{{ request.type }}</p>
                  <p class="text-sm text-muted">{{ request.description }}</p>
                </div>
                <div class="text-right">
                  <UBadge 
                    :color="request.status === 'Completado' ? 'success' : 'warning'"
                    variant="soft"
                    size="sm"
                  >
                    {{ request.status }}
                  </UBadge>
                  <p class="text-xs text-muted mt-1">{{ request.date }}</p>
                </div>
              </div>

              <div v-if="requests.length === 0" class="py-6 text-center text-muted">
                No tienes solicitudes recientes
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
