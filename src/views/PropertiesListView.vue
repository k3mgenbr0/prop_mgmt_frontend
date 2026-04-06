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

      <div v-else class="property-grid">
        <PropertyOverviewCard
          v-for="property in properties"
          :key="property.property_id"
          :property="property"
        />
      </div>
    </template>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
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
const summary = ref({
  totalProperties: 0,
  occupiedProperties: 0,
  vacantProperties: 0,
  estimatedMonthlyRentTotal: 0
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
