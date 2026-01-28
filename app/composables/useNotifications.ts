// app/composables/useNotifications.ts
import type { Database } from '~/types/database.types'

export type Notification = Database['public']['Tables']['notifications']['Row']

export const useNotifications = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()
    const notifications = ref<Notification[]>([])
    const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)
    const loading = ref(false)

    const fetchNotifications = async () => {
        if (!user.value?.id) return

        try {
            loading.value = true
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.value.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) throw error
            notifications.value = data || []
        } catch (e) {
            console.error('Error fetching notifications:', e)
        } finally {
            loading.value = false
        }
    }

    const markAsRead = async (id: string) => {
        // Optimistic update
        const index = notifications.value.findIndex(n => n.id === id)
        if (index !== -1 && notifications.value[index]) {
            notifications.value[index].is_read = true
        }

        try {
            const { error } = await supabase
                .from('notifications')
                // @ts-ignore
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
        } catch (e) {
            console.error('Error marking notification as read:', e)
            // Revert if error? For now just log
        }
    }

    const markAllAsRead = async () => {
        // Optimistic update
        notifications.value.forEach(n => n.is_read = true)

        if (!user.value) return

        try {
            const { error } = await supabase
                .from('notifications')
                // @ts-ignore
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', user.value.id)
                .eq('is_read', false)

            if (error) throw error
        } catch (e) {
            console.error('Error marking all notifications as read:', e)
        }
    }

    // Subscribe to realtime changes
    const subscribeToNotifications = () => {
        if (!user.value) return

        return supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.value.id}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification
                    notifications.value.unshift(newNotification)
                }
            )
            .subscribe()
    }

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        subscribeToNotifications
    }
}
