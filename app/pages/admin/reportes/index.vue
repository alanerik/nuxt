<script setup lang="ts">
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'

definePageMeta({
  layout: 'admin'
})

const { 
  loading, 
  loadReportData, 
  summary, 
  revenueHistory, 
  recentTransactions, 
  formatCurrency 
} = useReportStats()

// Date State
const startDate = shallowRef<CalendarDate>(today(getLocalTimeZone()).subtract({ years: 1 }))
const endDate = shallowRef<CalendarDate>(today(getLocalTimeZone()))

// Load data on mount and watch dates
onMounted(() => {
  loadData()
})

const loadData = () => {
  loadReportData(startDate.value.toString(), endDate.value.toString())
}

watch([startDate, endDate], () => {
    loadData()
})

// Chart Logic
const chartContainer = ref<HTMLElement | null>(null)
const containerWidth = ref(800)
const containerHeight = 300

// Update width on resize (simplified)
onMounted(() => {
  if (chartContainer.value) {
    containerWidth.value = chartContainer.value.clientWidth
  }
  window.addEventListener('resize', () => {
    if (chartContainer.value) {
      containerWidth.value = chartContainer.value.clientWidth
    }
  })
})

const chartPoints = computed(() => {
  if (!revenueHistory.value.length) return ''
  
  const data = revenueHistory.value
  const maxVal = Math.max(...data.map(d => d.amount)) * 1.1 // 10% padding top
  const minVal = 0
  
  const width = containerWidth.value
  const height = containerHeight
  
  const stepX = width / (data.length - 1 || 1)
  
  const points = data.map((d, i) => {
    const x = i * stepX
    const y = height - ((d.amount - minVal) / (maxVal - minVal)) * height
    return `${x},${y}`
  }).join(' ')
  
  return points
})

const chartFillPath = computed(() => {
  if (!chartPoints.value) return ''
  const height = containerHeight
  const width = containerWidth.value // Ensure it closes correctly
  const lastPointX = (revenueHistory.value.length - 1) * (width / (revenueHistory.value.length - 1 || 1))
  
  return `${chartPoints.value} ${lastPointX},${height} 0,${height}`
})

// Transaction Table Columns
const columns = [
  { id: 'id', header: 'ID' },
  { id: 'date', header: 'Fecha' },
  { id: 'status', header: 'Estado' },
  { id: 'email', header: 'Email' },
  { id: 'amount', header: 'Monto' }
]

const getStatusColor = (status: string) => {
  switch(status) {
    case 'pagado': return 'success'
    case 'pendiente': return 'warning'
    case 'vencido': return 'error'
    case 'reembolsado': return 'neutral'
    default: return 'neutral'
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Reportes">
        <template #right>
          <UButton 
            icon="i-lucide-download" 
            variant="ghost" 
            label="Exportar"
            color="neutral"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <div class="p-6 space-y-6 overflow-y-auto">
      <!-- Top Filters / Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-bar-chart-3" class="size-5 text-muted" />
          <span>Resumen de Ingresos</span>
        </h2>
        
        <div class="flex items-center gap-2">
            <div class="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-md border border-gray-200 dark:border-gray-800">
                <UInputDate v-model="startDate" />
                <span class="text-muted text-sm px-1">hasta</span>
                <UInputDate v-model="endDate" />
            </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Revenue -->
        <UCard>
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted">Ingresos Totales</p>
            <div class="flex items-baseline gap-2">
              <h3 class="text-2xl font-bold">{{ formatCurrency(summary.totalRevenue) }}</h3>
              <UBadge 
                :color="summary.revenueChange >= 0 ? 'success' : 'error'" 
                variant="subtle"
                size="xs"
              >
                {{ summary.revenueChange >= 0 ? '+' : '' }}{{ summary.revenueChange.toFixed(1) }}%
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Active Properties -->
        <UCard>
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted">Propiedades Alquiladas</p>
            <div class="flex items-baseline gap-2">
              <h3 class="text-2xl font-bold">{{ summary.activeProperties }}</h3>
              <span class="text-xs text-muted">Activas</span>
            </div>
          </div>
        </UCard>

        <!-- Pending Payments -->
        <UCard>
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted">Pagos Pendientes</p>
            <div class="flex items-baseline gap-2">
              <h3 class="text-2xl font-bold">{{ formatCurrency(summary.pendingAmount) }}</h3>
              <span class="text-xs text-muted">{{ summary.pendingPayments }} facturas</span>
            </div>
          </div>
        </UCard>

        <!-- Orders/More -->
        <UCard>
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted">Inquilinos Recientes</p>
            <div class="flex items-baseline gap-2">
              <h3 class="text-2xl font-bold">+12</h3>
              <span class="text-xs text-success">+3%</span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Main Chart Section -->
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Ingresos en el tiempo</h3>
        </template>
        
        <div class="h-[300px] w-full relative" ref="chartContainer">
            <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-primary" />
            </div>

            <svg v-if="revenueHistory.length > 0" class="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="var(--color-primary-500)" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="var(--color-primary-500)" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                
                <!-- Area Fill -->
                <path 
                    :d="chartFillPath" 
                    fill="url(#gradientRevenue)" 
                    stroke="none"
                />
                
                <!-- Line -->
                <polyline 
                    :points="chartPoints" 
                    fill="none" 
                    stroke="var(--color-primary-500)" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                />

                <!-- Points (optional, maybe too busy) -->
                 <!--
                <circle v-for="(d, i) in revenueHistory" :key="i"
                  :cx="(i * (containerWidth / (revenueHistory.length - 1)))"
                  :cy="containerHeight - ((d.amount - 0) / (Math.max(...revenueHistory.map(r=>r.amount)) * 1.1 - 0)) * containerHeight"
                  r="3"
                  class="fill-white stroke-primary-500 stroke-2 hover:r-4 transition-all"
                />
                -->
            </svg>
            <div v-else class="h-full flex items-center justify-center text-muted">
                No hay datos suficientes para mostrar el gráfico
            </div>
        </div>
      </UCard>

      <!-- Transactions Table -->
      <UCard :ui="{ body: { padding: 'p-0 sm:p-0' } }">
        <template #header>
            <h3 class="text-base font-semibold">Transacciones Recientes</h3>
        </template>

        <UTable 
          :columns="columns" 
          :data="recentTransactions"
          :loading="loading"
        >
          <template #id-cell="{ row }">
            <span class="text-xs text-muted">#{{ row.original.id.slice(0, 8) }}</span>
          </template>

          <template #date-cell="{ row }">
            <span class="text-sm">{{ formatDate(row.original.date) }}</span>
          </template>

          <template #status-cell="{ row }">
            <UBadge :color="getStatusColor(row.original.status)" variant="soft" size="xs">
              {{ row.original.status }}
            </UBadge>
          </template>

          <template #email-cell="{ row }">
            <div class="flex flex-col">
              <span class="text-sm font-medium">{{ row.original.tenant_name || 'Desconocido' }}</span>
              <span class="text-xs text-muted">{{ row.original.email }}</span>
            </div>
          </template>

          <template #amount-cell="{ row }">
             <span class="font-medium font-mono text-right block">
                {{ formatCurrency(row.original.amount, row.original.currency) }}
             </span>
          </template>
        </UTable>
      </UCard>
    </div>
  </UDashboardPanel>
</template>
