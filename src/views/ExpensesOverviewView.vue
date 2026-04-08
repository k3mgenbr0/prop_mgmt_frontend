<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Expenses</p>
        <h2>Expense Activity</h2>
        <p class="muted">This view aggregates live expense records fetched property by property from the backend.</p>
      </div>
      <div class="card-actions">
        <button class="button button-secondary" :disabled="loading" @click="loadExpenseOverview">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="button button-secondary" :disabled="filteredExpenseRows.length === 0" @click="exportExpenses">
          Export CSV
        </button>
        <button class="button button-secondary" :disabled="loading" @click="saveCurrentView">
          Save View
        </button>
      </div>
    </div>

    <AlertMessage :message="errorMessage" variant="error" />
    <LoadingSkeleton v-if="loading" :count="5" />

    <template v-else>
      <div class="stats-grid">
        <StatCard label="Properties Loaded" :value="String(snapshot.summary.totalProperties)" />
        <StatCard label="Expense Records" :value="String(filteredExpenseRows.length)" />
        <StatCard label="Total Expenses" :value="formatCurrency(filteredExpenseTotal)" />
      </div>

      <section class="card filters-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Filters</p>
            <h3>Refine live expense records</h3>
          </div>
        </div>

        <div class="filter-grid">
          <label>
            Property
            <select v-model="filters.property">
              <option value="">All properties</option>
              <option v-for="property in propertyOptions" :key="property" :value="property">{{ property }}</option>
            </select>
          </label>

          <label>
            Category
            <select v-model="filters.category">
              <option value="">All categories</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>

          <label>
            Year
            <select v-model="filters.year">
              <option value="">All years</option>
              <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
          </label>

          <label>
            Start Date
            <input v-model="filters.start" type="date" />
          </label>

          <label>
            End Date
            <input v-model="filters.end" type="date" />
          </label>

          <label class="full-width">
            Search Vendor / Description
            <input v-model.trim="filters.search" placeholder="Mortgage, Allstate, repair..." />
          </label>
        </div>

        <div v-if="savedViews.length" class="saved-views">
          <strong>Saved views</strong>
          <div class="saved-view-list">
            <button
              v-for="view in savedViews"
              :key="view.id"
              class="button button-secondary saved-view-button"
              @click="applySavedView(view)"
            >
              {{ view.name }}
            </button>
            <button
              v-for="view in savedViews"
              :key="`${view.id}-remove`"
              class="button button-danger saved-view-delete"
              @click="deleteSavedView(view.id)"
            >
              Remove {{ view.name }}
            </button>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <SimpleLineChart
          eyebrow="Trend"
          title="Expenses by month"
          :points="monthlyExpenseTrend"
          primary-label="Expenses"
          :primary-formatter="formatCurrency"
        />

        <SimpleBarChart
          eyebrow="Categories"
          title="Expenses by category"
          :items="expenseByCategory"
          :value-formatter="formatCurrency"
          @select="filters.category = $event"
        />
      </div>

      <section class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Calendar</p>
            <h3>Expense calendar view</h3>
          </div>
          <label class="month-picker">
            Month
            <input v-model="calendarMonth" type="month" />
          </label>
        </div>

        <div class="calendar-grid">
          <article v-for="day in calendarDays" :key="day.date" class="calendar-day">
            <div class="card-header">
              <strong>{{ day.dayNumber }}</strong>
              <span class="muted">{{ day.items.length }} item{{ day.items.length === 1 ? '' : 's' }}</span>
            </div>

            <div v-if="day.items.length" class="calendar-day-list">
              <div v-for="item in day.items" :key="item.key" class="calendar-item">
                <strong class="amount-negative">{{ item.amount }}</strong>
                <span class="muted">{{ item.propertyName }}</span>
              </div>
            </div>

            <p v-else class="muted">No expenses</p>
          </article>
        </div>
      </section>

      <EmptyState
        v-if="allExpenseRows.length === 0"
        title="No expense records returned"
        description="The frontend reached the backend, but there are no expense rows to display."
      />

      <EmptyState
        v-else-if="filteredExpenseRows.length === 0"
        title="No expense records match these filters"
        description="Try clearing one or more filters to show more live expense records."
      />

      <div v-else class="record-list">
        <article v-for="row in filteredExpenseRows" :key="row.key" class="card record-card">
          <div class="card-header">
            <div>
              <strong>{{ row.amount }}</strong>
              <p class="muted">{{ row.propertyName }}</p>
            </div>
            <span class="muted">{{ formatDate(row.date) }}</span>
          </div>
          <p>{{ row.category }}<span v-if="row.vendor"> · {{ row.vendor }}</span></p>
          <p class="muted">{{ row.description || 'No description provided.' }}</p>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPortfolioSnapshot } from '../api/dashboardService'
import { useQueryFilters } from '../composables/useQueryFilters'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import SimpleBarChart from '../components/SimpleBarChart.vue'
import SimpleLineChart from '../components/SimpleLineChart.vue'
import StatCard from '../components/StatCard.vue'
import { downloadCsv } from '../utils/exporters'
import { formatCurrency, formatDate, inDateRange, parseCurrencyString } from '../utils/formatters'
import { pushToast } from '../utils/toasts'

