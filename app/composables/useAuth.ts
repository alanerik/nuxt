export const useAuth = () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    const loading = ref(false)
    const error = ref<string | null>(null)

    const signIn = async (
        email: string,
        pass: string,
        expectedRole: string,
        redirect: string
    ) => {
        loading.value = true
        error.value = null

        try {
            const { data, error: err } = await supabase.auth.signInWithPassword({
                email,
                password: pass
            })

            if (err) throw err

            // Verificación de rol con manejo de error
            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (profileErr) {
                await supabase.auth.signOut()
                throw new Error('Error al verificar tu perfil')
            }

            if (profile.role !== expectedRole) {
                await supabase.auth.signOut()
                throw new Error('No tienes permisos para este panel')
            }

            await navigateTo(redirect)
        } catch (e: any) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    const signUp = async (
        email: string,
        pass: string,
        fullName: string,
        role: string,
        redirectOrigin: string
    ) => {
        loading.value = true
        error.value = null

        try {
            const { error: err } = await supabase.auth.signUp({
                email,
                password: pass,
                options: {
                    emailRedirectTo: `${redirectOrigin}/confirm`,
                    data: { full_name: fullName, role }
                }
            })

            if (err) throw err
            return true
        } catch (e: any) {
            error.value = e.message
            return false
        } finally {
            loading.value = false
        }
    }

    const socialLogin = async (provider: 'google', redirectUrl: string) => {
        loading.value = true
        error.value = null

        try {
            const { error: err } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            })

            if (err) throw err
        } catch (e: any) {
            error.value = e.message
            loading.value = false
        }
    }

    return {
        user,
        loading,
        error,
        signIn,
        signUp,
        socialLogin
    }
}