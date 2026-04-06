<template>
  <section class="card chart-card">
    <div class="section-heading">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h3>{{ title }}</h3>
      </div>
    </div>

    <div v-if="!items.length" class="chart-empty">
      No chart data available.
    </div>

    <div v-else class="chart-shell">
      <svg viewBox="0 0 360 180" class="chart-svg" role="img" :aria-label="title">
        <line x1="24" y1="150" x2="340" y2="150" class="chart-axis" />
        <g v-for="(item, index) in normalizedItems" :key="item.label" class="chart-clickable" @click="emit('select', item.label)">
          <rect
            :x="40 + index * barSpacing"
            :y="150 - item.height"
            :width="barWidth"
            :height="item.height"
            rx="8"
            class="chart-bar"
          />
          <text
            :x="40 + index * barSpacing + barWidth / 2"
            y="168"
            text-anchor="middle"
            class="chart-label"
          >
            {{ truncateLabel(item.label) }}
          </text>
        </g>
      </svg>

      <div class="chart-legend">
        <div v-for="item in items" :key="item.label" class="chart-legend-row chart-clickable" @click="emit('select', item.label)">
          <span>{{ item.label }}</span>
          <strong>{{ valueFormatter(item.value) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  eyebrow: {
    type: String,
    default: 'Chart'
  },
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  valueFormatter: {
    type: Function,
    default: (value) => String(value)
  }
})

const emit = defineEmits(['select'])

const barWidth = 42
const barSpacing = 62

const normalizedItems = computed(() => {
  const maxValue = Math.max(...props.items.map((item) => item.value), 1)

  return props.items.map((item) => ({
    ...item,
    height: Math.max(10, (item.value / maxValue) * 108)
  }))
})

function truncateLabel(label) {
  return label.length > 8 ? `${label.slice(0, 8)}...` : label
}
</script>
