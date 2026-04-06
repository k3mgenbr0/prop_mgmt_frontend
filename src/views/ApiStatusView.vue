<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">API Status</p>
        <h2>Backend Connectivity</h2>
        <p class="muted">Use this page to prove the frontend is talking to the real backend environment.</p>
      </div>
      <button class="button button-secondary" :disabled="loading" @click="loadStatus">
        {{ loading ? 'Checking...' : 'Check Again' }}
      </button>
    </div>

    <AlertMessage :message="errorMessage" variant="error" />
    <LoadingState v-if="loading" label="Checking API connectivity..." />

    <template v-else>
      <ConnectionPanel
        :api-base-url="apiBaseUrl"
        :api-status="apiStatus"
        :last-refreshed="lastRefreshed"
        :property-count="propertyCount"
      />

      <section class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Verification</p>
            <h3>What this page proves</h3>
          </div>
        </div>

        <div class="record-list">
          <p>The API base URL shown above is the one configured in the frontend environment.</p>
          <p>The storage and deployment values are read from the backend root endpoint.</p>
          <p>The property count is fetched from the live `/properties` endpoint, not hardcoded in the UI.</p>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getApiStatus, getProperties } from '../api/propertyService'
import AlertMessage from '../components/AlertMessage.vue'
import ConnectionPanel from '../components/ConnectionPanel.vue'
import LoadingState from '../components/LoadingState.vue'

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'https://prop-mgmt-api-129124698283.us-central1.run.app'

const loading = ref(true)
const errorMessage = ref('')
const apiStatus = ref(null)
const propertyCount = ref(0)
const lastRefreshed = ref('')

async function loadStatus() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [status, properties] = await Promise.all([getApiStatus(), getProperties()])
    apiStatus.value = status
    propertyCount.value = properties.length
    lastRefreshed.value = new Date().toISOString()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

onMounted(loadStatus)
</script>
