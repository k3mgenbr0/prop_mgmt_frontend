<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <SidebarNav />

    <div class="app-main">
      <header class="topbar">
        <div class="topbar-brand">
          <p class="eyebrow">Property Management App</p>
          <h1>Property Operations</h1>
          <p class="muted topbar-copy">
            Manage properties, rent activity, expenses, and reporting from one place.
          </p>
          <div class="topbar-pills">
            <span class="topbar-pill">Live API</span>
            <span class="topbar-pill">Cloud Run</span>
            <span class="topbar-pill">Portfolio Workspace</span>
          </div>
        </div>
        <nav class="topnav">
          <div class="topnav-links">
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/dashboard">Dashboard</RouterLink>
            <RouterLink to="/properties">Properties</RouterLink>
            <RouterLink to="/reports">Reports</RouterLink>
          </div>
          <div class="topnav-actions">
            <RouterLink to="/properties/new">Add Property</RouterLink>
            <button class="button button-theme" @click="toggleTheme">
              {{ isDark ? 'Light Mode' : 'Dark Mode' }}
            </button>
          </div>
        </nav>
      </header>

      <main id="main-content" class="page-shell" tabindex="-1">
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
