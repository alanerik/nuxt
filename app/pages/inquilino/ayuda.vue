<script setup lang="ts">
definePageMeta({
  layout: 'inquilino'
})

const faqs = ref([
  {
    id: 1,
    question: '¿Cómo reporto un problema de mantenimiento?',
    answer: 'Puedes reportar un problema de mantenimiento desde tu dashboard haciendo clic en el botón "Reportar Problema" o accediendo a la sección de Mantenimiento. Completa el formulario con los detalles del problema, selecciona la categoría y prioridad, y el administrador será notificado inmediatamente.'
  },
  {
    id: 2,
    question: '¿Dónde puedo ver mis pagos?',
    answer: 'Puedes ver todos tus pagos en la sección "Pagos". Allí encontrarás un historial de todos tus pagos realizados y los próximos vencimientos. También podrás descargar comprobantes de pago.'
  },
  {
    id: 3,
    question: '¿Cómo accedo a mi contrato?',
    answer: 'Tu contrato está disponible en la sección "Mi Contrato" del menú principal. Allí encontrarás los detalles completos de tu contrato, información de la propiedad y términos acordados.'
  },
  {
    id: 4,
    question: '¿Puedo pagar mi alquiler en línea?',
    answer: 'Sí, puedes realizar pagos en línea desde la sección "Pagos". Selecciona el método de pago que prefieras y sigue las instrucciones en pantalla.'
  },
  {
    id: 5,
    question: '¿Cómo cambio mi contraseña?',
    answer: 'Puedes cambiar tu contraseña desde tu perfil. Accede a "Configuración" en el menú, luego ve a la pestaña de seguridad y sigue las instrucciones para actualizar tu contraseña.'
  },
  {
    id: 6,
    question: '¿A quién contacto si tengo problemas técnicos?',
    answer: 'Si experimentas problemas técnicos, puedes contactar al administrador a través del formulario de contacto o enviando un correo electrónico con los detalles de tu problema. Nos comunicaremos contigo lo antes posible.'
  }
])

const open = ref<number | null>(null)

const toggleFaq = (id: number) => {
  open.value = open.value === id ? null : id
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Centro de Ayuda">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton 
            icon="i-lucide-arrow-left" 
            to="/inquilino/dashboard"
            variant="ghost"
            color="neutral"
            label="Volver"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6 max-w-3xl mx-auto">
        <!-- Header -->
        <UCard>
          <div class="text-center space-y-3">
            <div class="flex justify-center">
              <div class="p-4 rounded-lg bg-primary/10">
                <UIcon name="i-lucide-help-circle" class="size-8 text-primary" />
              </div>
            </div>
            <h2 class="text-2xl font-bold">Centro de Ayuda</h2>
            <p class="text-muted">Encuentra respuestas a preguntas frecuentes sobre tu portal</p>
          </div>
        </UCard>

        <!-- FAQs -->
        <div class="space-y-3">
          <div 
            v-for="faq in faqs" 
            :key="faq.id"
            class="border border-default rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
          >
            <button
              @click="toggleFaq(faq.id)"
              class="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <p class="font-medium text-left">{{ faq.question }}</p>
              <UIcon 
                name="i-lucide-chevron-down" 
                class="size-5 text-muted transition-transform"
                :class="{ 'rotate-180': open === faq.id }"
              />
            </button>

            <transition
              enter-active-class="transition duration-200"
              enter-from-class="scale-95 opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition duration-200"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-95 opacity-0"
            >
              <div v-if="open === faq.id" class="px-6 pb-4 pt-2 bg-muted/30 border-t border-default">
                <p class="text-sm text-muted">{{ faq.answer }}</p>
              </div>
            </transition>
          </div>
        </div>

        <!-- Contact Support -->
        <UCard>
          <template #header>
            <h3 class="font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="size-5" />
              ¿Necesitas más ayuda?
            </h3>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-muted">
              Si no encuentras la respuesta que buscas, no dudes en contactarnos. Nuestro equipo está listo para ayudarte.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-lg bg-muted/50 border border-default">
                <p class="text-sm font-medium mb-2">Envía un correo</p>
                <p class="text-xs text-muted">soporte@ejemplo.com</p>
              </div>

              <div class="p-4 rounded-lg bg-muted/50 border border-default">
                <p class="text-sm font-medium mb-2">Teléfono</p>
                <p class="text-xs text-muted">+54 11 XXXX-XXXX</p>
              </div>
            </div>

            <UButton 
              label="Ir a Mantenimiento para reportar un problema" 
              icon="i-lucide-wrench"
              to="/inquilino/mantenimiento"
              class="w-full"
            />
          </div>
        </UCard>

        <!-- Quick Links -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UCard class="hover:border-primary/50 transition-colors cursor-pointer" @click="$router.push('/inquilino/dashboard')">
            <div class="text-center space-y-2">
              <UIcon name="i-lucide-home" class="size-6 text-primary mx-auto" />
              <p class="font-medium text-sm">Mi Dashboard</p>
            </div>
          </UCard>

          <UCard class="hover:border-primary/50 transition-colors cursor-pointer" @click="$router.push('/inquilino/pagos')">
            <div class="text-center space-y-2">
              <UIcon name="i-lucide-credit-card" class="size-6 text-primary mx-auto" />
              <p class="font-medium text-sm">Mis Pagos</p>
            </div>
          </UCard>

          <UCard class="hover:border-primary/50 transition-colors cursor-pointer" @click="$router.push('/inquilino/contrato')">
            <div class="text-center space-y-2">
              <UIcon name="i-lucide-file-text" class="size-6 text-primary mx-auto" />
              <p class="font-medium text-sm">Mi Contrato</p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
