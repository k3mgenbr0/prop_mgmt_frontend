<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Property Management App</p>
        <h1>Landlord Dashboard</h1>
      </div>
      <nav class="topnav">
        <RouterLink to="/">Properties</RouterLink>
        <RouterLink to="/properties/new">Add Property</RouterLink>
      </nav>
    </header>

    <main class="page-shell">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>
