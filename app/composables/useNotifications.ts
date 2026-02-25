// app/composables/useNotifications.ts
// Singleton pattern via useState — one shared instance across all components.
// The Realtime channel is managed at layout level (see layouts/admin.vue),
// so the badge and the slideover always stay in sync without polling.
import type { Database } from '~/types/database.types'

export type Notification = Database['public']['Tables']['notifications']['Row']

export const useNotifications = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    // Shared reactive state — same ref regardless of how many components call this
    const notifications = useState<Notification[]>('notifications', () => [])
    const loading = useState<boolean>('notifications:loading', () => false)

    // Derived: unread badge count
    const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

    // ─── Fetch ────────────────────────────────────────────────────────────────

    const fetchNotifications = async () => {
        if (!user.value?.id) return

        loading.value = true
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.value.id)
                .order('created_at', { ascending: false })
                .limit(30)

            if (error) throw error
            notifications.value = data ?? []
        } finally {
            loading.value = false
        }
    }

    // ─── Mark as read ─────────────────────────────────────────────────────────

    const markAsRead = async (id: string) => {
        // Optimistic update
        const n = notifications.value.find(n => n.id === id)
        if (n) n.is_read = true

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() } as never)
            .eq('id', id)

        if (error) {
            // Revert on failure
            if (n) n.is_read = false
            console.error('[notifications] markAsRead error:', error.message)
        }
    }

    const markAllAsRead = async () => {
        if (!user.value?.id) return

        // Optimistic update
        const now = new Date().toISOString()
        notifications.value.forEach(n => {
            if (!n.is_read) {
                n.is_read = true
                n.read_at = now
            }
        })

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: now } as never)
            .eq('user_id', user.value.id)
            .eq('is_read', false)

        if (error) {
            console.error('[notifications] markAllAsRead error:', error.message)
            // Refetch to restore correct state
            await fetchNotifications()
        }
    }

    // ─── Realtime subscription ────────────────────────────────────────────────
    // Call once at layout level. Returns the channel so the layout can clean up.

    const subscribeToRealtime = () => {
        if (!user.value?.id) return null

        return supabase
            .channel(`notifications:${user.value.id}`)   // unique per-user channel name
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.value.id}`,
                },
                (payload) => {
                    // Prepend so newest is first — no refetch needed
                    notifications.value.unshift(payload.new as Notification)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.value.id}`,
                },
                (payload) => {
                    // Sync is_read / read_at from DB (e.g. marked read on another tab)
                    const idx = notifications.value.findIndex(n => n.id === payload.new.id)
                    if (idx !== -1) {
                        notifications.value[idx] = payload.new as Notification
                    }
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
        subscribeToRealtime,
    }
}
