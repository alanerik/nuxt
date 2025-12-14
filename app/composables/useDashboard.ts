import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
    const route = useRoute()
    const router = useRouter()
    const isNotificationsSlideoverOpen = ref(false)

    // Keyboard shortcuts
    defineShortcuts({
        'n': () => isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
    })

    // Close slideover on route change
    watch(() => route.fullPath, () => {
        isNotificationsSlideoverOpen.value = false
    })

    return {
        isNotificationsSlideoverOpen
    }
}

export const useDashboard = createSharedComposable(_useDashboard)
