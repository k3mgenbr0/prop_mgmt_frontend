<template>
  <section class="stack-lg">
    <div class="dashboard-welcome card">
      <div class="stack-md">
        <div>
          <p class="eyebrow">Today</p>
          <h2>Welcome back</h2>
          <p class="muted dashboard-copy">
            This dashboard is your starting point for the day. Use it to see what needs attention, jump into common
            workflows, and keep an eye on the health of your portfolio without digging through reports first.
          </p>
        </div>

        <div class="dashboard-chip-row">
          <span class="topbar-pill">Live data</span>
          <span class="topbar-pill">Last refreshed {{ refreshedLabel }}</span>
          <span class="topbar-pill">{{ filters.start && filters.end ? 'Custom date range' : 'All-time snapshot' }}</span>
        </div>
      </div>

      <div class="stack-md dashboard-welcome-actions">
        <div class="quick-filter-group">
          <button class="button button-secondary" :disabled="loading" @click="loadDashboard">
            {{ loading ? 'Refreshing...' : 'Refresh Data' }}
          </button>
          <button class="button button-secondary" @click="setQuickRange(30)">Last 30 days</button>
          <button class="button button-secondary" @click="setQuickRange(90)">Last 90 days</button>
          <button class="button button-secondary" @click="clearRange">All time</button>
        </div>

        <div class="dashboard-date-row">
          <label>
            Start Date
            <input v-model="filters.start" type="date" />
          </label>

          <label>
            End Date
            <input v-model="filters.end" type="date" />
          </label>
        </div>
      </div>
    </div>

    <AlertMessage :message="flashMessage" variant="success" />
    <AlertMessage :message="errorMessage" variant="error" />

    <LoadingSkeleton v-if="loading" :count="8" />

    <template v-else>
      <div class="dashboard-action-grid">
        <RouterLink class="card dashboard-action-card" to="/properties">
          <p class="eyebrow">Manage</p>
          <h3>Review properties</h3>
          <p class="muted">
            Browse all {{ snapshot.summary.totalProperties }} property records, compare performance, and open detail
            pages quickly.
          </p>
        </RouterLink>

        <RouterLink class="card dashboard-action-card" to="/properties/new">
          <p class="eyebrow">Create</p>
          <h3>Add a property</h3>
          <p class="muted">Create a new record when you are onboarding another rental into the portfolio.</p>
        </RouterLink>

        <RouterLink class="card dashboard-action-card" to="/income">
          <p class="eyebrow">Collect</p>
          <h3>Review income</h3>
          <p class="muted">
            Track rent received, inspect recent activity, and work through payment gaps across occupied properties.
          </p>
        </RouterLink>

        <RouterLink class="card dashboard-action-card" to="/expenses">
          <p class="eyebrow">Track</p>
          <h3>Review expenses</h3>
          <p class="muted">See recent expense activity, vendor patterns, and category trends without leaving the app.</p>
        </RouterLink>
      </div>

      <div class="stats-grid dashboard-summary-grid">
        <StatCard label="Properties" :value="String(snapshot.summary.totalProperties)" />
        <StatCard label="Occupied" :value="String(snapshot.summary.occupiedProperties)" />
        <StatCard label="Vacant" :value="String(snapshot.summary.vacantProperties)" />
        <StatCard label="Expected Monthly Rent" :value="formatCurrency(snapshot.summary.estimatedMonthlyRentTotal)" />
        <StatCard label="Income In Range" :value="formatCurrency(filteredSummary.incomeTotal)" />
        <StatCard label="Expenses In Range" :value="formatCurrency(filteredSummary.expenseTotal)" />
      </div>

      <div class="detail-grid dashboard-priority-grid">
        <section class="card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Needs Attention</p>
              <h3>Priority follow-up</h3>
            </div>
          </div>

          <div class="mini-stats mini-stats-wide">
            <div>
              <span class="mini-label">Payment gaps</span>
              <strong class="amount-negative">{{ paymentGapAlerts.length }}</strong>
            </div>
            <div>
              <span class="mini-label">Vacant properties</span>
              <strong>{{ vacantProperties.length }}</strong>
            </div>
            <div>
              <span class="mini-label">Rent collected this month</span>
              <strong>{{ formatCurrency(snapshot.summary.currentMonthIncomeTotal) }}</strong>
            </div>
          </div>

          <div class="dashboard-priority-list">
            <article v-for="item in priorityItems" :key="item.key" class="dashboard-priority-item">
              <div>
                <strong>{{ item.title }}</strong>
                <p class="muted">{{ item.detail }}</p>
              </div>
              <RouterLink class="button button-secondary" :to="item.to">Open</RouterLink>
            </article>
          </div>
        </section>

        <section class="card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">At A Glance</p>
              <h3>What this period looks like</h3>
            </div>
          </div>

          <div class="dashboard-overview-stack">
            <div class="dashboard-overview-row">
              <span class="mini-label">Income</span>
              <strong class="amount-positive">{{ formatCurrency(filteredSummary.incomeTotal) }}</strong>
            </div>
            <div class="dashboard-overview-row">
              <span class="mini-label">Expenses</span>
              <strong class="amount-negative">{{ formatCurrency(filteredSummary.expenseTotal) }}</strong>
            </div>
            <div class="dashboard-overview-row">
              <span class="mini-label">Net cash flow</span>
              <strong :class="filteredSummary.netTotal >= 0 ? 'amount-positive' : 'amount-negative'">
                {{ formatCurrency(filteredSummary.netTotal) }}
              </strong>
            </div>
            <div class="dashboard-overview-row">
              <span class="mini-label">Income change vs previous period</span>
              <strong>{{ signedCurrency(deltas.income) }}</strong>
            </div>
            <div class="dashboard-overview-row">
              <span class="mini-label">Expense change vs previous period</span>
              <strong>{{ signedCurrency(deltas.expense) }}</strong>
            </div>
            <div class="dashboard-overview-row">
              <span class="mini-label">Net cash flow change</span>
              <strong>{{ signedCurrency(deltas.net) }}</strong>
            </div>
          </div>
        </section>
      </div>

      <div class="detail-grid dashboard-support-grid">
        <section class="card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Recent Activity</p>
              <h3>Latest portfolio updates</h3>
            </div>
            <RouterLink class="button button-secondary" to="/reports">Open reports</RouterLink>
          </div>

          <EmptyState
            v-if="timelineItems.length === 0"
            title="No activity in this range"
            description="Adjust the date range to include income or expense activity."
          />

          <div v-else class="record-list">
            <article v-for="item in timelineItems" :key="item.key" class="card record-card activity-card">
              <div class="card-header">
                <div>
                  <strong>{{ item.title }}</strong>
                  <p class="muted">{{ item.propertyName }} · {{ item.description }}</p>
                </div>
                <div class="stack-sm activity-amount">
                  <strong :class="item.type === 'income' ? 'amount-positive' : 'amount-negative'">
                    {{ item.displayAmount }}
                  </strong>
                  <span class="muted">{{ formatDate(item.date) }}</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="card dashboard-secondary-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Rent Snapshot</p>
              <h3>This month’s collection progress</h3>
            </div>
            <RouterLink class="button button-secondary" to="/income">Open income</RouterLink>
          </div>

          <div class="mini-stats mini-stats-wide">
            <div>
              <span class="mini-label">Expected this month</span>
              <strong>{{ formatCurrency(upcomingRent.expected) }}</strong>
            </div>
            <div>
              <span class="mini-label">Received this month</span>
              <strong>{{ formatCurrency(upcomingRent.received) }}</strong>
            </div>
            <div>
              <span class="mini-label">Remaining gap</span>
              <strong :class="upcomingRent.remaining > 0 ? 'amount-negative' : 'amount-positive'">
                {{ formatCurrency(upcomingRent.remaining) }}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <section class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Portfolio Trends</p>
            <h3>Use these when you want more context</h3>
          </div>
        </div>

        <div class="detail-grid dashboard-chart-grid">
          <SimpleLineChart
            eyebrow="Cash Flow"
            title="Monthly income vs expenses"
            :points="monthlyTrend"
            primary-label="Income"
            secondary-label="Expenses"
            :primary-formatter="formatCurrency"
          />

          <section class="card dashboard-secondary-card">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Ranking</p>
                <h3>Profitability ranking</h3>
              </div>
              <RouterLink class="button button-secondary" to="/properties">Compare properties</RouterLink>
            </div>

            <EmptyState
              v-if="profitabilityRanking.length === 0"
              title="No properties to rank"
              description="Add a property to start seeing net cash-flow ranking."
            />

            <div v-else class="record-list">
              <article
                v-for="(property, index) in profitabilityRanking"
                :key="property.property_id"
                class="card record-card"
              >
                <div class="card-header">
                  <div>
                    <strong>#{{ index + 1 }} {{ property.name }}</strong>
                    <p class="muted">{{ property.city }}, {{ property.state }}</p>
                  </div>
                  <strong :class="property.netCashFlowValue >= 0 ? 'amount-positive' : 'amount-negative'">
                    {{ formatCurrency(property.netCashFlowValue) }}
                  </strong>
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getPortfolioSnapshot } from '../api/dashboardService'
import { useQueryFilters } from '../composables/useQueryFilters'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import SimpleLineChart from '../components/SimpleLineChart.vue'
import StatCard from '../components/StatCard.vue'
import { formatCurrency, formatDate, inDateRange, parseCurrencyString } from '../utils/formatters'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const errorMessage = ref('')
const flashMessage = ref('')
const filters = useQueryFilters(route, router, {
  start: '',
  end: ''
})
const snapshot = ref({
  properties: [],
  summary: {
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalIncomeRecords: 0,
    totalExpenseRecords: 0,
    estimatedMonthlyRentTotal: 0,
    currentMonthIncomeTotal: 0,
    paymentGapTotal: 0,
    latePropertyCount: 0,
    partialPropertyCount: 0,
    paidPropertyCount: 0,
    vacantPropertyCount: 0,
    totalIncomeAmount: 0,
    totalExpenseAmount: 0,
    netCashFlowAmount: 0
  },
  lastRefreshed: ''
})

