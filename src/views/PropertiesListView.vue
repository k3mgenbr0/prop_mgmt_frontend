<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Portfolio</p>
        <h2>Properties</h2>
        <p class="muted">
          Review every rental property, jump into details, and create new records using the live API.
        </p>
        <p v-if="apiStatus" class="muted">
          Connected to {{ apiStatus.storage }} via {{ apiStatus.deployment }} · v{{ apiStatus.version }}
        </p>
      </div>
      <RouterLink class="button button-primary" to="/properties/new">Add Property</RouterLink>
    </div>

    <AlertMessage :message="flashMessage" variant="success" />
    <AlertMessage :message="errorMessage" variant="error" />

    <LoadingState v-if="loading" label="Loading properties..." />

    <EmptyState
      v-else-if="properties.length === 0"
      title="No properties yet"
      description="Create your first property to start tracking rent, income, and expenses."
    />

    <div v-else class="property-grid">
      <article v-for="property in properties" :key="property.property_id" class="card property-card">
        <div class="stack-sm">
          <div class="card-header">
            <div>
              <h3>{{ property.name }}</h3>
              <p class="muted">{{ property.property_type }}</p>
            </div>
            <span class="pill">{{ property.monthly_rent }}/mo</span>
          </div>

          <p>{{ property.address }}</p>
          <p class="muted">{{ property.city }}, {{ property.state }} {{ property.postal_code }}</p>
          <p class="muted">Tenant: {{ property.tenant_name || 'Vacant / not listed' }}</p>
        </div>

        <div class="card-actions">
          <RouterLink class="button button-secondary" :to="`/properties/${property.property_id}`">
            View Details
          </RouterLink>
          <RouterLink class="button button-secondary" :to="`/properties/${property.property_id}/edit`">
            Edit
          </RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import { getApiStatus, getProperties } from '../api/propertyService'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'

const route = useRoute()
const properties = ref([])
const apiStatus = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const flashMessage = ref('')

async function loadProperties() {
  loading.value = true
  errorMessage.value = ''

  try {
    properties.value = await getProperties()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

async function loadApiStatus() {
  try {
    apiStatus.value = await getApiStatus()
  } catch {
    apiStatus.value = null
  }
}

onMounted(() => {
  flashMessage.value = route.query.message || ''
  loadApiStatus()
  loadProperties()
})
</script>
