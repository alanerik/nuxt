// app/composables/useDashboardStats.ts
import type { Database } from '~/types/database.types'

interface Activity {
  id: string
  action: string
  property: string
  time: string
  icon: string
  type: 'contract' | 'payment' | 'maintenance' | 'tenant'
}

interface DashboardStats {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: string
}

export const useDashboardStats = () => {
  const supabase = useSupabaseClient<Database>()

  const activities = ref<Activity[]>([])
  const stats = ref<DashboardStats[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Formatea tiempo relativo en español
   */
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    if (diffDays === 1) return 'Hace 1 día'
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`
    return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`
  }

  /**
   * Formatea moneda
   */
  const formatCurrency = (amount: number, currency: string = 'ARS'): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Obtiene actividad reciente combinando múltiples fuentes
   */
  const fetchRecentActivity = async (limit: number = 5): Promise<Activity[]> => {
    const recentActivities: Activity[] = []

    try {
      // 1. Contratos recientes (firmados o renovados)
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          property:properties(address)
        `)
        .order('updated_at', { ascending: false })
        .limit(5) as any

      if (contracts) {
        for (const contract of contracts) {
          const address = contract.property?.address || 'Propiedad desconocida'
          const isNew = new Date(contract.created_at).getTime() === new Date(contract.updated_at).getTime()

          recentActivities.push({
            id: `contract-${contract.id}`,
            action: isNew ? 'Nuevo contrato firmado' : 'Contrato renovado',
            property: address,
            time: formatRelativeTime(contract.updated_at),
            icon: 'i-lucide-file-signature',
            type: 'contract'
          })
        }
      }

      // 2. Pagos recibidos
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          id,
          payment_date,
          created_at,
          contract:contracts(
            property:properties(address)
          )
        `)
        .eq('status', 'pagado')
        .not('payment_date', 'is', null)
        .order('payment_date', { ascending: false })
        .limit(5) as any

      if (payments) {
        for (const payment of payments) {
          const address = payment.contract?.property?.address || 'Propiedad desconocida'

          recentActivities.push({
            id: `payment-${payment.id}`,
            action: 'Pago recibido',
            property: address,
            time: formatRelativeTime(payment.payment_date || payment.created_at),
            icon: 'i-lucide-credit-card',
            type: 'payment'
          })
        }
      }

      // 3. Solicitudes de mantenimiento
      const { data: maintenance } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          title,
          created_at,
          property:properties(address)
        `)
        .order('created_at', { ascending: false })
        .limit(5) as any

      if (maintenance) {
        for (const request of maintenance) {
          const address = request.property?.address || 'Propiedad desconocida'

          recentActivities.push({
            id: `maintenance-${request.id}`,
            action: 'Solicitud de mantenimiento',
            property: address,
            time: formatRelativeTime(request.created_at),
            icon: 'i-lucide-wrench',
            type: 'maintenance'
          })
        }
      }

      // 4. Nuevos inquilinos registrados
      const { data: tenants } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('role', 'inquilino')
        .order('created_at', { ascending: false })
        .limit(5) as any

      if (tenants) {
        for (const tenant of tenants) {
          recentActivities.push({
            id: `tenant-${tenant.id}`,
            action: 'Nuevo inquilino registrado',
            property: tenant.full_name || 'Usuario sin nombre',
            time: formatRelativeTime(tenant.created_at),
            icon: 'i-lucide-user-plus',
            type: 'tenant'
          })
        }
      }

      // Ordenar por fecha y limitar
      return recentActivities
        .sort((a, b) => {
          // Extraer el tiempo aproximado del string para ordenar
          const getMinutes = (timeStr: string): number => {
            if (timeStr.includes('Ahora')) return 0
            const match = timeStr.match(/(\d+)/)
            if (!match) return 0
            const num = parseInt(match[1])
            if (timeStr.includes('minuto')) return num
            if (timeStr.includes('hora')) return num * 60
            if (timeStr.includes('día')) return num * 60 * 24
            if (timeStr.includes('semana')) return num * 60 * 24 * 7
            if (timeStr.includes('mes')) return num * 60 * 24 * 30
            return 0
          }
          return getMinutes(a.time) - getMinutes(b.time)
        })
        .slice(0, limit)
    } catch (e) {
      console.error('Error fetching recent activity:', e)
      return []
    }
  }

  /**
   * Obtiene estadísticas del dashboard
   */
  const fetchStats = async (): Promise<DashboardStats[]> => {
    const dashboardStats: DashboardStats[] = []

    try {
      // 1. Total propiedades
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })

      // Propiedades del mes anterior (para calcular cambio)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      const { count: propertiesLastMonth } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonth.toISOString())

      const propChange = propertiesLastMonth && propertiesLastMonth > 0
        ? Math.round(((totalProperties || 0) - propertiesLastMonth) / propertiesLastMonth * 100)
        : 0

      dashboardStats.push({
        title: 'Total Propiedades',
        value: (totalProperties || 0).toString(),
        change: `${propChange >= 0 ? '+' : ''}${propChange}%`,
        changeType: propChange >= 0 ? 'positive' : 'negative',
        icon: 'i-lucide-building-2'
      })

      // 2. Inquilinos activos
      const { count: activeTenants } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'inquilino')
        .eq('is_active', true)

      const { count: tenantsLastMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'inquilino')
        .eq('is_active', true)
        .lt('created_at', lastMonth.toISOString())

      const tenantChange = tenantsLastMonth && tenantsLastMonth > 0
        ? Math.round(((activeTenants || 0) - tenantsLastMonth) / tenantsLastMonth * 100)
        : 0

      dashboardStats.push({
        title: 'Inquilinos Activos',
        value: (activeTenants || 0).toString(),
        change: `${tenantChange >= 0 ? '+' : ''}${tenantChange}%`,
        changeType: tenantChange >= 0 ? 'positive' : 'negative',
        icon: 'i-lucide-users'
      })

      // 3. Ingresos mensuales
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount, currency')
        .eq('status', 'pagado')
        .gte('payment_date', startOfMonth.toISOString())

      const totalIncome = monthlyPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      // Ingresos del mes anterior
      const startOfLastMonth = new Date(startOfMonth)
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)
      const endOfLastMonth = new Date(startOfMonth)

      const { data: lastMonthPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'pagado')
        .gte('payment_date', startOfLastMonth.toISOString())
        .lt('payment_date', endOfLastMonth.toISOString())

      const lastMonthIncome = lastMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const incomeChange = lastMonthIncome > 0
        ? Math.round((totalIncome - lastMonthIncome) / lastMonthIncome * 100)
        : 0

      dashboardStats.push({
        title: 'Ingresos Mensuales',
        value: formatCurrency(totalIncome),
        change: `${incomeChange >= 0 ? '+' : ''}${incomeChange}%`,
        changeType: incomeChange >= 0 ? 'positive' : 'negative',
        icon: 'i-lucide-dollar-sign'
      })

      // 4. Tasa de ocupación
      const { count: occupiedProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .in('status', ['alquilada', 'reservada'])

      const occupancyRate = totalProperties && totalProperties > 0
        ? Math.round((occupiedProperties || 0) / totalProperties * 100)
        : 0

      // Tasa del mes anterior (aproximada)
      const { count: occupiedLastMonth } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .in('status', ['alquilada', 'reservada'])
        .lt('updated_at', lastMonth.toISOString())

      const lastOccupancy = propertiesLastMonth && propertiesLastMonth > 0
        ? Math.round((occupiedLastMonth || 0) / propertiesLastMonth * 100)
        : 0

      const occupancyChange = lastOccupancy > 0
        ? occupancyRate - lastOccupancy
        : 0

      dashboardStats.push({
        title: 'Tasa de Ocupación',
        value: `${occupancyRate}%`,
        change: `${occupancyChange >= 0 ? '+' : ''}${occupancyChange}%`,
        changeType: occupancyChange >= 0 ? 'positive' : 'negative',
        icon: 'i-lucide-percent'
      })

      return dashboardStats
    } catch (e) {
      console.error('Error fetching dashboard stats:', e)
      return []
    }
  }

  /**
   * Carga todos los datos del dashboard
   */
  const fetchDashboardData = async () => {
    loading.value = true
    error.value = null

    try {
      const [fetchedActivities, fetchedStats] = await Promise.all([
        fetchRecentActivity(5),
        fetchStats()
      ])

      activities.value = fetchedActivities
      stats.value = fetchedStats
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      console.error('Error loading dashboard data:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    activities: readonly(activities),
    stats: readonly(stats),
    loading: readonly(loading),
    error: readonly(error),

    // Métodos
    fetchDashboardData,
    fetchRecentActivity,
    fetchStats
  }
}
