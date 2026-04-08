<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Reports</p>
        <h2>Portfolio Reports</h2>
        <p class="muted">
          Print-friendly summaries and a monthly activity calendar built from the live portfolio snapshot.
        </p>
      </div>
      <div class="card-actions">
        <button class="button button-secondary" :disabled="loading" @click="loadReports">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="button button-secondary" :disabled="loading" @click="printReport">
          Print Report
        </button>
        <button class="button button-secondary" :disabled="loading || filteredTransactions.length === 0" @click="exportTransactions">
          Export Transactions CSV
        </button>
        <button class="button button-secondary" :disabled="loading || !rentGapLeaders.length" @click="exportRentGaps">
          Export Rent Gaps CSV
        </button>
        <button class="button button-primary" :disabled="loading" @click="exportSummary">
          Export Summary CSV
        </button>
      </div>
    </div>

    <AlertMessage :message="errorMessage" variant="error" />
    <LoadingSkeleton v-if="loading" :count="6" />

    <template v-else>
      <section class="card filters-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Report Presets</p>
            <h3>Switch between reporting windows</h3>
          </div>
        </div>

        <div class="quick-filter-group">
          <button
            :class="['button', rangePreset === 'month' ? 'button-primary' : 'button-secondary']"
            @click="rangePreset = 'month'"
          >
            This Month
          </button>
          <button
            :class="['button', rangePreset === '90d' ? 'button-primary' : 'button-secondary']"
            @click="rangePreset = '90d'"
          >
            Last 90 Days
          </button>
          <button
            :class="['button', rangePreset === 'ytd' ? 'button-primary' : 'button-secondary']"
            @click="rangePreset = 'ytd'"
          >
            Year to Date
          </button>
          <button
            :class="['button', rangePreset === '12m' ? 'button-primary' : 'button-secondary']"
            @click="rangePreset = '12m'"
          >
            Last 12 Months
          </button>
          <button
            :class="['button', rangePreset === 'all' ? 'button-primary' : 'button-secondary']"
            @click="rangePreset = 'all'"
          >
            All Time
          </button>

          <label class="month-picker">
            Calendar Month
            <input v-model="calendarMonth" type="month" />
          </label>
        </div>
      </section>

      <div class="stats-grid reports-stats-grid">
        <StatCard label="Properties" :value="String(snapshot.summary.totalProperties)" />
        <StatCard label="Income In Range" :value="formatCurrency(rangeTotals.income)" />
        <StatCard label="Expenses In Range" :value="formatCurrency(rangeTotals.expense)" />
        <StatCard label="Net In Range" :value="formatCurrency(rangeTotals.net)" />
        <StatCard label="Transactions In Range" :value="String(filteredTransactions.length)" />
        <StatCard label="Monthly Rent" :value="formatCurrency(snapshot.summary.estimatedMonthlyRentTotal)" />
      </div>

      <section class="card report-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Executive Summary</p>
            <h3>Portfolio performance at a glance</h3>
          </div>
          <span class="muted">{{ presetLabel }} · Updated {{ formatDateTime(snapshot.lastRefreshed) }}</span>
        </div>

        <div class="mini-stats mini-stats-wide">
          <div>
            <span class="mini-label">Occupied Properties</span>
            <strong>{{ snapshot.summary.occupiedProperties }}</strong>
          </div>
          <div>
            <span class="mini-label">Vacant Properties</span>
            <strong>{{ snapshot.summary.vacantProperties }}</strong>
          </div>
          <div>
            <span class="mini-label">Properties Paid This Month</span>
            <strong>{{ snapshot.summary.paidPropertyCount }}</strong>
          </div>
          <div>
            <span class="mini-label">Partial / Late</span>
            <strong>{{ snapshot.summary.partialPropertyCount }} / {{ snapshot.summary.latePropertyCount }}</strong>
          </div>
          <div>
            <span class="mini-label">Current Rent Gap</span>
            <strong :class="snapshot.summary.paymentGapTotal > 0 ? 'amount-negative' : 'amount-positive'">
              {{ formatCurrency(snapshot.summary.paymentGapTotal) }}
            </strong>
          </div>
          <div>
            <span class="mini-label">Average Net Cash Flow</span>
            <strong>{{ formatCurrency(averageNetCashFlow) }}</strong>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <section class="card report-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Top Performers</p>
              <h3>Best net cash flow</h3>
            </div>
          </div>

          <div class="record-list">
            <article v-for="property in topPerformers" :key="property.property_id" class="card record-card">
              <div class="card-header">
                <div>
                  <strong>{{ property.name }}</strong>
                  <p class="muted">{{ property.city }}, {{ property.state }}</p>
                </div>
                <strong class="amount-positive">{{ formatCurrency(property.netCashFlowValue) }}</strong>
              </div>
            </article>
          </div>
        </section>

        <section class="card report-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Attention Needed</p>
              <h3>Largest current rent gaps</h3>
            </div>
          </div>

          <EmptyState
            v-if="rentGapLeaders.length === 0"
            title="No rent gaps right now"
            description="Occupied properties are currently fully paid based on this month’s income."
          />

          <div v-else class="record-list">
            <article v-for="property in rentGapLeaders" :key="property.property_id" class="card record-card">
              <div class="card-header">
                <div>
                  <strong>{{ property.name }}</strong>
                  <p class="muted">{{ property.tenant_name || 'No tenant on file' }}</p>
                </div>
                <strong class="amount-negative">{{ formatCurrency(property.paymentGapValue) }}</strong>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section class="card report-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Activity Calendar</p>
            <h3>Monthly portfolio activity</h3>
          </div>
          <span class="muted">{{ calendarLabel }}</span>
        </div>

        <div class="calendar-grid">
          <article v-for="day in calendarDays" :key="day.date" class="calendar-day">
            <div class="card-header">
              <strong>{{ day.dayNumber }}</strong>
              <span class="muted">{{ day.items.length }} item{{ day.items.length === 1 ? '' : 's' }}</span>
            </div>

            <div v-if="day.items.length" class="calendar-day-list">
              <div v-for="item in day.items" :key="item.key" class="calendar-item">
                <strong :class="item.type === 'income' ? 'amount-positive' : 'amount-negative'">
                  {{ item.displayAmount }}
                </strong>
                <span class="muted">{{ item.propertyName }}</span>
              </div>
            </div>

            <p v-else class="muted">No activity</p>
          </article>
        </div>
      </section>

      <section class="card report-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Printable Table</p>
            <h3>Property-by-property summary</h3>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Rent Status</th>
              <th>Monthly Rent</th>
              <th>Total Income</th>
              <th>Total Expenses</th>
              <th>Net Cash Flow</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="property in snapshot.properties" :key="property.property_id">
              <td>{{ property.name }}</td>
              <td>{{ getRentStatusLabel(property.rentStatus) }}</td>
              <td>{{ property.monthly_rent }}</td>
              <td>{{ property.totals?.total_income || formatCurrency(property.totalIncomeValue) }}</td>
              <td>{{ property.totals?.total_expenses || formatCurrency(property.totalExpenseValue) }}</td>
              <td>{{ property.totals?.net_cash_flow || formatCurrency(property.netCashFlowValue) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPortfolioSnapshot } from '../api/dashboardService'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import StatCard from '../components/StatCard.vue'
import { downloadCsv } from '../utils/exporters'
import { formatCurrency, formatDateTime, inDateRange, parseCurrencyString } from '../utils/formatters'
import { pushToast } from '../utils/toasts'

const loading = ref(true)
const errorMessage = ref('')
const rangePreset = ref('month')
const calendarMonth = ref(new Date().toISOString().slice(0, 7))
const snapshot = ref({
  properties: [],
  summary: {
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalIncomeRecords: 0,
    totalExpenseRecords: 0,
    estimatedMonthlyRentTotal: 0,
    paymentGapTotal: 0,
    paidPropertyCount: 0,
    partialPropertyCount: 0,
    latePropertyCount: 0,
    totalIncomeAmount: 0,
    totalExpenseAmount: 0,
    netCashFlowAmount: 0
  },
  lastRefreshed: ''
})

const presetLabel = computed(() => {
  if (rangePreset.value === 'month') return 'This month'
  if (rangePreset.value === '90d') return 'Last 90 days'
  if (rangePreset.value === 'ytd') return 'Year to date'
  if (rangePreset.value === '12m') return 'Last 12 months'
  return 'All time'
})

const range = computed(() => {
  const now = new Date()

  if (rangePreset.value === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    }
  }

  if (rangePreset.value === 'ytd') {
    return {
      start: `${now.getFullYear()}-01-01`,
      end: now.toISOString().slice(0, 10)
    }
  }

  if (rangePreset.value === '90d') {
    const start = new Date(now)
    start.setDate(now.getDate() - 89)
    return {
      start: start.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10)
    }
  }

  if (rangePreset.value === '12m') {
    const start = new Date(now)
    start.setMonth(now.getMonth() - 11)
    start.setDate(1)
    return {
      start: start.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10)
    }
  }

  return {
    start: '',
    end: ''
  }
})

