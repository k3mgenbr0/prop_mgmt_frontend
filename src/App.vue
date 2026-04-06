<template>
  <div class="app-shell">
    <SidebarNav />

    <div class="app-main">
      <header class="topbar">
        <div>
          <p class="eyebrow">Property Management App</p>
          <h1>Landlord Dashboard</h1>
          <p class="muted topbar-copy">
            Live portfolio management connected to your backend API and database.
          </p>
        </div>
        <nav class="topnav">
          <RouterLink to="/">Dashboard</RouterLink>
          <RouterLink to="/properties">Properties</RouterLink>
          <RouterLink to="/properties/new">Add Property</RouterLink>
        </nav>
      </header>

      <main class="page-shell">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import SidebarNav from './components/SidebarNav.vue'
</script>
