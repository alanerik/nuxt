<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const saving = ref(false)

const form = ref({
  full_name: '',
  email: ''
})

onMounted(() => {
  if (user.value) {
    form.value.full_name = user.value.user_metadata?.full_name || ''
    form.value.email = user.value.email || ''
  }
})

const handleSave = async () => {
  saving.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: form.value.full_name
      }
    })

    if (error) throw error

    toast.add({
      title: 'Perfil actualizado',
      description: 'Tus datos se guardaron correctamente',
      color: 'success'
    })
  } catch (err: Error | unknown) {
    toast.add({
      title: 'Error',
      description: err.message || 'No se pudo actualizar el perfil',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel>
      <UDashboardNavbar title="Mi Perfil">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/admin/dashboard"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardPanelContent class="p-6">
        <div class="max-w-2xl">
          <UCard>
            <template #header>
              <h3 class="font-semibold text-lg">Información Personal</h3>
            </template>

            <UForm :state="form" @submit="handleSave" class="space-y-4">
              <UFormField label="Nombre Completo" name="full_name">
                <UInput
                  v-model="form.full_name"
                  placeholder="Tu nombre completo"
                  icon="i-lucide-user"
                  :disabled="saving"
                />
              </UFormField>

              <UFormField 
                label="Email" 
                name="email"
                help="El email no se puede cambiar por motivos de seguridad"
              >
                <UInput
                  v-model="form.email"
                  type="email"
                  icon="i-lucide-mail"
                  disabled
                />
              </UFormField>

              <div class="flex gap-2">
                <UButton
                  type="submit"
                  label="Guardar Cambios"
                  :loading="saving"
                  :disabled="saving"
                />

                <UButton
                  color="neutral"
                  variant="ghost"
                  label="Cancelar"
                  :disabled="saving"
                  @click="form.full_name = user?.user_metadata?.full_name || ''"
                />
              </div>
            </UForm>
          </UCard>
        </div>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>