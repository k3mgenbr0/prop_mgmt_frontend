<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Portfolio</p>
        <h2>Properties</h2>
        <p class="muted">
          Review every rental property fetched from the live API, save filter views, and compare properties side by side.
        </p>
      </div>
      <div class="card-actions">
        <button class="button button-secondary" :disabled="loading" @click="loadProperties">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="button button-secondary" :disabled="filteredProperties.length === 0" @click="exportProperties">
          Export CSV
        </button>
        <button class="button button-secondary" :disabled="filteredProperties.length === 0" @click="saveCurrentView">
          Save View
        </button>
        <button class="button button-secondary" :disabled="compareProperties.length === 0" @click="clearCompare">
          Clear Compare
        </button>
        <RouterLink class="button button-primary" to="/properties/new">Add Property</RouterLink>
      </div>
    </div>

    <AlertMessage :message="flashMessage" variant="success" />
    <AlertMessage :message="errorMessage" variant="error" />

    <LoadingSkeleton v-if="loading" :count="4" />

    <template v-else>
      <div class="stats-grid">
        <StatCard label="Properties" :value="String(summary.totalProperties)" />
        <StatCard label="Occupied" :value="String(summary.occupiedProperties)" />
        <StatCard label="Vacant" :value="String(summary.vacantProperties)" />
        <StatCard label="Monthly Rent Total" :value="formatCurrency(summary.estimatedMonthlyRentTotal)" />
      </div>

      <section class="card filters-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Filters</p>
            <h3>Refine portfolio results</h3>
          </div>
          <p class="muted">Keyboard help: press `/` to focus search.</p>
        </div>

        <div class="filter-grid">
          <label>
            Search
            <input ref="searchInput" v-model.trim="filters.search" placeholder="Name, city, tenant, type..." />
          </label>

          <label>
            Occupancy
            <select v-model="filters.occupancy">
              <option value="">All properties</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
            </select>
          </label>

          <label>
            City
            <select v-model="filters.city">
              <option value="">All cities</option>
              <option v-for="city in cityOptions" :key="city" :value="city">{{ city }}</option>
            </select>
          </label>

          <label>
            Property Type
            <select v-model="filters.propertyType">
              <option value="">All types</option>
              <option v-for="propertyType in propertyTypeOptions" :key="propertyType" :value="propertyType">
                {{ propertyType }}
              </option>
            </select>
          </label>

          <label>
            Rent Status
            <select v-model="filters.rentStatus">
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="late">Late</option>
              <option value="vacant">Vacant</option>
            </select>
          </label>

          <label>
            Sort By
            <select v-model="filters.sortBy">
              <option value="name">Name</option>
              <option value="rent-desc">Highest Rent</option>
              <option value="rent-asc">Lowest Rent</option>
              <option value="cashflow-desc">Highest Net Cash Flow</option>
              <option value="cashflow-asc">Lowest Net Cash Flow</option>
              <option value="gap-desc">Largest Rent Gap</option>
            </select>
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

      <section v-if="compareProperties.length" class="card compare-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Compare</p>
            <h3>Property comparison</h3>
          </div>
          <p class="muted">Select up to 3 properties to compare rent, cash flow, and activity.</p>
        </div>

        <div class="compare-grid">
          <article v-for="property in compareProperties" :key="property.property_id" class="compare-card">
            <div class="card-header">
              <div>
                <strong>{{ property.name }}</strong>
                <p class="muted">{{ property.city }}, {{ property.state }}</p>
              </div>
              <button class="button button-secondary" @click="toggleCompare(property.property_id)">Remove</button>
            </div>

            <div class="mini-stats mini-stats-wide">
              <div>
                <span class="mini-label">Monthly Rent</span>
                <strong>{{ property.monthly_rent }}</strong>
              </div>
              <div>
                <span class="mini-label">Rent Status</span>
                <strong :class="['rent-status', `rent-status-${property.rentStatus}`]">
                  {{ getRentStatusLabel(property.rentStatus) }}
                </strong>
              </div>
              <div>
                <span class="mini-label">Net Cash Flow</span>
                <strong>{{ property.totals.net_cash_flow }}</strong>
              </div>
              <div>
                <span class="mini-label">Current Gap</span>
                <strong :class="property.paymentGapValue > 0 ? 'amount-negative' : 'amount-positive'">
                  {{ formatCurrency(property.paymentGapValue) }}
                </strong>
              </div>
              <div>
                <span class="mini-label">Income Records</span>
                <strong>{{ property.incomeRecordCount }}</strong>
              </div>
              <div>
                <span class="mini-label">Expense Records</span>
                <strong>{{ property.expenseRecordCount }}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <ConnectionPanel
        :api-base-url="apiBaseUrl"
        :api-status="apiStatus"
        :last-refreshed="lastRefreshed"
        :property-count="summary.totalProperties"
      />

      <EmptyState
        v-if="properties.length === 0"
        title="No properties yet"
        description="The API call completed successfully, but the backend returned no property records."
      />

      <EmptyState
        v-else-if="filteredProperties.length === 0"
        title="No properties match these filters"
        description="Try clearing one or more filters to show more properties from the live API."
      />

      <div v-else class="property-grid">
        <PropertyOverviewCard
          v-for="property in filteredProperties"
          :key="property.property_id"
          :property="property"
          :selected="comparisonIds.includes(property.property_id)"
          @toggle-compare="toggleCompare"
        />
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getPortfolioSnapshot } from '../api/dashboardService'
import { useQueryFilters } from '../composables/useQueryFilters'
import AlertMessage from '../components/AlertMessage.vue'
import ConnectionPanel from '../components/ConnectionPanel.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import PropertyOverviewCard from '../components/PropertyOverviewCard.vue'
import StatCard from '../components/StatCard.vue'
import { downloadCsv } from '../utils/exporters'
import { formatCurrency } from '../utils/formatters'
import { pushToast } from '../utils/toasts'

