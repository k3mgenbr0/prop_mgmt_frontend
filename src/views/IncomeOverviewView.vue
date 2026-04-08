<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Income</p>
        <h2>Income Activity</h2>
        <p class="muted">This view aggregates live income records fetched property by property from the backend.</p>
      </div>
      <div class="card-actions">
        <button class="button button-secondary" :disabled="loading" @click="loadIncomeOverview">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="button button-secondary" :disabled="filteredIncomeRows.length === 0" @click="exportIncome">
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
        <StatCard label="Income Records" :value="String(filteredIncomeRows.length)" />
        <StatCard label="Total Income" :value="formatCurrency(filteredIncomeTotal)" />
      </div>

      <section class="card filters-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Filters</p>
            <h3>Refine live income records</h3>
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
            Search Description
            <input v-model.trim="filters.search" placeholder="Rent, back payment, April..." />
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
          title="Income by month"
          :points="monthlyIncomeTrend"
          primary-label="Income"
          :primary-formatter="formatCurrency"
        />

        <SimpleBarChart
          eyebrow="Top Properties"
          title="Income by property"
          :items="incomeByProperty"
          :value-formatter="formatCurrency"
          @select="filters.property = $event"
        />
      </div>

      <section class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Calendar</p>
            <h3>Income calendar view</h3>
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
                <strong class="amount-positive">{{ item.amount }}</strong>
                <span class="muted">{{ item.propertyName }}</span>
              </div>
            </div>

            <p v-else class="muted">No income</p>
          </article>
        </div>
      </section>

      <EmptyState
        v-if="allIncomeRows.length === 0"
        title="No income records returned"
        description="The frontend reached the backend, but there are no income rows to display."
      />

      <EmptyState
        v-else-if="filteredIncomeRows.length === 0"
        title="No income records match these filters"
        description="Try clearing one or more filters to show more live income records."
      />

      <div v-else class="record-list">
        <article v-for="row in filteredIncomeRows" :key="row.key" class="card record-card">
          <div class="card-header">
            <div>
              <strong>{{ row.amount }}</strong>
              <p class="muted">{{ row.propertyName }}</p>
            </div>
            <span class="muted">{{ formatDate(row.date) }}</span>
          </div>
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

const SAVED_VIEWS_KEY = 'income-filter-views'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const errorMessage = ref('')
const savedViews = ref(readSavedViews())
const calendarMonth = ref(new Date().toISOString().slice(0, 7))
const snapshot = ref({ properties: [], summary: { totalProperties: 0, totalIncomeRecords: 0, totalIncomeAmount: 0 } })
const filters = useQueryFilters(route, router, {
  property: '',
  year: '',
  start: '',
  end: '',
  search: ''
})

const allIncomeRows = computed(() =>
  snapshot.value.properties
    .flatMap((property) =>
      property.incomeRecords.map((income) => ({
        ...income,
        key: `${property.property_id}-${income.income_id}`,
        propertyName: property.name,
        amountValue: parseCurrencyString(income.amount),
        year: income.date.slice(0, 4)
      }))
    )
    .sort((left, right) => `${right.date}-${right.income_id}`.localeCompare(`${left.date}-${left.income_id}`))
)

const filteredIncomeRows = computed(() =>
  allIncomeRows.value.filter((row) => {
    const matchesProperty = !filters.property || row.propertyName === filters.property
    const matchesYear = !filters.year || row.year === filters.year
    const matchesRange = inDateRange(row.date, filters.start, filters.end)
    const matchesSearch =
      !filters.search ||
      row.propertyName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (row.description || '').toLowerCase().includes(filters.search.toLowerCase())

    return matchesProperty && matchesYear && matchesRange && matchesSearch
  })
)

const propertyOptions = computed(() =>
  [...new Set(allIncomeRows.value.map((row) => row.propertyName))].sort((left, right) => left.localeCompare(right))
)

const yearOptions = computed(() =>
  [...new Set(allIncomeRows.value.map((row) => row.year))].sort((left, right) => right.localeCompare(left))
)

const filteredIncomeTotal = computed(() =>
  filteredIncomeRows.value.reduce((sum, row) => sum + row.amountValue, 0)
)

const incomeByProperty = computed(() =>
  propertyOptions.value
    .map((propertyName) => ({
      label: propertyName,
      value: filteredIncomeRows.value
        .filter((row) => row.propertyName === propertyName)
        .reduce((sum, row) => sum + row.amountValue, 0)
    }))
    .filter((item) => item.value > 0)
)

const monthlyIncomeTrend = computed(() => {
  const buckets = new Map()

  filteredIncomeRows.value.forEach((row) => {
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

  filteredIncomeRows.value
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

async function loadIncomeOverview() {
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

function exportIncome() {
  downloadCsv(
    'income-records.csv',
    filteredIncomeRows.value.map((row) => ({
      property: row.propertyName,
      date: row.date,
      amount: row.amount,
      description: row.description || ''
    }))
  )

  pushToast({
    title: 'Export ready',
    message: 'The filtered income records were downloaded as CSV.',
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
    message: `Saved "${name}" for quick income filtering.`,
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
  const parts = [filters.property, filters.year, filters.search ? 'Search' : ''].filter(Boolean)
  return parts.join(' · ') || 'Saved income view'
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

onMounted(loadIncomeOverview)
</script>
