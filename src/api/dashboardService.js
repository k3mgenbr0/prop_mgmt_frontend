import { getExpenses, getIncome, getProperties } from './propertyService'
import { parseCurrencyString } from '../utils/formatters'

const DASHBOARD_CACHE_TTL = 60000
const SESSION_CACHE_KEY = 'property_dashboard_snapshot'
let snapshotCache = null

export async function getPortfolioSnapshot() {
  if (snapshotCache && Date.now() - snapshotCache.createdAt < DASHBOARD_CACHE_TTL) {
    return snapshotCache.data
  }

  if (typeof window !== 'undefined') {
    const stored = window.sessionStorage.getItem(SESSION_CACHE_KEY)

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Date.now() - parsed.createdAt < DASHBOARD_CACHE_TTL) {
          snapshotCache = parsed
          return parsed.data
        }
      } catch {
        window.sessionStorage.removeItem(SESSION_CACHE_KEY)
      }
    }
  }

  const properties = await getProperties()
  const monthKey = new Date().toISOString().slice(0, 7)

  const propertyMetrics = await Promise.all(
    properties.map(async (property) => {
      const [incomeRecords, expenseRecords] = await Promise.all([getIncome(property.property_id), getExpenses(property.property_id)])

      const occupied = Boolean(property.tenant_name)
      const monthlyRentValue = parseCurrencyString(property.monthly_rent)
      const currentMonthIncomeValue = incomeRecords
        .filter((record) => record.date.startsWith(monthKey))
        .reduce((sum, record) => sum + parseCurrencyString(record.amount), 0)
      const paymentGapValue = Math.max(monthlyRentValue - currentMonthIncomeValue, 0)
      const totalIncomeValue = incomeRecords.reduce((sum, record) => sum + parseCurrencyString(record.amount), 0)
      const totalExpenseValue = expenseRecords.reduce((sum, record) => sum + parseCurrencyString(record.amount), 0)

      return {
        ...property,
        occupied,
        incomeRecords,
        expenseRecords,
        incomeRecordCount: incomeRecords.length,
        expenseRecordCount: expenseRecords.length,
        monthlyRentValue,
        currentMonthIncomeValue,
        paymentGapValue,
        rentStatus: inferRentStatus({ occupied, monthlyRentValue, currentMonthIncomeValue }),
        totalIncomeValue,
        totalExpenseValue,
        netCashFlowValue: totalIncomeValue - totalExpenseValue
      }
    })
  )

  const summary = {
    totalProperties: propertyMetrics.length,
    occupiedProperties: propertyMetrics.filter((property) => property.occupied).length,
    vacantProperties: propertyMetrics.filter((property) => !property.occupied).length,
    totalIncomeRecords: propertyMetrics.reduce((sum, property) => sum + property.incomeRecordCount, 0),
    totalExpenseRecords: propertyMetrics.reduce((sum, property) => sum + property.expenseRecordCount, 0),
    estimatedMonthlyRentTotal: propertyMetrics.reduce((sum, property) => sum + property.monthlyRentValue, 0),
    currentMonthIncomeTotal: propertyMetrics.reduce((sum, property) => sum + property.currentMonthIncomeValue, 0),
    paymentGapTotal: propertyMetrics.reduce((sum, property) => sum + property.paymentGapValue, 0),
    latePropertyCount: propertyMetrics.filter((property) => property.rentStatus === 'late').length,
    partialPropertyCount: propertyMetrics.filter((property) => property.rentStatus === 'partial').length,
    paidPropertyCount: propertyMetrics.filter((property) => property.rentStatus === 'paid').length,
    vacantPropertyCount: propertyMetrics.filter((property) => property.rentStatus === 'vacant').length,
    totalIncomeAmount: propertyMetrics.reduce((sum, property) => sum + property.totalIncomeValue, 0),
    totalExpenseAmount: propertyMetrics.reduce((sum, property) => sum + property.totalExpenseValue, 0),
    netCashFlowAmount: propertyMetrics.reduce((sum, property) => sum + property.netCashFlowValue, 0)
  }

  const data = {
    properties: propertyMetrics,
    summary,
    lastRefreshed: new Date().toISOString()
  }

  snapshotCache = {
    createdAt: Date.now(),
    data
  }

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(snapshotCache))
  }

  return data
}

function inferRentStatus({ occupied, monthlyRentValue, currentMonthIncomeValue }) {
  if (!occupied) {
    return 'vacant'
  }

  if (currentMonthIncomeValue >= monthlyRentValue) {
    return 'paid'
  }

  if (currentMonthIncomeValue > 0) {
    return 'partial'
  }

  return 'late'
}