const SAVED_VIEWS_KEY = 'expense-filter-views'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const errorMessage = ref('')
const savedViews = ref(readSavedViews())
const calendarMonth = ref(new Date().toISOString().slice(0, 7))
const snapshot = ref({ properties: [], summary: { totalProperties: 0, totalExpenseRecords: 0, totalExpenseAmount: 0 } })
const filters = useQueryFilters(route, router, {
  property: '',
  category: '',
  year: '',
  start: '',
  end: '',
  search: ''
})

const allExpenseRows = computed(() =>
  snapshot.value.properties
    .flatMap((property) =>
      property.expenseRecords.map((expense) => ({
        ...expense,
        key: `${property.property_id}-${expense.expense_id}`,
        propertyName: property.name,
        amountValue: parseCurrencyString(expense.amount),
        year: expense.date.slice(0, 4)
      }))
    )
    .sort((left, right) => `${right.date}-${right.expense_id}`.localeCompare(`${left.date}-${left.expense_id}`))
)

const filteredExpenseRows = computed(() =>
  allExpenseRows.value.filter((row) => {
    const matchesProperty = !filters.property || row.propertyName === filters.property
    const matchesCategory = !filters.category || row.category === filters.category
    const matchesYear = !filters.year || row.year === filters.year
    const matchesRange = inDateRange(row.date, filters.start, filters.end)
    const search = filters.search.toLowerCase()
    const matchesSearch =
      !filters.search ||
      row.propertyName.toLowerCase().includes(search) ||
      (row.vendor || '').toLowerCase().includes(search) ||
      (row.description || '').toLowerCase().includes(search)

    return matchesProperty && matchesCategory && matchesYear && matchesRange && matchesSearch
  })
)

const propertyOptions = computed(() =>
  [...new Set(allExpenseRows.value.map((row) => row.propertyName))].sort((left, right) => left.localeCompare(right))
)

const categoryOptions = computed(() =>
  [...new Set(allExpenseRows.value.map((row) => row.category))].sort((left, right) => left.localeCompare(right))
)

const yearOptions = computed(() =>
  [...new Set(allExpenseRows.value.map((row) => row.year))].sort((left, right) => right.localeCompare(left))
)

const filteredExpenseTotal = computed(() =>
  filteredExpenseRows.value.reduce((sum, row) => sum + row.amountValue, 0)
)

const expenseByCategory = computed(() =>
  categoryOptions.value
    .map((category) => ({
      label: category,
      value: filteredExpenseRows.value
        .filter((row) => row.category === category)
        .reduce((sum, row) => sum + row.amountValue, 0)
    }))
    .filter((item) => item.value > 0)
)

const monthlyExpenseTrend = computed(() => {
  const buckets = new Map()

  filteredExpenseRows.value.forEach((row) => {
    const key = row.date.slice(0, 7)
    buckets.set(key, (buckets.get(key) || 0) + row.amountValue)
  })

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map(([key, total]) => ({
      label: key.slice(5),
      primary: total
    }))
})

const calendarDays = computed(() => {
  const [year, month] = calendarMonth.value.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const itemsByDate = new Map()

  filteredExpenseRows.value
    .filter((row) => row.date.startsWith(calendarMonth.value))
    .forEach((row) => {
      const bucket = itemsByDate.get(row.date) || []
      bucket.push(row)
      itemsByDate.set(row.date, bucket)
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

async function loadExpenseOverview() {
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

function exportExpenses() {
  downloadCsv(
    'expense-records.csv',
    filteredExpenseRows.value.map((row) => ({
      property: row.propertyName,
      date: row.date,
      category: row.category,
      vendor: row.vendor || '',
      amount: row.amount,
      description: row.description || ''
    }))
  )

  pushToast({
    title: 'Export ready',
    message: 'The filtered expense records were downloaded as CSV.',
    variant: 'success'
  })
}

function saveCurrentView() {
  const name = buildViewName()
  savedViews.value = [
    {
      id: crypto.randomUUID(),
      name,
      filters: { ...filters }
    },
    ...savedViews.value
  ].slice(0, 6)

  persistSavedViews()
  pushToast({
    title: 'View saved',
    message: `Saved "${name}" for quick expense filtering.`,
    variant: 'success'
  })
}

function applySavedView(view) {
  Object.assign(filters, view.filters)
  pushToast({
    title: 'View applied',
    message: `Applied "${view.name}".`,
    variant: 'info'
  })
}

function deleteSavedView(viewId) {
  savedViews.value = savedViews.value.filter((view) => view.id !== viewId)
  persistSavedViews()
}

function buildViewName() {
  const parts = [filters.property, filters.category, filters.year, filters.search ? 'Search' : ''].filter(Boolean)
  return parts.join(' · ') || 'Saved expense view'
}

function persistSavedViews() {
  window.localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(savedViews.value))
}

function readSavedViews() {
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_VIEWS_KEY) || '[]')
  } catch {
    return []
  }
}

onMounted(loadExpenseOverview)
</script>
