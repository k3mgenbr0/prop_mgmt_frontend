import { getApiStatus, getExpenses, getIncome, getProperties, getPropertyTotals } from './propertyService'
import { parseCurrencyString } from '../utils/formatters'

export async function getPortfolioSnapshot() {
  const [apiStatus, properties] = await Promise.all([getApiStatus(), getProperties()])

  const propertyMetrics = await Promise.all(
    properties.map(async (property) => {
      const [incomeRecords, expenseRecords, totals] = await Promise.all([
        getIncome(property.property_id),
        getExpenses(property.property_id),
        getPropertyTotals(property.property_id)
      ])

      const occupied = Boolean(property.tenant_name)

      return {
        ...property,
        occupied,
        incomeRecords,
        expenseRecords,
        totals,
        incomeRecordCount: incomeRecords.length,
        expenseRecordCount: expenseRecords.length,
        monthlyRentValue: parseCurrencyString(property.monthly_rent),
        totalIncomeValue: parseCurrencyString(totals.total_income),
        totalExpenseValue: parseCurrencyString(totals.total_expenses),
        netCashFlowValue: parseCurrencyString(totals.net_cash_flow)
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
    totalIncomeAmount: propertyMetrics.reduce((sum, property) => sum + property.totalIncomeValue, 0),
    totalExpenseAmount: propertyMetrics.reduce((sum, property) => sum + property.totalExpenseValue, 0),
    netCashFlowAmount: propertyMetrics.reduce((sum, property) => sum + property.netCashFlowValue, 0)
  }

  return {
    apiStatus,
    properties: propertyMetrics,
    summary,
    lastRefreshed: new Date().toISOString()
  }
}
