import { getApiStatus, getExpenses, getIncome, getProperties, getPropertyTotals } from './propertyService'
import { parseCurrencyString } from '../utils/formatters'

export async function getPortfolioSnapshot() {
  const [apiStatus, properties] = await Promise.all([getApiStatus(), getProperties()])
  const monthKey = new Date().toISOString().slice(0, 7)

  const propertyMetrics = await Promise.all(
    properties.map(async (property) => {
      const [incomeRecords, expenseRecords, totals] = await Promise.all([
        getIncome(property.property_id),
        getExpenses(property.property_id),
        getPropertyTotals(property.property_id)
      ])

      const occupied = Boolean(property.tenant_name)
      const monthlyRentValue = parseCurrencyString(property.monthly_rent)
      const currentMonthIncomeValue = incomeRecords
        .filter((record) => record.date.startsWith(monthKey))
        .reduce((sum, record) => sum + parseCurrencyString(record.amount), 0)
      const paymentGapValue = Math.max(monthlyRentValue - currentMonthIncomeValue, 0)

      return {
        ...property,
        occupied,
        incomeRecords,
        expenseRecords,
        totals,
        incomeRecordCount: incomeRecords.length,
        expenseRecordCount: expenseRecords.length,
        monthlyRentValue,
        currentMonthIncomeValue,
        paymentGapValue,
        rentStatus: inferRentStatus({ occupied, monthlyRentValue, currentMonthIncomeValue }),
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

  return {
    apiStatus,
    properties: propertyMetrics,
    summary,
    lastRefreshed: new Date().toISOString()
  }
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
