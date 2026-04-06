<template>
  <section class="card connection-card">
    <div class="section-heading">
      <div>
        <p class="eyebrow">API Connection</p>
        <h3>Connected to live backend</h3>
      </div>
      <span :class="['status-badge', connected ? 'status-online' : 'status-offline']">
        {{ connected ? 'Connected' : 'Unavailable' }}
      </span>
    </div>

    <dl class="meta-grid">
      <div>
        <dt>API Base URL</dt>
        <dd>{{ apiBaseUrl }}</dd>
      </div>
      <div>
        <dt>Storage</dt>
        <dd>{{ apiStatus?.storage || 'Unknown' }}</dd>
      </div>
      <div>
        <dt>Deployment</dt>
        <dd>{{ apiStatus?.deployment || 'Unknown' }}</dd>
      </div>
      <div>
        <dt>Version</dt>
        <dd>{{ apiStatus?.version || 'Unknown' }}</dd>
      </div>
      <div>
        <dt>Last Refreshed</dt>
        <dd>{{ lastRefreshed ? formatDateTime(lastRefreshed) : 'Not refreshed yet' }}</dd>
      </div>
      <div>
        <dt>Properties Loaded</dt>
        <dd>{{ propertyCount }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  apiStatus: {
    type: Object,
    default: null
  },
  apiBaseUrl: {
    type: String,
    required: true
  },
  lastRefreshed: {
    type: String,
    default: ''
  },
  propertyCount: {
    type: Number,
    default: 0
  }
})

const connected = computed(() => Boolean(props.apiStatus))

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}
</script>