const allTransactions = computed(() =>
  snapshot.value.properties.flatMap((property) => [
    ...property.incomeRecords.map((record) => ({
      key: `income-${property.property_id}-${record.income_id}`,
      type: 'income',
      propertyName: property.name,
      amountValue: parseCurrencyString(record.amount),
      displayAmount: `+ ${record.amount}`,
      date: record.date
    })),
    ...property.expenseRecords.map((record) => ({
      key: `expense-${property.property_id}-${record.expense_id}`,
      type: 'expense',
      propertyName: property.name,
      amountValue: parseCurrencyString(record.amount),
      displayAmount: `- ${record.amount}`,
      date: record.date
    }))
  ])
)

const filteredTransactions = computed(() =>
  allTransactions.value.filter((item) => inDateRange(item.date, range.value.start, range.value.end))
)

const rangeTotals = computed(() =>
  filteredTransactions.value.reduce(
    (totals, item) => {
      if (item.type === 'income') {
        totals.income += item.amountValue
      } else {
        totals.expense += item.amountValue
      }

      totals.net = totals.income - totals.expense
      return totals
    },
    { income: 0, expense: 0, net: 0 }
  )
)

const topPerformers = computed(() =>
  [...snapshot.value.properties].sort((left, right) => right.netCashFlowValue - left.netCashFlowValue).slice(0, 5)
)