const refreshedLabel = computed(() => {
  if (!snapshot.value.lastRefreshed) return 'just now'
  return formatDate(snapshot.value.lastRefreshed)
})

const filteredSummary = computed(() => {
  const incomeTotal = snapshot.value.properties.reduce(
    (sum, property) =>
      sum +
      property.incomeRecords
        .filter((record) => inDateRange(record.date, filters.start, filters.end))
        .reduce((inner, record) => inner + parseCurrencyString(record.amount), 0),
    0
  )

  const expenseTotal = snapshot.value.properties.reduce(
    (sum, property) =>
      sum +
      property.expenseRecords
        .filter((record) => inDateRange(record.date, filters.start, filters.end))
        .reduce((inner, record) => inner + parseCurrencyString(record.amount), 0),
    0
  )

  return {
    incomeTotal,
    expenseTotal,
    netTotal: incomeTotal - expenseTotal
  }
})

const monthlyTrend = computed(() => {
  const buckets = new Map()

  snapshot.value.properties.forEach((property) => {
    property.incomeRecords
      .filter((record) => inDateRange(record.date, filters.start, filters.end))
      .forEach((record) => {
        const key = record.date.slice(0, 7)
        const current = buckets.get(key) || { label: key.slice(5), primary: 0, secondary: 0 }
        current.primary += parseCurrencyString(record.amount)
        buckets.set(key, current)
      })

    property.expenseRecords
      .filter((record) => inDateRange(record.date, filters.start, filters.end))
      .forEach((record) => {
        const key = record.date.slice(0, 7)
        const current = buckets.get(key) || { label: key.slice(5), primary: 0, secondary: 0 }
        current.secondary += parseCurrencyString(record.amount)
        buckets.set(key, current)
      })
  })

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map(([, value]) => value)
})

