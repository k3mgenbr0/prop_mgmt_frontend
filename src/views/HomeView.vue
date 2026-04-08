<template>
  <section class="stack-lg">
    <section class="card home-hero">
      <div class="stack-md">
        <p class="eyebrow">Welcome</p>
        <h2>Choose where you want to start</h2>
        <p class="muted">
          This landing page is designed for quick orientation during demos and user testing. Pick the workflow that
          matches what you want to do first.
        </p>
      </div>

      <div class="home-actions">
        <RouterLink class="button button-primary" to="/dashboard">Open Dashboard</RouterLink>
        <RouterLink class="button button-secondary" to="/properties">Browse Properties</RouterLink>
      </div>
    </section>

    <div class="home-grid">
      <RouterLink class="card home-card" to="/dashboard">
        <p class="eyebrow">Overview</p>
        <h3>Dashboard</h3>
        <p class="muted">See portfolio metrics, payment gaps, rankings, and the live API status panel.</p>
      </RouterLink>

      <RouterLink class="card home-card" to="/properties">
        <p class="eyebrow">Manage</p>
        <h3>Properties</h3>
        <p class="muted">Search, filter, compare properties, and jump into detail pages quickly.</p>
      </RouterLink>

      <RouterLink class="card home-card" to="/properties/new">
        <p class="eyebrow">Create</p>
        <h3>Add Property</h3>
        <p class="muted">Start a new property record when you want to demo data entry immediately.</p>
      </RouterLink>

      <RouterLink class="card home-card" to="/income">
        <p class="eyebrow">Track</p>
        <h3>Income</h3>
        <p class="muted">Review filtered income records, charts, saved views, and the month calendar.</p>
      </RouterLink>

      <RouterLink class="card home-card" to="/expenses">
        <p class="eyebrow">Track</p>
        <h3>Expenses</h3>
        <p class="muted">Review expense categories, trends, saved views, and the month calendar.</p>
      </RouterLink>

      <RouterLink class="card home-card" to="/reports">
        <p class="eyebrow">Report</p>
        <h3>Reports</h3>
        <p class="muted">Use printable summaries, presets, exports, and the portfolio activity calendar.</p>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