const rentGapLeaders = computed(() =>
  [...snapshot.value.properties]
    .filter((property) => property.paymentGapValue > 0)
    .sort((left, right) => right.paymentGapValue - left.paymentGapValue)
    .slice(0, 5)
)

const averageNetCashFlow = computed(() => {
  if (!snapshot.value.summary.totalProperties) {
    return 0
  }

  return snapshot.value.summary.netCashFlowAmount / snapshot.value.summary.totalProperties
})

const calendarLabel = computed(() => {
  const [year, month] = calendarMonth.value.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
})

const calendarDays = computed(() => {
  const [year, month] = calendarMonth.value.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const itemsByDate = new Map()

  allTransactions.value
    .filter((item) => item.date.startsWith(calendarMonth.value))
    .forEach((item) => {
      const bucket = itemsByDate.get(item.date) || []
      bucket.push(item)
      itemsByDate.set(item.date, bucket)
    })

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1
    const date = `${calendarMonth.value}-${String(dayNumber).padStart(2, '0')}`
    return {
      date,
      dayNumber,
      items: itemsByDate.get(date) || []
    }
  })
})

function getRentStatusLabel(status) {
  if (status === 'paid') return 'Paid'
  if (status === 'partial') return 'Partial'
  if (status === 'late') return 'Late'
  return 'Vacant'
}

async function loadReports() {
  loading.value = true
  errorMessage.value = ''

  try {
    snapshot.value = await getPortfolioSnapshot()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

function exportSummary() {
  downloadCsv(
    'portfolio-report-summary.csv',
    snapshot.value.properties.map((property) => ({
      property: property.name,
      city: property.city,
      state: property.state,
      rent_status: getRentStatusLabel(property.rentStatus),
      monthly_rent: property.monthly_rent,
      total_income: property.totals?.total_income || formatCurrency(property.totalIncomeValue),
      total_expenses: property.totals?.total_expenses || formatCurrency(property.totalExpenseValue),
      net_cash_flow: property.totals?.net_cash_flow || formatCurrency(property.netCashFlowValue)
    }))
  )

  pushToast({
    title: 'Report export ready',
    message: 'The portfolio summary report was downloaded as CSV.',
    variant: 'success'
  })
}

function exportTransactions() {
  downloadCsv(
    `portfolio-transactions-${rangePreset.value}.csv`,
    filteredTransactions.value.map((item) => ({
      date: item.date,
      type: item.type,
      property: item.propertyName,
      amount: item.displayAmount.replace(/^[+-]\s/, ''),
      direction: item.type === 'income' ? 'credit' : 'debit'
    }))
  )

  pushToast({
    title: 'Transactions export ready',
    message: `The ${presetLabel.value.toLowerCase()} transaction report was downloaded as CSV.`,
    variant: 'success'
  })
}

function exportRentGaps() {
  downloadCsv(
    'portfolio-rent-gaps.csv',
    rentGapLeaders.value.map((property) => ({
      property: property.name,
      tenant: property.tenant_name || '',
      city: property.city,
      state: property.state,
      rent_status: getRentStatusLabel(property.rentStatus),
      monthly_rent: property.monthly_rent,
      collected_this_month: formatCurrency(property.currentMonthIncomeValue),
      current_gap: formatCurrency(property.paymentGapValue)
    }))
  )

  pushToast({
    title: 'Rent gap export ready',
    message: 'The current rent gap report was downloaded as CSV.',
    variant: 'success'
  })
}

function printReport() {
  window.print()
}

onMounted(loadReports)
</script>