const timelineItems = computed(() =>
  snapshot.value.properties
    .flatMap((property) => [
      ...property.incomeRecords
        .filter((record) => inDateRange(record.date, filters.start, filters.end))
        .map((record) => ({
          key: `income-${property.property_id}-${record.income_id}`,
          type: 'income',
          title: 'Income received',
          propertyName: property.name,
          description: record.description || 'No description provided.',
          displayAmount: `+ ${record.amount}`,
          date: record.date
        })),
      ...property.expenseRecords
        .filter((record) => inDateRange(record.date, filters.start, filters.end))
        .map((record) => ({
          key: `expense-${property.property_id}-${record.expense_id}`,
          type: 'expense',
          title: record.category,
          propertyName: property.name,
          description: record.description || record.vendor || 'No description provided.',
          displayAmount: `- ${record.amount}`,
          date: record.date
        }))
    ])
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 10)
)

const paymentGapAlerts = computed(() =>
  snapshot.value.properties
    .filter((property) => property.paymentGapValue > 0 && property.rentStatus !== 'vacant')
    .sort((left, right) => right.paymentGapValue - left.paymentGapValue)
    .slice(0, 6)
)

const vacantProperties = computed(() =>
  snapshot.value.properties.filter((property) => property.rentStatus === 'vacant').slice(0, 6)
)

