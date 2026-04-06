<template>
  <section class="card chart-card">
    <div class="section-heading">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h3>{{ title }}</h3>
      </div>
    </div>

    <div v-if="!points.length" class="chart-empty">
      No chart data available.
    </div>

    <div v-else class="chart-shell">
      <svg viewBox="0 0 420 220" class="chart-svg" role="img" :aria-label="title">
        <line x1="28" y1="180" x2="392" y2="180" class="chart-axis" />
        <polyline :points="polylinePoints(primaryValues)" class="chart-line chart-line-primary" />
        <polyline
          v-if="secondaryValues.length"
          :points="polylinePoints(secondaryValues)"
          class="chart-line chart-line-secondary"
        />

        <g v-for="(point, index) in primaryValues" :key="`${point.label}-primary`">
          <circle :cx="point.x" :cy="point.y" r="4" class="chart-point chart-point-primary" />
          <text :x="point.x" y="200" text-anchor="middle" class="chart-label">
            {{ compactLabel(point.label) }}
          </text>
          <text :x="point.x" :y="point.y - 10" text-anchor="middle" class="chart-value">
            {{ primaryFormatter(points[index].primary) }}
          </text>
        </g>

        <g v-for="point in secondaryValues" :key="`${point.label}-secondary`">
          <circle :cx="point.x" :cy="point.y" r="4" class="chart-point chart-point-secondary" />
        </g>
      </svg>

      <div v-if="secondaryLabel" class="chart-key">
        <span><i class="swatch swatch-primary"></i>{{ primaryLabel }}</span>
        <span><i class="swatch swatch-secondary"></i>{{ secondaryLabel }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  eyebrow: {
    type: String,
    default: 'Trend'
  },
  title: {
    type: String,
    required: true
  },
  points: {
    type: Array,
    default: () => []
  },
  primaryLabel: {
    type: String,
    default: 'Primary'
  },
  secondaryLabel: {
    type: String,
    default: ''
  },
  primaryFormatter: {
    type: Function,
    default: (value) => String(value)
  }
})

const primaryValues = computed(() => normalizeSeries('primary'))
const secondaryValues = computed(() => normalizeSeries('secondary'))

function normalizeSeries(key) {
  const values = props.points.map((point) => Number(point[key] || 0))
  const maxValue = Math.max(...values, 1)
  const spacing = props.points.length > 1 ? 320 / (props.points.length - 1) : 0

  return props.points.map((point, index) => ({
    label: point.label,
    x: 50 + index * spacing,
    y: 180 - (Number(point[key] || 0) / maxValue) * 120
  }))
}

function polylinePoints(values) {
  return values.map((value) => `${value.x},${value.y}`).join(' ')
}

function compactLabel(label) {
  return label.length > 6 ? label.slice(0, 6) : label
}
</script>
