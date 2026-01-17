export const useAuth = () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastAttempt = ref(0)

    const COOLDOWN_MS = 2000

    const signIn = async (
        email: string,
        pass: string,
        expectedRole: string,
        redirect: string
    ): Promise<void> => {
        // Rate limiting
        const now = Date.now()
        if (now - lastAttempt.value < COOLDOWN_MS) {
            error.value = 'Por favor espera un momento'
            return
        }
        lastAttempt.value = now

        loading.value = true
        error.value = null

        try {
            const { data, error: err } = await supabase.auth.signInWithPassword({
                email,
                password: pass
            })

            if (err) {
                if (err.message.includes('Invalid login credentials')) {
                    throw new Error('Email o contraseña incorrectos')
                }
                if (err.message.includes('Email not confirmed')) {
                    throw new Error('Debes confirmar tu email antes de iniciar sesión')
                }
                throw err
            }

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
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
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
    ): Promise<boolean> => {
        const now = Date.now()
        if (now - lastAttempt.value < COOLDOWN_MS) {
            error.value = 'Por favor espera un momento'
            return false
        }
        lastAttempt.value = now

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

            if (err) {
                if (err.message.includes('already registered')) {
                    throw new Error('Este email ya está registrado')
                }
                if (err.message.includes('Password should be')) {
                    throw new Error('La contraseña debe tener al menos 6 caracteres')
                }
                throw err
            }

            return true
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
            return false
        } finally {
            loading.value = false
        }
    }

    const socialLogin = async (
        provider: 'google',
        redirectUrl: string
    ): Promise<void> => {
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
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
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