const priorityItems = computed(() => {
  const items = []

  if (paymentGapAlerts.value.length > 0) {
    const alert = paymentGapAlerts.value[0]
    items.push({
      key: `gap-${alert.property_id}`,
      title: `${alert.name} has a payment gap`,
      detail: `${alert.tenant_name || 'Tenant not listed'} has ${formatCurrency(alert.paymentGapValue)} remaining this month.`,
      to: `/properties/${alert.property_id}`
    })
  }

  if (vacantProperties.value.length > 0) {
    const property = vacantProperties.value[0]
    items.push({
      key: `vacant-${property.property_id}`,
      title: `${property.name} is vacant`,
      detail: 'Review the property record and update tenant details when it is leased again.',
      to: `/properties/${property.property_id}`
    })
  }

  items.push({
    key: 'review-reports',
    title: 'Review portfolio reporting',
    detail: 'Use reports when you need exports, printable summaries, or a wider activity view.',
    to: '/reports'
  })

  return items
})

const profitabilityRanking = computed(() =>
  [...snapshot.value.properties]
    .sort((left, right) => right.netCashFlowValue - left.netCashFlowValue)
    .slice(0, 6)
)

const upcomingRent = computed(() => {
  const expected = snapshot.value.summary.estimatedMonthlyRentTotal
  const received = snapshot.value.summary.currentMonthIncomeTotal

  return {
    expected,
    received,
    remaining: Math.max(expected - received, 0)
  }
})

const deltas = computed(() => {
  if (!(filters.start && filters.end)) {
    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setDate(now.getDate() - 29)
    const previousEnd = new Date(currentStart)
    previousEnd.setDate(currentStart.getDate() - 1)
    const previousStart = new Date(previousEnd)
    previousStart.setDate(previousEnd.getDate() - 29)

    return computeDelta(windowRange(currentStart, now), windowRange(previousStart, previousEnd))
  }

  const start = new Date(filters.start)
  const end = new Date(filters.end)
  const diffDays = Math.max(1, Math.round((end - start) / 86400000) + 1)
  const previousEnd = new Date(start)
  previousEnd.setDate(start.getDate() - 1)
  const previousStart = new Date(previousEnd)
  previousStart.setDate(previousEnd.getDate() - (diffDays - 1))

  return computeDelta(windowRange(start, end), windowRange(previousStart, previousEnd))
})

function windowRange(start, end) {
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  }
}

function computePeriodTotals(range) {
  let income = 0
  let expense = 0

  snapshot.value.properties.forEach((property) => {
    property.incomeRecords
      .filter((record) => inDateRange(record.date, range.start, range.end))
      .forEach((record) => {
        income += parseCurrencyString(record.amount)
      })

    property.expenseRecords
      .filter((record) => inDateRange(record.date, range.start, range.end))
      .forEach((record) => {
        expense += parseCurrencyString(record.amount)
      })
  })

  return {
    income,
    expense,
    net: income - expense
  }
}

function computeDelta(currentRange, previousRange) {
  const current = computePeriodTotals(currentRange)
  const previous = computePeriodTotals(previousRange)

  return {
    income: current.income - previous.income,
    expense: current.expense - previous.expense,
    net: current.net - previous.net
  }
}

function signedCurrency(value) {
  const sign = value >= 0 ? '+ ' : '- '
  return `${sign}${formatCurrency(Math.abs(value))}`
}

function setQuickRange(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  filters.start = start.toISOString().slice(0, 10)
  filters.end = end.toISOString().slice(0, 10)
}

function clearRange() {
  filters.start = ''
  filters.end = ''
}

async function loadDashboard() {
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

onMounted(() => {
  flashMessage.value = route.query.message || ''
  loadDashboard()
})
</script>
