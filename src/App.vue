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
          <button class="button button-theme" @click="toggleTheme">
            {{ isDark ? 'Light Mode' : 'Dark Mode' }}
          </button>
        </nav>
      </header>

      <main class="page-shell">
        <RouterView />
      </main>
    </div>

    <ToastStack />
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import SidebarNav from './components/SidebarNav.vue'
import { useTheme } from './composables/useTheme'
import ToastStack from './components/ToastStack.vue'

const { isDark, toggleTheme } = useTheme()
</script>
