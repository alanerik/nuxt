// app/composables/useReportStats.ts
import type { Database } from '~/types/database.types'

interface RevenueData {
    date: string
    amount: number
}

interface ReportSummary {
    totalRevenue: number
    revenueChange: number
    activeProperties: number
    propertiesChange: number
    pendingPayments: number
    pendingAmount: number
    occupancyRate: number
}

interface Transaction {
    id: string
    date: string
    status: string
    email: string
    amount: number
    currency: string
    tenant_name?: string
}

export const useReportStats = () => {
    const supabase = useSupabaseClient<Database>()

    const loading = ref(false)
    const error = ref<Error | null>(null)
    const revenueHistory = ref<RevenueData[]>([])
    const summary = ref<ReportSummary>({
        totalRevenue: 0,
        revenueChange: 0,
        activeProperties: 0,
        propertiesChange: 0,
        pendingPayments: 0,
        pendingAmount: 0,
        occupancyRate: 0
    })
    const recentTransactions = ref<Transaction[]>([])

    const formatCurrency = (amount: number, currency: string = 'ARS'): string => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const fetchRevenueHistory = async (startDateStr?: string, endDateStr?: string) => {
        try {
            const endDate = endDateStr ? new Date(endDateStr) : new Date()
            const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().setFullYear(new Date().getFullYear() - 1))

            const { data: payments } = await supabase
                .from('payments')
                .select('amount, payment_date')
                .eq('status', 'pagado')
                .gte('payment_date', startDate.toISOString())
                .lte('payment_date', endDate.toISOString())
                .order('payment_date', { ascending: true })

            if (!payments) return

            // Group by month
            const grouped = new Map<string, number>()
            const paymentData = payments as any[] // Explicit cast to avoid type errors

            // Generate list of months between start and end
            let current = new Date(startDate)
            const end = new Date(endDate)

            while (current <= end) {
                const key = current.toISOString().slice(0, 7) // YYYY-MM
                grouped.set(key, 0)
                current.setMonth(current.getMonth() + 1)
            }

            paymentData.forEach(p => {
                if (p.payment_date) {
                    const key = p.payment_date.slice(0, 7)
                    // Only add if key exists (within range) or just add it
                    if (grouped.has(key)) {
                        const currentVal = grouped.get(key) || 0
                        grouped.set(key, currentVal + (p.amount || 0))
                    }
                }
            })

            revenueHistory.value = Array.from(grouped.entries()).map(([date, amount]) => ({
                date,
                amount
            }))
        } catch (e) {
            console.error('Error fetching revenue history', e)
        }
    }

    const fetchReportSummary = async () => {
        try {
            // Reuse some logic or fetch fresh
            // 1. Revenue (Current Month)
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

            const { data: currentPayments } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'pagado')
                .gte('payment_date', startOfMonth.toISOString())

            const currentPaymentData = (currentPayments || []) as any[]
            const currentRevenue = currentPaymentData.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

            const { data: lastPayments } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'pagado')
                .gte('payment_date', startOfLastMonth.toISOString())
                .lte('payment_date', endOfLastMonth.toISOString())

            const lastPaymentData = (lastPayments || []) as any[]
            const lastRevenue = lastPaymentData.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
            const revenueChange = lastRevenue ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0

            // 2. Active Properties
            const { count: activeProps } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'alquilada')

            // 3. Pending Payments
            const { data: pending } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'pendiente')

            const pendingData = (pending || []) as any[]
            const pendingCount = pendingData.length
            const pendingTotal = pendingData.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

            summary.value = {
                totalRevenue: currentRevenue,
                revenueChange,
                activeProperties: activeProps || 0,
                propertiesChange: 0, // Placeholder
                pendingPayments: pendingCount,
                pendingAmount: pendingTotal,
                occupancyRate: 0 // Placeholder
            }

        } catch (e) {
            console.error('Error fetching summary', e)
        }
    }

    const fetchRecentTransactions = async (limit: number = 10) => {
        try {
            const { data } = await supabase
                .from('payments')
                .select(`
          id,
          payment_date,
          status,
          amount,
          currency,
          tenant:profiles(email, full_name)
        `)
                .order('payment_date', { ascending: false })
                .limit(limit) as any

            if (data) {
                recentTransactions.value = data.map((p: any) => ({
                    id: p.id,
                    date: p.payment_date,
                    status: p.status,
                    email: p.tenant?.email || 'N/A',
                    tenant_name: p.tenant?.full_name,
                    amount: p.amount,
                    currency: p.currency
                }))
            }
        } catch (e) {
            console.error('Error fetching transactions', e)
        }
    }

    const loadReportData = async (startDate?: string, endDate?: string) => {
        loading.value = true
        await Promise.all([
            fetchRevenueHistory(startDate, endDate),
            fetchReportSummary(),
            fetchRecentTransactions()
        ])
        loading.value = false
    }

    return {
        loading,
        error,
        revenueHistory,
        summary,
        recentTransactions,
        loadReportData,
        formatCurrency
    }
}
