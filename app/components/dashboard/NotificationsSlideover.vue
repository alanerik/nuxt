<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard()

// Demo notifications
const notifications = ref([
  {
    id: 1,
    title: 'Nuevo pago recibido',
    description: 'Se ha registrado un pago de $1,500',
    time: 'Hace 5 min',
    read: false,
    icon: 'i-lucide-credit-card'
  },
  {
    id: 2,
    title: 'Solicitud de mantenimiento',
    description: 'Nueva solicitud en Propiedad #123',
    time: 'Hace 1 hora',
    read: false,
    icon: 'i-lucide-wrench'
  },
  {
    id: 3,
    title: 'Contrato por vencer',
    description: 'El contrato de Juan Pérez vence en 30 días',
    time: 'Hace 2 horas',
    read: true,
    icon: 'i-lucide-file-text'
  }
])

const markAsRead = (id: number) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
</script>

<template>
  <USlideover v-model:open="isNotificationsSlideoverOpen" title="Notificaciones">
    <template #body>
      <div class="flex flex-col gap-4 p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted">
            {{ unreadCount }} sin leer
          </span>
          <UButton 
            v-if="unreadCount > 0"
            variant="ghost" 
            size="sm"
            @click="markAllAsRead"
          >
            Marcar todo como leído
          </UButton>
        </div>

        <div class="flex flex-col gap-2">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="flex gap-3 p-3 rounded-lg transition-colors"
            :class="notification.read ? 'bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'"
            @click="markAsRead(notification.id)"
          >
            <div class="shrink-0">
              <UIcon :name="notification.icon" class="size-5 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm" :class="{ 'text-muted': notification.read }">
                {{ notification.title }}
              </p>
              <p class="text-sm text-muted truncate">
                {{ notification.description }}
              </p>
              <p class="text-xs text-muted mt-1">
                {{ notification.time }}
              </p>
            </div>
            <div v-if="!notification.read" class="shrink-0">
              <span class="size-2 rounded-full bg-primary block" />
            </div>
          </div>
        </div>

        <div v-if="notifications.length === 0" class="text-center py-8 text-muted">
          <UIcon name="i-lucide-bell-off" class="size-12 mx-auto mb-2 opacity-50" />
          <p>No tienes notificaciones</p>
        </div>
      </div>
    </template>
  </USlideover>
</template>
