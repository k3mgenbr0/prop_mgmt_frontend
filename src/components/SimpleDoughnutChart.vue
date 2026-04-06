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

    <div v-else class="doughnut-layout">
      <div class="doughnut-ring" :style="{ background: gradient }">
        <div class="doughnut-hole">
          <strong>{{ centerLabel }}</strong>
        </div>
      </div>

      <div class="chart-legend">
        <div v-for="item in decoratedItems" :key="item.label" class="chart-legend-row">
          <span><i class="swatch" :style="{ background: item.color }"></i>{{ item.label }}</span>
          <strong>{{ valueFormatter(item.value) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const colors = ['#5a54f9', '#3ba272', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']

const props = defineProps({
  eyebrow: {
    type: String,
    default: 'Breakdown'
  },
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  centerLabel: {
    type: String,
    default: 'Live'
  },
  valueFormatter: {
    type: Function,
    default: (value) => String(value)
  }
})

const decoratedItems = computed(() =>
  props.items.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }))
)

const gradient = computed(() => {
  const total = decoratedItems.value.reduce((sum, item) => sum + item.value, 0)

  if (!total) {
    return 'conic-gradient(#d7dee8 0deg 360deg)'
  }

  let start = 0
  const stops = decoratedItems.value.map((item) => {
    const angle = (item.value / total) * 360
    const stop = `${item.color} ${start}deg ${start + angle}deg`
    start += angle
    return stop
  })

  return `conic-gradient(${stops.join(', ')})`
})
</script>