const SAVED_VIEWS_KEY = 'property-filter-views'

const route = useRoute()
const router = useRouter()
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'https://prop-mgmt-api-129124698283.us-central1.run.app'

const properties = ref([])
const apiStatus = ref(null)
const lastRefreshed = ref('')
const loading = ref(true)
const errorMessage = ref('')
const flashMessage = ref('')
const savedViews = ref(readSavedViews())
const comparisonIds = ref([])
const searchInput = ref(null)
const filters = useQueryFilters(route, router, {
  search: '',
  occupancy: '',
  city: '',
  propertyType: '',
  rentStatus: '',
  sortBy: 'name'
})
const summary = ref({
  totalProperties: 0,
  occupiedProperties: 0,
  vacantProperties: 0,
  estimatedMonthlyRentTotal: 0
})

const cityOptions = computed(() =>
  [...new Set(properties.value.map((property) => property.city))].sort((left, right) => left.localeCompare(right))
)

const propertyTypeOptions = computed(() =>
  [...new Set(properties.value.map((property) => property.property_type))].sort((left, right) =>
    left.localeCompare(right)
  )
)

const filteredProperties = computed(() => {
  const query = filters.search.toLowerCase()

  return [...properties.value]
    .filter((property) => {
      const matchesSearch =
        !query ||
        property.name.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        property.property_type.toLowerCase().includes(query) ||
        (property.tenant_name || '').toLowerCase().includes(query)

      const matchesOccupancy =
        !filters.occupancy ||
        (filters.occupancy === 'occupied' && property.occupied) ||
        (filters.occupancy === 'vacant' && !property.occupied)

      const matchesCity = !filters.city || property.city === filters.city
      const matchesType = !filters.propertyType || property.property_type === filters.propertyType
      const matchesRentStatus = !filters.rentStatus || property.rentStatus === filters.rentStatus

      return matchesSearch && matchesOccupancy && matchesCity && matchesType && matchesRentStatus
    })
    .sort((left, right) => {
      if (filters.sortBy === 'rent-desc') return right.monthlyRentValue - left.monthlyRentValue
      if (filters.sortBy === 'rent-asc') return left.monthlyRentValue - right.monthlyRentValue
      if (filters.sortBy === 'cashflow-desc') return right.netCashFlowValue - left.netCashFlowValue
      if (filters.sortBy === 'cashflow-asc') return left.netCashFlowValue - right.netCashFlowValue
      if (filters.sortBy === 'gap-desc') return right.paymentGapValue - left.paymentGapValue
      return left.name.localeCompare(right.name)
    })
})

const compareProperties = computed(() =>
  comparisonIds.value
    .map((propertyId) => properties.value.find((property) => property.property_id === propertyId))
    .filter(Boolean)
)

async function loadProperties() {
  loading.value = true
  errorMessage.value = ''

  try {
    const snapshot = await getPortfolioSnapshot()
    properties.value = snapshot.properties
    apiStatus.value = snapshot.apiStatus
    lastRefreshed.value = snapshot.lastRefreshed
    summary.value = snapshot.summary
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

function toggleCompare(propertyId) {
  if (comparisonIds.value.includes(propertyId)) {
    comparisonIds.value = comparisonIds.value.filter((id) => id !== propertyId)
    return
  }

  if (comparisonIds.value.length >= 3) {
    pushToast({
      title: 'Comparison limit reached',
      message: 'You can compare up to 3 properties at a time.',
      variant: 'info'
    })
    return
  }

  comparisonIds.value = [...comparisonIds.value, propertyId]
}

function clearCompare() {
  comparisonIds.value = []
}

function exportProperties() {
  downloadCsv(
    'properties.csv',
    filteredProperties.value.map((property) => ({
      property_id: property.property_id,
      name: property.name,
      property_type: property.property_type,
      city: property.city,
      state: property.state,
      tenant_name: property.tenant_name || '',
      rent_status: property.rentStatus,
      monthly_rent: property.monthly_rent,
      current_month_income: formatCurrency(property.currentMonthIncomeValue),
      current_gap: formatCurrency(property.paymentGapValue),
      income_records: property.incomeRecordCount,
      expense_records: property.expenseRecordCount,
      net_cash_flow: property.totals.net_cash_flow
    }))
  )

  pushToast({
    title: 'Export ready',
    message: 'The filtered property list was downloaded as CSV.',
    variant: 'success'
  })
}

function saveCurrentView() {
  const name = buildViewName()
  const nextViews = [
    {
      id: crypto.randomUUID(),
      name,
      filters: { ...filters }
    },
    ...savedViews.value
  ].slice(0, 6)

  savedViews.value = nextViews
  persistSavedViews()

  pushToast({
    title: 'View saved',
    message: `Saved "${name}" for quick access later.`,
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
  const parts = [
    filters.rentStatus ? `${getRentStatusLabel(filters.rentStatus)} rent` : '',
    filters.city || '',
    filters.propertyType || '',
    filters.occupancy || ''
  ].filter(Boolean)

  return parts.join(' · ') || 'Saved property view'
}

function getRentStatusLabel(status) {
  if (status === 'paid') return 'Paid'
  if (status === 'partial') return 'Partial'
  if (status === 'late') return 'Late'
  return 'Vacant'
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

function handleKeydown(event) {
  if (event.key === '/' && !isTypingIntoField(event.target)) {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

function isTypingIntoField(target) {
  const tagName = target?.tagName?.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || target?.isContentEditable
}

onMounted(() => {
  flashMessage.value = route.query.message || ''
  loadProperties()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
