<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Portfolio</p>
        <h2>Properties</h2>
        <p class="muted">
          Review every rental property fetched from the live API, with occupancy and record counts derived from backend responses.
        </p>
      </div>
      <div class="card-actions">
        <button class="button button-secondary" :disabled="loading" @click="loadProperties">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <RouterLink class="button button-primary" to="/properties/new">Add Property</RouterLink>
      </div>
    </div>

    <AlertMessage :message="flashMessage" variant="success" />
    <AlertMessage :message="errorMessage" variant="error" />

    <LoadingState v-if="loading" label="Loading properties..." />

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
        </div>

        <div class="filter-grid">
          <label>
            Search
            <input v-model.trim="filters.search" placeholder="Name, city, tenant, type..." />
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
            Sort By
            <select v-model="filters.sortBy">
              <option value="name">Name</option>
              <option value="rent-desc">Highest Rent</option>
              <option value="rent-asc">Lowest Rent</option>
              <option value="cashflow-desc">Highest Net Cash Flow</option>
              <option value="cashflow-asc">Lowest Net Cash Flow</option>
            </select>
          </label>
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
        />
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import { getPortfolioSnapshot } from '../api/dashboardService'
import AlertMessage from '../components/AlertMessage.vue'
import ConnectionPanel from '../components/ConnectionPanel.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import PropertyOverviewCard from '../components/PropertyOverviewCard.vue'
import StatCard from '../components/StatCard.vue'
import { formatCurrency } from '../utils/formatters'

const route = useRoute()
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'https://prop-mgmt-api-129124698283.us-central1.run.app'

const properties = ref([])
const apiStatus = ref(null)
const lastRefreshed = ref('')
const loading = ref(true)
const errorMessage = ref('')
const flashMessage = ref('')
const filters = reactive({
  search: '',
  occupancy: '',
  sortBy: 'name'
})
const summary = ref({
  totalProperties: 0,
  occupiedProperties: 0,
  vacantProperties: 0,
  estimatedMonthlyRentTotal: 0
})

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

      return matchesSearch && matchesOccupancy
    })
    .sort((left, right) => {
      if (filters.sortBy === 'rent-desc') {
        return right.monthlyRentValue - left.monthlyRentValue
      }

      if (filters.sortBy === 'rent-asc') {
        return left.monthlyRentValue - right.monthlyRentValue
      }

      if (filters.sortBy === 'cashflow-desc') {
        return right.netCashFlowValue - left.netCashFlowValue
      }

      if (filters.sortBy === 'cashflow-asc') {
        return left.netCashFlowValue - right.netCashFlowValue
      }

      return left.name.localeCompare(right.name)
    })
})

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

onMounted(() => {
  flashMessage.value = route.query.message || ''
  loadProperties()
})
</script>
