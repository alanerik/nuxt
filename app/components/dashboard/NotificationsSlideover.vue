<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const { isNotificationsSlideoverOpen } = useDashboard()
const { 
  notifications, 
  unreadCount, 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  subscribeToNotifications 
} = useNotifications()

// Initial Load
onMounted(() => {
  fetchNotifications()
  const channel = subscribeToNotifications()
  
  onUnmounted(() => {
    if (channel) supabase.removeChannel(channel)
  })
})

const getIcon = (type: string) => {
  switch (type) {
    case 'payment': return 'i-lucide-credit-card'
    case 'maintenance': return 'i-lucide-wrench'
    case 'contract': return 'i-lucide-file-text'
    case 'system': return 'i-lucide-info'
    case 'alert': return 'i-lucide-alert-triangle'
    default: return 'i-lucide-bell'
  }
}

const getRelativeTime = (dateStr: string) => {
  try {
      // Simple custom format relative time to avoid importing full date-fns if not needed, 
      // but since project seems to use specific formatting, let's try a simple approach first
      // or use Intl.RelativeTimeFormat
      const date = new Date(dateStr)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
      
      if (diffInSeconds < 60) return 'Hace unos segundos'
      const diffInMinutes = Math.floor(diffInSeconds / 60)
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `Hace ${diffInHours} h`
      const diffInDays = Math.floor(diffInHours / 24)
      return `Hace ${diffInDays} días`
  } catch (e) {
      return ''
  }
}
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
            class="flex gap-3 p-3 rounded-lg transition-colors cursor-pointer"
            :class="notification.is_read ? 'bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'"
            @click="markAsRead(notification.id)"
          >
            <div class="shrink-0">
              <UIcon :name="getIcon(notification.type || 'system')" class="size-5 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm" :class="{ 'text-muted': notification.is_read }">
                {{ notification.title }}
              </p>
              <p class="text-sm text-muted truncate">
                {{ notification.message }}
              </p>
              <p class="text-xs text-muted mt-1">
                {{ getRelativeTime(notification.created_at) }}
              </p>
            </div>
            <div v-if="!notification.is_read" class="shrink-0">
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
